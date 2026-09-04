import { describe, expect, it, vi } from "vitest";

import { createResendEmailAdapter } from "@/lib/email/resend-adapter";

describe("createResendEmailAdapter", () => {
  it("sends through the Resend client and returns the id", async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: "msg_1" }, error: null });
    const email = createResendEmailAdapter({
      apiKey: "re_test",
      from: "Degusto <onboarding@resend.dev>",
      send,
    });

    await expect(
      email.send({
        to: "customer@example.com",
        subject: "Reset",
        html: "<p>Reset</p>",
        text: "Reset",
      }),
    ).resolves.toEqual({ id: "msg_1" });

    expect(send).toHaveBeenCalledWith({
      from: "Degusto <onboarding@resend.dev>",
      to: "customer@example.com",
      subject: "Reset",
      html: "<p>Reset</p>",
      text: "Reset",
    });
  });

  it("throws when Resend returns an error", async () => {
    const email = createResendEmailAdapter({
      apiKey: "re_test",
      from: "Degusto <onboarding@resend.dev>",
      send: async () => ({ error: { message: "domain not verified" } }),
    });

    await expect(
      email.send({
        to: "customer@example.com",
        subject: "Reset",
        html: "<p>Reset</p>",
        text: "Reset",
      }),
    ).rejects.toThrow("domain not verified");
  });
});
