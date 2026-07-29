"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { ADMIN_LABEL, ADMIN_TEXT_MUTED } from "@/features/admin/ui/admin-form-classes";

const SPICY_ICON = "/assets/product-card/spicy.webp";
const VEGGIE_ICON = "/assets/product-card/veggie.webp";

type ProductDrawerDietBadgesProps = {
  isSpicy: boolean;
  isVegetarian: boolean;
  disabled?: boolean;
  onSpicyChange: (value: boolean) => void;
  onVegetarianChange: (value: boolean) => void;
};

type DietOptionProps = {
  pressed: boolean;
  disabled: boolean;
  label: string;
  accent: "spicy" | "veg";
  onToggle: () => void;
  icon: ReactNode;
};

function DietOption({
  pressed,
  disabled,
  label,
  accent,
  onToggle,
  icon,
}: DietOptionProps) {
  const accentRing =
    accent === "spicy"
      ? "border-[#ff2b2e] bg-[#fff5f5] shadow-[0_10px_24px_-12px_rgba(255,43,46,0.55)] ring-4 ring-[#ff2b2e]/12"
      : "border-[#3e8f4a] bg-[#f3faf4] shadow-[0_10px_24px_-12px_rgba(62,143,74,0.45)] ring-4 ring-[#3e8f4a]/12";

  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onToggle}
      className={
        pressed
          ? `group relative flex min-h-[116px] flex-1 flex-col items-center justify-center gap-3 rounded-[20px] border-2 px-4 py-4 transition-all duration-200 disabled:opacity-60 ${accentRing}`
          : "group relative flex min-h-[116px] flex-1 flex-col items-center justify-center gap-3 rounded-[20px] border border-[#ead7bf] bg-[#fffaf2] px-4 py-4 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f66812]/45 hover:bg-white hover:shadow-[0_10px_24px_rgba(255,127,32,0.1)] disabled:opacity-60"
      }
    >
      {pressed ? (
        <span
          className={
            accent === "spicy"
              ? "absolute top-2.5 right-2.5 inline-flex size-5 items-center justify-center rounded-full bg-[#ff2b2e] text-white"
              : "absolute top-2.5 right-2.5 inline-flex size-5 items-center justify-center rounded-full bg-[#3e8f4a] text-white"
          }
          aria-hidden
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}

      {icon}

      <span
        className={
          pressed
            ? accent === "spicy"
              ? "text-sm font-semibold tracking-tight text-[#c41e20]"
              : "text-sm font-semibold tracking-tight text-[#2f6d38]"
            : "text-sm font-medium tracking-tight text-[#183322] transition-colors group-hover:text-[#3e573d]"
        }
      >
        {label}
      </span>
    </button>
  );
}

/** Admin toggles for spicy / vegetarian badges shown on storefront cards. */
export function ProductDrawerDietBadges({
  isSpicy,
  isVegetarian,
  disabled = false,
  onSpicyChange,
  onVegetarianChange,
}: ProductDrawerDietBadgesProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className={ADMIN_LABEL}>Կծու / Vegie</legend>
      <p className={`-mt-0.5 ${ADMIN_TEXT_MUTED} text-sm leading-relaxed`}>
        Նշեք պատկերակները — դրանք կերևան ապրանքի քարտում (home, shop, menu)։
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 rounded-[22px] border border-[#ead7bf] bg-gradient-to-br from-[#fffaf2] via-[#fffdf8] to-[#fff4eb] p-3 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.04)] sm:gap-4 sm:p-4">
        <DietOption
          pressed={isSpicy}
          disabled={disabled}
          label="Կծու"
          accent="spicy"
          onToggle={() => onSpicyChange(!isSpicy)}
          icon={
            <span
              className={
                isSpicy
                  ? "flex size-14 items-center justify-center rounded-full bg-[#ff2b2e] shadow-[0_8px_18px_-6px_rgba(255,43,46,0.7)] transition-transform duration-200"
                  : "flex size-14 items-center justify-center rounded-full bg-[#ff2b2e]/90 transition-transform duration-200 group-hover:scale-105"
              }
            >
              <Image
                src={SPICY_ICON}
                alt=""
                width={26}
                height={26}
                className="size-[26px] -rotate-[13deg] object-contain"
                aria-hidden
              />
            </span>
          }
        />

        <DietOption
          pressed={isVegetarian}
          disabled={disabled}
          label="Vegie"
          accent="veg"
          onToggle={() => onVegetarianChange(!isVegetarian)}
          icon={
            <span
              className={
                isVegetarian
                  ? "flex size-14 items-center justify-center overflow-hidden rounded-full shadow-[0_8px_18px_-6px_rgba(62,143,74,0.55)] transition-transform duration-200 ring-2 ring-[#3e8f4a]/25"
                  : "flex size-14 items-center justify-center overflow-hidden rounded-full transition-transform duration-200 group-hover:scale-105"
              }
            >
              <Image
                src={VEGGIE_ICON}
                alt=""
                width={56}
                height={56}
                className="size-14 scale-110 object-cover"
                aria-hidden
              />
            </span>
          }
        />
      </div>
    </fieldset>
  );
}
