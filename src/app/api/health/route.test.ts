import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports runtime health without external dependencies", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T12:00:00.000Z"));

    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "degusto",
      timestamp: "2026-10-15T12:00:00.000Z",
    });
  });
});
