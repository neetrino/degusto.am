"use client";

/** Compact count pill for admin Orders nav / hub tiles. */
export function AdminOrdersNavBadge({
  count,
  variant = "sidebar",
}: {
  count: number;
  variant?: "sidebar" | "hub";
}) {
  if (count <= 0) {
    return null;
  }

  const label = count > 99 ? "99+" : String(count);

  if (variant === "hub") {
    return (
      <span
        className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
        aria-label={`${label} new orders`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-none text-white"
      aria-label={`${label} new orders`}
    >
      {label}
    </span>
  );
}
