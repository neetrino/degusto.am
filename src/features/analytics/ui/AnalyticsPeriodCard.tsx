"use client";

import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Card } from "@/components/ui/Card";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import {
  ANALYTICS_PERIOD_PRESETS,
  analyticsPeriodLabel,
  formatAnalyticsDisplayDate,
  rangeForAnalyticsPeriod,
  type AnalyticsPeriodPreset,
} from "@/features/analytics/domain/date-range";

type AnalyticsPeriodCardProps = {
  locale: string;
  from: string;
  to: string;
  preset: AnalyticsPeriodPreset;
  exportQuery: string;
  rangeInvalid: boolean;
};

export function AnalyticsPeriodCard({
  locale,
  from,
  to,
  preset,
  exportQuery,
  rangeInvalid,
}: AnalyticsPeriodCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [forceCustom, setForceCustom] = useState(preset === "custom");
  const selectedPreset: AnalyticsPeriodPreset = forceCustom
    ? "custom"
    : preset;

  function navigate(nextFrom: string, nextTo: string): void {
    const params = new URLSearchParams({ from: nextFrom, to: nextTo });
    setForceCustom(false);
    startTransition(() => {
      router.push(`/${locale}/admin/analytics?${params.toString()}`);
    });
  }

  function onPeriodChange(value: string): void {
    const next = value as AnalyticsPeriodPreset;
    if (next === "custom") {
      setForceCustom(true);
      return;
    }
    const range = rangeForAnalyticsPeriod(next);
    navigate(range.from, range.to);
  }

  function onCustomSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextFrom = String(data.get("from") ?? "");
    const nextTo = String(data.get("to") ?? "");
    if (!nextFrom || !nextTo) {
      return;
    }
    navigate(nextFrom, nextTo);
  }

  return (
    <Card className="mb-5 rounded-2xl border-[#ead7bf]/80 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-[11px] font-bold tracking-[0.14em] text-[#8a837a] uppercase">
              Ժամանակահատված
            </h2>
            <p className="text-sm font-medium text-[#5c564e]">
              {formatAnalyticsDisplayDate(from)} –{" "}
              {formatAnalyticsDisplayDate(to)}
            </p>
          </div>

          <div className="max-w-md">
            <span className={ADMIN_LABEL}>Ընտրել միջակայք</span>
            <SelectDropdown
              ariaLabel="Ժամանակահատված"
              value={selectedPreset}
              options={ANALYTICS_PERIOD_PRESETS.map((option) => ({
                label: analyticsPeriodLabel(option),
                value: option,
              }))}
              disabled={pending}
              deferChange={false}
              className="mt-1"
              onValueChange={onPeriodChange}
            />
          </div>

          {selectedPreset === "custom" ? (
            <form
              onSubmit={onCustomSubmit}
              className="mt-3 flex flex-wrap items-end gap-3"
            >
              <label className="min-w-[140px] flex-1">
                <span className={ADMIN_LABEL}>Սկիզբ</span>
                <input
                  name="from"
                  type="date"
                  defaultValue={from}
                  className={ADMIN_INPUT}
                />
              </label>
              <label className="min-w-[140px] flex-1">
                <span className={ADMIN_LABEL}>Ավարտ</span>
                <input
                  name="to"
                  type="date"
                  defaultValue={to}
                  className={ADMIN_INPUT}
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-[#1f3a22] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#19311c] disabled:opacity-60"
              >
                Կիրառել
              </button>
            </form>
          ) : null}

          {rangeInvalid ? (
            <p className="mt-2 text-sm text-red-700">
              Անվավեր միջակայք։ Ցուցադրվում է լռելյայնը։
            </p>
          ) : null}
        </div>

        <a
          href={`/api/exports/admin/analytics?${exportQuery}`}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#ead7bf] bg-white px-4 text-sm font-semibold text-[#1f3a22] transition hover:border-[#ff7f20]/45 hover:bg-[#fff5ed]"
        >
          <Download className="size-4" aria-hidden />
          Ներբեռնել CSV արտահանում
        </a>
      </div>
    </Card>
  );
}
