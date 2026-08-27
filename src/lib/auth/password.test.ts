import { describe, expect, it } from "vitest";

import {
  hashPassword,
  needsPasswordRehash,
  verifyPassword,
} from "@/lib/auth/password";

/** Public Laravel bcrypt fixture for plaintext `password`. */
const LARAVEL_BCRYPT_PASSWORD =
  "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi";

describe("password hashing", () => {
  it("hashes and verifies with Argon2id", async () => {
    const hashed = await hashPassword("correct-horse-battery");
    expect(hashed).not.toContain("correct-horse-battery");
    expect(needsPasswordRehash(hashed)).toBe(false);
    await expect(verifyPassword("correct-horse-battery", hashed)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("wrong-password", hashed)).resolves.toBe(false);
  });

  it("verifies a Laravel-style bcrypt $2y$ hash and marks it for rehash", async () => {
    expect(needsPasswordRehash(LARAVEL_BCRYPT_PASSWORD)).toBe(true);
    await expect(
      verifyPassword("password", LARAVEL_BCRYPT_PASSWORD),
    ).resolves.toBe(true);
    await expect(
      verifyPassword("wrong-password", LARAVEL_BCRYPT_PASSWORD),
    ).resolves.toBe(false);
  });

  it("rejects unknown hash formats without throwing", async () => {
    await expect(verifyPassword("secret", "not-a-hash")).resolves.toBe(false);
    expect(needsPasswordRehash("not-a-hash")).toBe(false);
  });
});
