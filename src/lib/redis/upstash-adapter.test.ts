import { describe, expect, it, vi } from "vitest";

import { createUpstashRedisAdapter } from "@/lib/redis/upstash-adapter";

describe("createUpstashRedisAdapter", () => {
  it("stringifies values and maps set results", async () => {
    const client = {
      get: vi.fn().mockResolvedValue(5),
      set: vi.fn().mockResolvedValue("OK"),
      del: vi.fn().mockResolvedValue(1),
      getdel: vi.fn().mockResolvedValue("user-1"),
    };
    const redis = createUpstashRedisAdapter({
      url: "https://example.upstash.io",
      token: "token",
      client,
    }).getClient();

    await expect(redis.get("rate")).resolves.toBe("5");
    await expect(redis.set("token", "abc", { ex: 60, nx: true })).resolves.toBe(
      "OK",
    );
    await expect(redis.getdel("token")).resolves.toBe("user-1");
    expect(client.set).toHaveBeenCalledWith("token", "abc", {
      ex: 60,
      nx: true,
    });
  });
});
