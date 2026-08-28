type OrderPlacedAtCellProps = {
  value: string | Date;
  /** Optional trailing note, e.g. "Archived". */
  hint?: string;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function splitPlacedAt(value: string | Date): {
  dateLabel: string;
  timeLabel: string;
  iso: string;
} | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    dateLabel: `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`,
    timeLabel: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
    iso: date.toISOString(),
  };
}

/** Compact placed-at display: bold time, muted date underneath. */
export function OrderPlacedAtCell({ value, hint }: OrderPlacedAtCellProps) {
  const parts = splitPlacedAt(value);

  if (!parts) {
    return (
      <span className="text-xs text-[#8a837a]">{String(value)}</span>
    );
  }

  return (
    <time
      dateTime={parts.iso}
      className="inline-flex flex-col items-start leading-tight"
    >
      <span className="text-sm font-bold tabular-nums tracking-tight text-[#1f1a17]">
        {parts.timeLabel}
      </span>
      <span className="mt-0.5 text-[11px] tabular-nums text-[#8a837a]">
        {parts.dateLabel}
        {hint ? ` · ${hint}` : ""}
      </span>
    </time>
  );
}
