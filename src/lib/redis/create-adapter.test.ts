import { describe, expect, it } from "vitest";

import { createRedisAdapter } from "@/lib/redis/create-adapter";
import { isUpstashConfigured } from "@/lib/redis/is-configured";

describe("createRedisAdapter", () => {
  it("uses memory Redis when Upstash is not configured", () => {
    expect(createRedisAdapter({}).name).toBe("memory");
  });

  it("uses Upstash when REST credentials are present", () => {
    expect(
      createRedisAdapter({
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
      }).name,
    ).toBe("upstash");
  });
});

describe("isUpstashConfigured", () => {
  it("requires both url and token", () => {
    expect(isUpstashConfigured({})).toBe(false);
    expect(isUpstashConfigured({ url: "https://example.upstash.io" })).toBe(
      false,
    );
    expect(
      isUpstashConfigured({
        url: "https://example.upstash.io",
        token: "token",
      }),
    ).toBe(true);
  });
});
