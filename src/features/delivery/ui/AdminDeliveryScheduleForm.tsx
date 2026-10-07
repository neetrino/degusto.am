"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAdminCopy } from "@/features/admin/ui/admin-copy";
import {
  DELIVERY_WEEKDAYS,
  type DeliveryDayHours,
  type DeliverySchedule,
  type DeliveryWeekday,
} from "@/features/delivery/domain/delivery-schedule";
import { getDeliveryScheduleCopy } from "@/features/delivery/ui/delivery-schedule-copy";
import { upsertStoreSettingAction } from "@/features/settings/application/upsert-settings";

const FIELD =
  "h-10 w-full rounded-lg border border-[#e8e4dc] bg-white px-3 text-sm text-[#1f1a17] outline-none focus:border-[#ff7f20] focus:ring-2 focus:ring-[#ff7f20]/20";

type AdminDeliveryScheduleFormProps = {
  locale: string;
  initialSchedule: DeliverySchedule;
};

export function AdminDeliveryScheduleForm({
  locale,
  initialSchedule,
}: AdminDeliveryScheduleFormProps) {
  const router = useRouter();
  const copy = getDeliveryScheduleCopy(locale);
  const adminCopy = getAdminCopy(locale);
  const [schedule, setSchedule] = useState<DeliverySchedule>(initialSchedule);
  const [closedDraft, setClosedDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateWeekDay(
    day: DeliveryWeekday,
    patch: Partial<DeliveryDayHours>,
  ): void {
    setSchedule((prev) => ({
      ...prev,
      week: {
        ...prev.week,
        [day]: { ...prev.week[day], ...patch },
      },
    }));
  }

  function addClosedDay(): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(closedDraft)) {
      return;
    }
    setSchedule((prev) => ({
      ...prev,
      closedDates: [...new Set([...prev.closedDates, closedDraft])].sort(),
    }));
    setClosedDraft("");
  }

  function removeClosedDay(date: string): void {
    setSchedule((prev) => ({
      ...prev,
      closedDates: prev.closedDates.filter((item) => item !== date),
    }));
  }

  function onSave(): void {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await upsertStoreSettingAction(locale, {
        key: "store.deliverySchedule",
        value: schedule,
      });
      if (!result.ok) {
        setError(result.error.message || copy.saveError);
        return;
      }
      setMessage(copy.saved);
      router.refresh();
    });
  }

  return (
    <Card className="mt-8 space-y-6 border border-[#e8e4dc] p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-[#1f1a17]">{copy.title}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm">
          <span className="text-[#5c564e]">{copy.intervalLabel}</span>
          <input
            type="number"
            min={15}
            max={240}
            step={15}
            className={FIELD}
            value={schedule.slotIntervalMinutes}
            onChange={(event) =>
              setSchedule((prev) => ({
                ...prev,
                slotIntervalMinutes: Number(event.target.value) || 60,
              }))
            }
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-[#5c564e]">{copy.bookingDaysLabel}</span>
          <input
            type="number"
            min={1}
            max={30}
            className={FIELD}
            value={schedule.bookingDaysAhead}
            onChange={(event) =>
              setSchedule((prev) => ({
                ...prev,
                bookingDaysAhead: Number(event.target.value) || 7,
              }))
            }
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#ece7df]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#faf8f5] text-left text-[#8a837a]">
            <tr>
              <th className="px-3 py-2 font-medium">{copy.dayColumn}</th>
              <th className="px-3 py-2 text-center font-medium">
                {copy.openColumn}
              </th>
              <th className="px-3 py-2 font-medium">{copy.startColumn}</th>
              <th className="px-3 py-2 font-medium">{copy.endColumn}</th>
            </tr>
          </thead>
          <tbody>
            {DELIVERY_WEEKDAYS.map((day) => {
              const hours = schedule.week[day];
              return (
                <tr key={day} className="border-t border-[#ece7df]">
                  <td className="px-3 py-2 font-medium text-[#1f1a17]">
                    {copy.weekdays[day]}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={hours.open}
                      onChange={(event) =>
                        updateWeekDay(day, { open: event.target.checked })
                      }
                      className="h-4 w-4 accent-[#ff7f20]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      className={FIELD}
                      value={hours.start}
                      disabled={!hours.open}
                      onChange={(event) =>
                        updateWeekDay(day, { start: event.target.value })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      className={FIELD}
                      value={hours.end}
                      disabled={!hours.open}
                      onChange={(event) =>
                        updateWeekDay(day, { end: event.target.value })
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[#1f1a17]">
          {copy.closedDaysTitle}
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[200px] flex-1 space-y-1.5 text-sm">
            <span className="sr-only">{copy.closedDaysPlaceholder}</span>
            <input
              type="date"
              className={FIELD}
              value={closedDraft}
              onChange={(event) => setClosedDraft(event.target.value)}
            />
          </label>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={addClosedDay}
            disabled={!closedDraft}
          >
            {copy.closeDayButton}
          </Button>
        </div>
        {schedule.closedDates.length === 0 ? (
          <p className="text-sm text-[#8a837a]">{copy.noClosedDays}</p>
        ) : (
          <ul className="space-y-2">
            {schedule.closedDates.map((date) => (
              <li
                key={date}
                className="flex items-center justify-between rounded-lg border border-[#ece7df] px-3 py-2 text-sm"
              >
                <span className="tabular-nums text-[#1f1a17]">{date}</span>
                <button
                  type="button"
                  className="text-red-600 hover:underline"
                  onClick={() => removeClosedDay(date)}
                >
                  {copy.removeClosedDay}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-[#3e573d]">{message}</p> : null}

      <Button type="button" onClick={onSave} disabled={isPending}>
        {isPending ? adminCopy.common.saving : adminCopy.common.save}
      </Button>
    </Card>
  );
}
