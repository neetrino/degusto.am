import { db } from '@white-shop/db';
import { createAuthToken } from '@/lib/auth/create-auth-token';
import { createMfaChallengeToken, verifyMfaChallengeToken } from '@/lib/auth/mfa-challenge-token';
import { buildTotpAuthUri, generateTotpSecret, verifyTotpCode } from '@/lib/auth/totp';
import { userHasAdminRole } from '@/lib/auth/user-roles.constants';
import { problemTypes } from '@/lib/http/problem-details';
import { logger } from '@/lib/utils/logger';

export type AuthUserPayload = {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
};

class MfaService {
  async shouldRequireMfa(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, mfaTotpSecret: true, roles: true },
    });
    return Boolean(
      user
      && userHasAdminRole(user.roles)
      && user.mfaEnabled
      && user.mfaTotpSecret,
    );
  }

  createChallenge(userId: string): { mfaToken: string } {
    return { mfaToken: createMfaChallengeToken(userId) };
  }

  async beginSetup(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, roles: true },
    });
    if (!user || !userHasAdminRole(user.roles)) {
      throw {
        status: 403,
        type: problemTypes.forbidden,
        title: 'Forbidden',
        detail: 'Admin access required',
      };
    }

    const secret = generateTotpSecret();
    const accountName = user.email ?? userId;
    return {
      secret,
      otpauthUrl: buildTotpAuthUri(secret, accountName),
    };
  }

  async confirmSetup(userId: string, secret: string, code: string) {
    if (!verifyTotpCode(secret, code)) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: 'Validation Error',
        detail: 'Invalid authentication code',
      };
    }

    await db.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaTotpSecret: secret },
      select: { id: true },
    });

    logger.info('[MFA] Enabled for admin user', { userId });
    return { enabled: true };
  }

  async disable(userId: string, code: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, mfaTotpSecret: true },
    });
    if (!user?.mfaEnabled || !user.mfaTotpSecret) {
      return { enabled: false };
    }
    if (!verifyTotpCode(user.mfaTotpSecret, code)) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: 'Validation Error',
        detail: 'Invalid authentication code',
      };
    }

    await db.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaTotpSecret: null },
      select: { id: true },
    });

    return { enabled: false };
  }

  async verifyChallenge(
    mfaToken: string,
    code: string,
  ): Promise<{ user: AuthUserPayload; token: string }> {
    const userId = verifyMfaChallengeToken(mfaToken);
    if (!userId) {
      throw {
        status: 401,
        type: problemTypes.unauthorized,
        title: 'Unauthorized',
        detail: 'MFA challenge expired or invalid',
      };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roles: true,
        blocked: true,
        deletedAt: true,
        mfaEnabled: true,
        mfaTotpSecret: true,
      },
    });

    if (
      !user
      || user.blocked
      || user.deletedAt
      || !user.mfaEnabled
      || !user.mfaTotpSecret
      || !verifyTotpCode(user.mfaTotpSecret, code)
    ) {
      throw {
        status: 401,
        type: problemTypes.unauthorized,
        title: 'Unauthorized',
        detail: 'Invalid authentication code',
      };
    }

    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
    };
    const token = await createAuthToken(user.id, user.roles);
    return { user: payload, token };
  }
}

export const mfaService = new MfaService();
