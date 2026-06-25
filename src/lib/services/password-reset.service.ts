import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { db } from '@white-shop/db';
import { bumpSessionEpoch } from '@/lib/auth/auth-session-store';
import { createAuthToken } from '@/lib/auth/create-auth-token';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password.constants';
import {
  PASSWORD_RESET_REQUEST_ACK,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from '@/lib/auth/password-reset.constants';
import { sendTransactionalEmail } from '@/lib/email/send-transactional-email';
import { problemTypes } from '@/lib/http/problem-details';
import { mfaService } from '@/lib/services/mfa.service';
import { logger } from '@/lib/utils/logger';

export type ResetPasswordAuthenticatedResult = {
  kind: 'authenticated';
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    roles: string[];
  };
  token: string;
};

export type ResetPasswordMfaRequiredResult = {
  kind: 'mfa_required';
  mfaToken: string;
};

export type ResetPasswordResult =
  | ResetPasswordAuthenticatedResult
  | ResetPasswordMfaRequiredResult;

function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function resolveAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim()
    || process.env.APP_URL?.trim()
    || 'http://localhost:3000'
  );
}

function createRawResetToken(): string {
  return randomBytes(32).toString('hex');
}

function buildResetVerifyUrl(rawToken: string): string {
  return `${resolveAppBaseUrl()}/api/v1/auth/reset-password/verify?token=${encodeURIComponent(rawToken)}`;
}

class PasswordResetService {
  async requestReset(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null, blocked: false },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user?.email || !user.passwordHash) {
      return { message: PASSWORD_RESET_REQUEST_ACK };
    }

    const rawToken = createRawResetToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashResetToken(rawToken),
        passwordResetExpires: expiresAt,
      },
    });

    const resetUrl = buildResetVerifyUrl(rawToken);
    try {
      const emailResult = await sendTransactionalEmail({
        to: user.email,
        subject: 'Reset your Degusto password',
        text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
        html: `<p>Reset your password:</p><p><a href="${resetUrl}">Continue to reset password</a></p><p>This link expires in 1 hour.</p>`,
      });
      if (!emailResult.sent && process.env.NODE_ENV === 'development') {
        logger.warn('[PASSWORD RESET] Email not configured — dev reset URL', { resetUrl });
      }
    } catch (error) {
      logger.error('[PASSWORD RESET] Failed to send email', { userId: user.id, error });
    }

    return { message: PASSWORD_RESET_REQUEST_ACK };
  }

  /** Validates a reset token without consuming it (for verify redirect). */
  async validateResetToken(rawToken: string): Promise<boolean> {
    const tokenHash = hashResetToken(rawToken.trim());
    const user = await db.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
        deletedAt: null,
        blocked: false,
      },
      select: { id: true },
    });
    return Boolean(user);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<ResetPasswordResult> {
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: 'Validation Error',
        detail: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      };
    }

    const tokenHash = hashResetToken(rawToken.trim());
    const user = await db.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
        deletedAt: null,
        blocked: false,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roles: true,
      },
    });

    if (!user) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: 'Invalid or expired token',
        detail: 'Password reset link is invalid or has expired',
      };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    await bumpSessionEpoch(user.id);

    if (await mfaService.shouldRequireMfa(user.id)) {
      const challenge = mfaService.createChallenge(user.id);
      return { kind: 'mfa_required', mfaToken: challenge.mfaToken };
    }

    const token = await createAuthToken(user.id, user.roles);
    return {
      kind: 'authenticated',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
      token,
    };
  }
}

export const passwordResetService = new PasswordResetService();
