import * as jwt from 'jsonwebtoken';

const MFA_CHALLENGE_PURPOSE = 'mfa_challenge';
const MFA_CHALLENGE_TTL = '5m';

type MfaChallengePayload = {
  userId: string;
  purpose: typeof MFA_CHALLENGE_PURPOSE;
};

function readSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

/** Short-lived token between password login and MFA verification. */
export function createMfaChallengeToken(userId: string): string {
  return jwt.sign(
    { userId, purpose: MFA_CHALLENGE_PURPOSE } satisfies MfaChallengePayload,
    readSecret(),
    { expiresIn: MFA_CHALLENGE_TTL },
  );
}

/** Returns user id when the MFA challenge token is valid. */
export function verifyMfaChallengeToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, readSecret()) as Partial<MfaChallengePayload>;
    if (decoded.purpose !== MFA_CHALLENGE_PURPOSE || typeof decoded.userId !== 'string') {
      return null;
    }
    return decoded.userId;
  } catch {
    return null;
  }
}
