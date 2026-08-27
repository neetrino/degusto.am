import { hash, verify } from "@node-rs/argon2";
import { verify as verifyBcrypt } from "@node-rs/bcrypt";

/** Argon2id algorithm id from @node-rs/argon2 (avoids ambient const enum). */
const ARGON2ID = 2;

const ARGON2_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

const BCRYPT_PREFIX = /^\$2[abxy]\$/;
const ARGON2_PREFIX = /^\$argon2/i;

/** Hash a password with Argon2id for durable credential storage. */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** True when a stored hash should be upgraded to Argon2id after a successful login. */
export function needsPasswordRehash(passwordHash: string): boolean {
  return BCRYPT_PREFIX.test(passwordHash);
}

/** Verify a password against Argon2id or a legacy Laravel bcrypt hash. */
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  if (BCRYPT_PREFIX.test(passwordHash)) {
    return verifyLegacyBcrypt(password, passwordHash);
  }
  if (ARGON2_PREFIX.test(passwordHash)) {
    return verifyArgon2(password, passwordHash);
  }
  return false;
}

async function verifyArgon2(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}

async function verifyLegacyBcrypt(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await verifyBcrypt(password, passwordHash);
  } catch {
    return false;
  }
}
