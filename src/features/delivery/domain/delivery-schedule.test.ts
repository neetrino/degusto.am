import { describe, expect, it } from "vitest";

import {
  DEFAULT_DELIVERY_SCHEDULE,
  formatZonedDate,
  isAsapDeliveryAvailable,
  isValidDeliverySlot,
  listCalendarDays,
  listSlotsForDate,
  parseDeliverySchedule,
  resolveAsapDeliveryWindow,
  weekdayForDate,
  zonedDateTimeToUtc,
} from "@/features/delivery/domain/delivery-schedule";

/** `YYYY-MM-DDTHH:mm` interpreted as Yerevan (+04). */
function atYerevan(local: string): Date {
  return new Date(`${local}:00+04:00`);
}

describe("parseDeliverySchedule", () => {
  it("returns defaults for empty input", () => {
    const parsed = parseDeliverySchedule(null);
    expect(parsed.slotIntervalMinutes).toBe(60);
    expect(parsed.week.sunday.open).toBe(false);
    expect(parsed.week.monday.open).toBe(true);
  });

  it("keeps closed dates and open hours", () => {
    const parsed = parseDeliverySchedule({
      slotIntervalMinutes: 30,
      bookingDaysAhead: 5,
      week: {
        ...DEFAULT_DELIVERY_SCHEDULE.week,
        monday: { open: true, start: "09:00", end: "18:00" },
      },
      closedDates: ["2026-10-10", "bad", "2026-10-10"],
    });
    expect(parsed.slotIntervalMinutes).toBe(30);
    expect(parsed.bookingDaysAhead).toBe(5);
    expect(parsed.week.monday.start).toBe("09:00");
    expect(parsed.closedDates).toEqual(["2026-10-10"]);
  });
});

describe("weekdayForDate", () => {
  it("maps calendar dates without UTC drift", () => {
    expect(weekdayForDate("2026-10-05")).toBe("monday");
    expect(weekdayForDate("2026-10-11")).toBe("sunday");
  });
});

describe("listSlotsForDate", () => {
  it("builds hourly slots and skips past times today", () => {
    const now = atYerevan("2026-10-07T12:30");
    const slots = listSlotsForDate(DEFAULT_DELIVERY_SCHEDULE, "2026-10-07", now);
    expect(slots[0]).toEqual({ start: "13:00", end: "14:00" });
    expect(slots.at(-1)).toEqual({ start: "21:00", end: "22:00" });
  });

  it("returns empty for closed weekdays and closed dates", () => {
    const now = atYerevan("2026-10-07T12:00");
    expect(listSlotsForDate(DEFAULT_DELIVERY_SCHEDULE, "2026-10-11", now)).toEqual(
      [],
    );
    const withClosed = {
      ...DEFAULT_DELIVERY_SCHEDULE,
      closedDates: ["2026-10-08"],
    };
    expect(listSlotsForDate(withClosed, "2026-10-08", now)).toEqual([]);
  });
});

describe("resolveAsapDeliveryWindow / isAsapDeliveryAvailable", () => {
  it("returns today's concrete window from now", () => {
    expect(
      resolveAsapDeliveryWindow(
        DEFAULT_DELIVERY_SCHEDULE,
        atYerevan("2026-10-07T15:20"),
      ),
    ).toEqual({
      date: "2026-10-07",
      start: "15:20",
      end: "16:20",
    });
    expect(
      isAsapDeliveryAvailable(
        DEFAULT_DELIVERY_SCHEDULE,
        atYerevan("2026-10-07T15:20"),
      ),
    ).toBe(true);
  });

  it("is unavailable outside hours, near close, or on closed days", () => {
    expect(
      resolveAsapDeliveryWindow(
        DEFAULT_DELIVERY_SCHEDULE,
        atYerevan("2026-10-07T09:00"),
      ),
    ).toBeNull();
    expect(
      resolveAsapDeliveryWindow(
        DEFAULT_DELIVERY_SCHEDULE,
        atYerevan("2026-10-07T21:30"),
      ),
    ).toBeNull();
    expect(
      isAsapDeliveryAvailable(
        DEFAULT_DELIVERY_SCHEDULE,
        atYerevan("2026-10-11T12:00"),
      ),
    ).toBe(false);
  });
});

describe("listCalendarDays / isValidDeliverySlot", () => {
  it("marks days with remaining slots as available", () => {
    const now = atYerevan("2026-10-07T12:00");
    const days = listCalendarDays(DEFAULT_DELIVERY_SCHEDULE, now);
    expect(days).toHaveLength(7);
    expect(days[0]?.date).toBe(formatZonedDate(now));
    expect(days[0]?.available).toBe(true);
    const sunday = days.find((day) => day.weekday === "sunday");
    expect(sunday?.available).toBe(false);
  });

  it("validates a concrete slot", () => {
    const now = atYerevan("2026-10-07T09:00");
    expect(
      isValidDeliverySlot(
        DEFAULT_DELIVERY_SCHEDULE,
        "2026-10-07",
        "10:00",
        "11:00",
        now,
      ),
    ).toBe(true);
    expect(
      isValidDeliverySlot(
        DEFAULT_DELIVERY_SCHEDULE,
        "2026-10-07",
        "09:00",
        "10:00",
        now,
      ),
    ).toBe(false);
  });
});

describe("zonedDateTimeToUtc", () => {
  it("converts Yerevan wall time to an absolute instant", () => {
    expect(zonedDateTimeToUtc("2026-10-07", "10:00").toISOString()).toBe(
      "2026-10-07T06:00:00.000Z",
    );
  });
});
