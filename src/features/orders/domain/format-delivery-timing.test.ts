import { describe, expect, it } from "vitest";

import {
  formatDeliveryTimingLabel,
  parseApproxIntervalMinutes,
} from "@/features/orders/domain/format-delivery-timing";

describe("parseApproxIntervalMinutes", () => {
  it("parses Armenian / English / Russian ASAP copy", () => {
    expect(parseApproxIntervalMinutes("մոտավորապես 90 րոպեում")).toBe(90);
    expect(parseApproxIntervalMinutes("approximately in 1 hour(s)")).toBe(60);
    expect(parseApproxIntervalMinutes("примерно через 1.5 ч.")).toBe(90);
  });
});

describe("formatDeliveryTimingLabel", () => {
  it("prefers stored slot timestamps", () => {
    const label = formatDeliveryTimingLabel({
      locale: "hy",
      placedAt: new Date("2026-10-07T11:00:00.000Z"),
      deliveryEstimateSnapshot: "մոտավորապես 90 րոպեում",
      deliverySlotStartAt: new Date("2026-10-07T11:20:00.000Z"),
      deliverySlotEndAt: new Date("2026-10-07T12:50:00.000Z"),
    });
    expect(label).toBe("7 հոկտեմբեր 2026 · 15:20–16:50");
  });

  it("formats legacy ASAP text via placedAt + interval", () => {
    const label = formatDeliveryTimingLabel({
      locale: "hy",
      placedAt: new Date("2026-10-07T11:00:00.000Z"),
      deliveryEstimateSnapshot: "մոտավորապես 90 րոպեում",
      deliverySlotStartAt: null,
      deliverySlotEndAt: null,
    });
    expect(label).toBe("7 հոկտեմբեր 2026 · 15:00–16:30");
  });

  it("formats concrete snapshot slots", () => {
    const label = formatDeliveryTimingLabel({
      locale: "en",
      placedAt: new Date("2026-10-07T11:00:00.000Z"),
      deliveryEstimateSnapshot: "2026-10-08 10:00–11:00",
      deliverySlotStartAt: null,
      deliverySlotEndAt: null,
    });
    expect(label).toBe("October 8, 2026 · 10:00–11:00");
  });
});
