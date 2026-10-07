"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import {
  asapIntervalLabelParts,
  formatZonedDate,
  isAsapDeliveryAvailable,
  listCalendarDays,
  listSlotsForDate,
  type DeliverySchedule,
  type DeliveryTimeSlot,
} from "@/features/delivery/domain/delivery-schedule";

export type CheckoutDeliveryTiming =
  | { mode: "asap" }
  | { mode: "scheduled"; date: string; start: string; end: string };

export type CheckoutDeliveryScheduleLabels = {
  dateAndTime: string;
  delivery: string;
  change: string;
  selectDay: string;
  selectTime: string;
  approxHours: string;
  approxMinutes: string;
  weekdayShort: [string, string, string, string, string, string, string];
  monthNames: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
};

type CheckoutDeliveryScheduleProps = {
  labels: CheckoutDeliveryScheduleLabels;
  schedule: DeliverySchedule;
  timing: CheckoutDeliveryTiming;
  onTimingChange: (timing: CheckoutDeliveryTiming) => void;
  disabled?: boolean;
};

function asapDetail(
  schedule: DeliverySchedule,
  labels: CheckoutDeliveryScheduleLabels,
): string {
  const parts = asapIntervalLabelParts(schedule.slotIntervalMinutes);
  const template =
    parts.kind === "hours" ? labels.approxHours : labels.approxMinutes;
  return template.replace("{value}", String(parts.value));
}

function formatSelectedLabel(
  timing: CheckoutDeliveryTiming,
  schedule: DeliverySchedule,
  labels: CheckoutDeliveryScheduleLabels,
): string {
  if (timing.mode === "asap") {
    return asapDetail(schedule, labels);
  }
  const [yearRaw, monthRaw, dayRaw] = timing.date.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const monthName = labels.monthNames[month - 1] ?? "";
  return `${day} ${monthName} ${year} · ${timing.start}–${timing.end}`;
}

function monthKeyFromDate(date: string): string {
  return date.slice(0, 7);
}

function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }
  return { year, month };
}

function shiftMonth(monthKey: string, delta: number): string {
  const { year, month } = parseMonthKey(monthKey);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function daysInMonthGrid(monthKey: string): Array<string | null> {
  const { year, month } = parseMonthKey(monthKey);
  const first = new Date(Date.UTC(year, month - 1, 1));
  // Monday-first index
  const mondayIndex = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<string | null> = Array.from(
    { length: mondayIndex },
    () => null,
  );
  for (let day = 1; day <= count; day += 1) {
    cells.push(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function CheckoutDeliverySchedule({
  labels,
  schedule,
  timing,
  onTimingChange,
  disabled = false,
}: CheckoutDeliveryScheduleProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [now] = useState(() => new Date());
  const bookable = useMemo(
    () => listCalendarDays(schedule, now),
    [schedule, now],
  );
  const availableDates = useMemo(
    () => new Set(bookable.filter((day) => day.available).map((day) => day.date)),
    [bookable],
  );
  const initialDate =
    timing.mode === "scheduled"
      ? timing.date
      : (bookable.find((day) => day.available)?.date ?? formatZonedDate(now));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [monthKey, setMonthKey] = useState(monthKeyFromDate(initialDate));

  const slots = useMemo(
    () => listSlotsForDate(schedule, selectedDate, now),
    [schedule, selectedDate, now],
  );

  const selectedSlot: DeliveryTimeSlot | null =
    timing.mode === "scheduled" && timing.date === selectedDate
      ? { start: timing.start, end: timing.end }
      : null;

  const asapAvailable = isAsapDeliveryAvailable(schedule, now);
  const { year: yearLabel, month: monthNum } = parseMonthKey(monthKey);
  const monthTitle = `${labels.monthNames[monthNum - 1] ?? ""} ${yearLabel}`;

  function selectSlot(slot: DeliveryTimeSlot): void {
    onTimingChange({
      mode: "scheduled",
      date: selectedDate,
      start: slot.start,
      end: slot.end,
    });
  }

  return (
    <section className="rounded-[32px] border border-[#dedede]/90 bg-white p-6 shadow-[0_12px_40px_rgba(60,47,47,0.04)] sm:p-7">
      <h2 className="mb-6 font-display text-2xl leading-none font-black tracking-tight text-[#3C2F2F] uppercase">
        {labels.dateAndTime}
      </h2>

      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fff5ed]">
          <CalendarDays className="size-5 text-[#f66a13]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[#3C2F2F]">
            {labels.delivery}
          </p>
          <p className="truncate text-sm text-[#5c564e]">
            {formatSelectedLabel(timing, schedule, labels)}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPickerOpen((open) => !open)}
          className="shrink-0 text-sm font-semibold text-[#f66a13] hover:underline disabled:opacity-50"
        >
          {labels.change}
        </button>
      </div>

      {pickerOpen ? (
        <div className="mt-5 grid gap-5 rounded-[24px] bg-[#fff9f0] p-4 lg:grid-cols-2 lg:gap-6 lg:p-5">
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-black tracking-wide text-[#f66a13] uppercase">
                {labels.selectDay}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-full p-1 text-[#3C2F2F] hover:bg-white"
                  aria-label="Previous month"
                  onClick={() => setMonthKey((key) => shiftMonth(key, -1))}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="min-w-[9rem] text-center text-sm font-semibold text-[#3C2F2F]">
                  {monthTitle}
                </span>
                <button
                  type="button"
                  className="rounded-full p-1 text-[#3C2F2F] hover:bg-white"
                  aria-label="Next month"
                  onClick={() => setMonthKey((key) => shiftMonth(key, 1))}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#a1a1aa]">
              {labels.weekdayShort.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {daysInMonthGrid(monthKey).map((date, index) => {
                if (!date) {
                  return <span key={`empty-${index}`} />;
                }
                const dayNum = Number(date.slice(-2));
                const available = availableDates.has(date);
                const selected = selectedDate === date;
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={!available || disabled}
                    onClick={() => setSelectedDate(date)}
                    className={
                      selected
                        ? "mx-auto flex size-9 items-center justify-center rounded-full bg-[#f66a13] text-sm font-semibold text-white"
                        : available
                          ? "mx-auto flex size-9 items-center justify-center rounded-full border border-[#ffd2b0] text-sm text-[#3C2F2F] hover:bg-white"
                          : "mx-auto flex size-9 items-center justify-center text-sm text-[#c4c0b8]"
                    }
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
            {asapAvailable ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onTimingChange({ mode: "asap" });
                  setPickerOpen(false);
                }}
                className="mt-3 text-sm font-semibold text-[#f66a13] hover:underline"
              >
                {asapDetail(schedule, labels)}
              </button>
            ) : null}
          </div>

          <div>
            <p className="mb-3 text-sm font-black tracking-wide text-[#f66a13] uppercase">
              {labels.selectTime}
            </p>
            {slots.length === 0 ? (
              <p className="text-sm text-[#8a837a]">—</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((slot) => {
                  const active =
                    selectedSlot?.start === slot.start &&
                    selectedSlot.end === slot.end;
                  return (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectSlot(slot)}
                      className={
                        active
                          ? "rounded-full bg-[#f66a13] px-2 py-2 text-xs font-semibold text-white sm:text-sm"
                          : "rounded-full border border-[#f66a13] bg-white px-2 py-2 text-xs font-medium text-[#3C2F2F] hover:bg-[#fff5ed] sm:text-sm"
                      }
                    >
                      {slot.start}-{slot.end}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
