import { describe, expect, it } from "vitest";

import { passwordSchema } from "@/features/auth/schemas";

describe("passwordSchema", () => {
  it("accepts a length-only password without composition rules", () => {
    expect(passwordSchema.safeParse("degusto1").success).toBe(true);
    expect(passwordSchema.safeParse("password").success).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("short");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Password must be at least 8 characters.",
      );
    }
  });

  it("rejects passwords longer than 128 characters", () => {
    const result = passwordSchema.safeParse("a".repeat(129));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Password must be at most 128 characters.",
      );
    }
  });
});
