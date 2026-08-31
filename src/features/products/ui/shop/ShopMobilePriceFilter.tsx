"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { useCatalogNavigation } from "@/features/products/ui/shop/CatalogNavContext";

type ShopMobilePriceFilterProps = {
  chipLabel: string;
  popoverTitle: string;
  minLabel: string;
  maxLabel: string;
  currencySymbol: string;
  minPrice: string;
  maxPrice: string;
};

/**
 * Mobile shop price chip — opens a popover with min/max inputs.
 */
export function ShopMobilePriceFilter({
  chipLabel,
  popoverTitle,
  minLabel,
  maxLabel,
  currencySymbol,
  minPrice,
  maxPrice,
}: ShopMobilePriceFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isPending, startCatalogTransition } = useCatalogNavigation();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [fromValue, setFromValue] = useState(minPrice);
  const [toValue, setToValue] = useState(maxPrice);
  const [prevMin, setPrevMin] = useState(minPrice);
  const [prevMax, setPrevMax] = useState(maxPrice);

  if (minPrice !== prevMin || maxPrice !== prevMax) {
    setPrevMin(minPrice);
    setPrevMax(maxPrice);
    setFromValue(minPrice);
    setToValue(maxPrice);
  }

  const hasActiveFilter = Boolean(minPrice.trim() || maxPrice.trim());
  const chipActive = open || hasActiveFilter;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent | TouchEvent): void {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function commitPrice(): void {
    const params = new URLSearchParams(searchParams.toString());
    if (fromValue.trim()) params.set("min", fromValue.trim());
    else params.delete("min");
    if (toValue.trim()) params.set("max", toValue.trim());
    else params.delete("max");
    params.delete("page");
    const query = params.toString();
    startCatalogTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div
      ref={rootRef}
      className={`relative ${open ? "z-[200]" : "z-20"} ${isPending ? "opacity-80" : ""}`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[12px] font-semibold tracking-[0.4px] uppercase transition ${
          chipActive
            ? "border-[#ff7f20] bg-[#ff7f20] text-white"
            : "border-[#252525] bg-white text-[#252525]"
        }`}
      >
        <span>{chipLabel}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={popoverTitle}
          className="absolute top-[calc(100%+10px)] right-0 z-[210] w-[min(92vw,320px)] rounded-[24px] border border-[#ead7bf]/80 bg-white p-4 shadow-[0_18px_40px_-20px_rgba(31,26,23,0.45)]"
        >
          <p className="mb-3 text-sm font-semibold tracking-[0.08em] text-[#8a837a] uppercase">
            {popoverTitle}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <PriceField
              id={`${panelId}-min`}
              label={minLabel}
              value={fromValue}
              currencySymbol={currencySymbol}
              onChange={setFromValue}
              onCommit={commitPrice}
            />
            <PriceField
              id={`${panelId}-max`}
              label={maxLabel}
              value={toValue}
              currencySymbol={currencySymbol}
              onChange={setToValue}
              onCommit={commitPrice}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PriceField({
  id,
  label,
  value,
  currencySymbol,
  onChange,
  onCommit,
}: {
  id: string;
  label: string;
  value: string;
  currencySymbol: string;
  onChange: (next: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] leading-snug font-medium text-[#8a837a]"
      >
        {label}
      </label>
      <div className="flex h-11 items-center gap-1 rounded-[14px] bg-[#f3f3f5] px-3">
        <input
          id={id}
          type="number"
          min={0}
          max={2_147_483_647}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold tabular-nums text-[#3c2f2f] outline-none"
        />
        <span className="shrink-0 text-sm font-semibold text-[#3c2f2f]">
          {currencySymbol}
        </span>
      </div>
    </div>
  );
}
