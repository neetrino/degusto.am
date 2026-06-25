import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;

function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function decodeBase32(input: string): Buffer {
  const normalized = input.replace(/=+$/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) {
      throw new Error('Invalid base32 secret');
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', secret).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 10 ** TOTP_DIGITS;
  return code.toString().padStart(TOTP_DIGITS, '0');
}

/** Generates a new base32 TOTP secret for authenticator apps. */
export function generateTotpSecret(): string {
  return encodeBase32(randomBytes(20));
}

/** Builds an `otpauth://` URI for QR codes. */
export function buildTotpAuthUri(secret: string, accountName: string): string {
  const issuer = 'Degusto';
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
}

/** Verifies a 6-digit TOTP code with a small time window. */
export function verifyTotpCode(secret: string, code: string): boolean {
  const normalizedCode = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const secretBuffer = decodeBase32(secret);
  const currentStep = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    const expected = hotp(secretBuffer, currentStep + offset);
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(normalizedCode);
    if (
      expectedBuffer.length === actualBuffer.length
      && timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      return true;
    }
  }

  return false;
}
