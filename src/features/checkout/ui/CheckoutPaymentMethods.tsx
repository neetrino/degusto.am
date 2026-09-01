"use client";

import { useState } from "react";

import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";

const RADIO_SELECTED =
  "border-[#ff7f20] bg-[#fff5ed] shadow-[0_0_0_1px_rgba(255,127,32,0.15)]";
const RADIO_IDLE =
  "border-[#dedede] bg-white hover:border-[#ff7f20]/45 hover:bg-[#fffaf6]";

type PaymentLogo = {
  src: string;
  alt: string;
};

type PaymentOption = {
  id: CheckoutPaymentMethod;
  name: string;
  description: string;
  /** One or more provider logos; empty/omitted shows the fallback icon. */
  logos?: PaymentLogo[];
};

type CheckoutPaymentMethodsProps = {
  title: string;
  options: PaymentOption[];
  value: CheckoutPaymentMethod;
  onChange: (method: CheckoutPaymentMethod) => void;
  disabled: boolean;
};

function PaymentLogoBox({
  logo,
  failed,
  onError,
  compact,
}: {
  logo: PaymentLogo;
  failed: boolean;
  onError: () => void;
  compact: boolean;
}) {
  const sizeClass = compact
    ? "h-6 w-9 md:h-8 md:w-11 rounded-lg"
    : "h-8 w-10 md:h-10 md:w-14 rounded-xl";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-[#dedede] bg-white shadow-sm ${sizeClass}`}
    >
      {failed ? (
        <svg
          className="h-5 w-5 text-[#a1a1aa]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ) : (
        // Provider logos may come from hosts outside next/image config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.src}
          alt={logo.alt}
          className={`h-full w-full object-contain ${compact ? "p-1" : "p-1.5"}`}
          loading="lazy"
          onError={onError}
        />
      )}
    </div>
  );
}

export function CheckoutPaymentMethods({
  title,
  options,
  value,
  onChange,
  disabled,
}: CheckoutPaymentMethodsProps) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  return (
    <section className="rounded-[32px] border border-[#dedede]/90 bg-white p-6 shadow-[0_12px_40px_rgba(60,47,47,0.04)] sm:p-7">
      <h2 className="mb-6 font-display text-2xl leading-none font-black tracking-tight text-[#3C2F2F] uppercase">
        {title}
      </h2>
      <div className="space-y-3">
        {options.map((option) => {
          const selected = value === option.id;
          const logos = option.logos ?? [];
          const compact = logos.length > 1;

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-all duration-200 md:p-4 ${
                selected ? RADIO_SELECTED : RADIO_IDLE
              } ${disabled ? "pointer-events-none opacity-60" : ""}`}
            >
              {logos.length === 0 ? (
                <div className="flex h-8 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dedede] bg-white shadow-sm md:h-10 md:w-14">
                  <svg
                    className="h-6 w-6 text-[#a1a1aa]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              ) : (
                <div
                  className={`flex shrink-0 items-center ${compact ? "gap-1" : ""}`}
                >
                  {logos.map((logo) => {
                    const errorKey = `${option.id}:${logo.src}`;
                    return (
                      <PaymentLogoBox
                        key={logo.src}
                        logo={logo}
                        compact={compact}
                        failed={Boolean(logoErrors[errorKey])}
                        onError={() =>
                          setLogoErrors((prev) => ({
                            ...prev,
                            [errorKey]: true,
                          }))
                        }
                      />
                    );
                  })}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[#3C2F2F]">{option.name}</div>
                <div className="mt-0.5 hidden text-sm text-[#717182] md:block">
                  {option.description}
                </div>
              </div>

              <input
                type="radio"
                name="paymentMethod"
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="sr-only"
                disabled={disabled}
                aria-label={option.name}
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}
