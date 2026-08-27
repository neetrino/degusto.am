"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_CARD_PADDED,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { upsertStoreSettingAction } from "@/features/settings/application/upsert-settings";
import type {
  StoreFxRates,
  StoreIdentity,
  StorefrontCurrencies,
} from "@/features/settings/domain/store-settings";
import {
  currencies,
  currencySymbols,
  type Currency,
} from "@/lib/money/currency";

type StoreSettingsFormsProps = {
  locale: string;
  identity: StoreIdentity;
  fxRates: StoreFxRates;
  storefrontCurrencies: StorefrontCurrencies;
};

function CurrencyToggle({
  code,
  enabled,
  disabled,
  onToggle,
}: {
  code: Currency;
  enabled: boolean;
  disabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-[#e5e7eb] bg-white px-3 py-2">
      <span className="text-sm font-medium text-[#4b5563]">
        {currencySymbols[code]} {code}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${code} storefront currency`}
        disabled={disabled}
        onClick={() => onToggle(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          enabled ? "bg-[#86efac]" : "bg-[#e5e7eb]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
          aria-hidden
        />
      </button>
    </div>
  );
}

export function StoreSettingsForms({
  locale,
  identity,
  fxRates,
  storefrontCurrencies,
}: StoreSettingsFormsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currencyFlags, setCurrencyFlags] =
    useState<StorefrontCurrencies>(storefrontCurrencies);

  function saveStorefrontCurrencies(next: StorefrontCurrencies): void {
    const enabledCount = currencies.filter((code) => next[code]).length;
    if (enabledCount < 1) {
      setError("At least one storefront currency must stay enabled.");
      return;
    }

    setCurrencyFlags(next);
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await upsertStoreSettingAction(locale, {
        key: "store.storefrontCurrencies",
        value: next,
      });
      if (!result.ok) {
        setCurrencyFlags(storefrontCurrencies);
        setError(result.error.message);
        return;
      }
      setMessage("Saved storefront currencies.");
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-[#3e573d]">{message}</p> : null}

      <Card className={ADMIN_CARD_PADDED}>
        <div className="flex flex-col gap-4">
          <div>
            <h2 className={ADMIN_SECTION_TITLE}>Վիտրինայի արժույթներ</h2>
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-muted-foreground)]">
              Միացրեք կամ անջատեք արժույթները վերնագրի փոխարկիչում։ Եթե ակտիվ է
              միայն մեկ արժույթ, վերնագրում կմնա միայն լեզուն։
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {currencies.map((code) => (
              <CurrencyToggle
                key={code}
                code={code}
                enabled={currencyFlags[code]}
                disabled={isPending}
                onToggle={(enabled) =>
                  saveStorefrontCurrencies({
                    ...currencyFlags,
                    [code]: enabled,
                  })
                }
              />
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <Card className={ADMIN_CARD_PADDED}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              startTransition(async () => {
                setError(null);
                setMessage(null);
                const result = await upsertStoreSettingAction(locale, {
                  key: "store.identity",
                  value: {
                    name: String(data.get("name") ?? "").trim(),
                    supportEmail: String(data.get("supportEmail") ?? "").trim(),
                    phone: String(data.get("phone") ?? "").trim() || undefined,
                  },
                });
                if (!result.ok) {
                  setError(result.error.message);
                  return;
                }
                setMessage(`Saved ${result.value.key}.`);
                router.refresh();
              });
            }}
          >
            <h2 className={ADMIN_SECTION_TITLE}>Store identity</h2>
            <label>
              <span className={ADMIN_LABEL}>Name</span>
              <input
                name="name"
                defaultValue={identity.name}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>
            <label>
              <span className={ADMIN_LABEL}>Support email</span>
              <input
                name="supportEmail"
                type="email"
                defaultValue={identity.supportEmail}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>
            <label>
              <span className={ADMIN_LABEL}>Phone</span>
              <input
                name="phone"
                defaultValue={identity.phone ?? ""}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>
            <Button type="submit" size="sm" disabled={isPending}>
              Save identity
            </Button>
          </form>
        </Card>

        <Card className={ADMIN_CARD_PADDED}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              startTransition(async () => {
                setError(null);
                setMessage(null);
                const result = await upsertStoreSettingAction(locale, {
                  key: "store.fxRates",
                  value: {
                    usd: String(data.get("usd") ?? "").trim(),
                    rub: String(data.get("rub") ?? "").trim(),
                  },
                });
                if (!result.ok) {
                  setError(result.error.message);
                  return;
                }
                setMessage(`Saved ${result.value.key}.`);
                router.refresh();
              });
            }}
          >
            <h2 className={ADMIN_SECTION_TITLE}>Exchange rates</h2>
            <p className="text-sm text-[color:var(--color-muted-foreground)]">
              Catalog prices stay in AMD. Enter how many USD / RUB equal{" "}
              <strong>1 AMD</strong> (dot or comma decimals, e.g. 0.2137 or
              0,2137). Storefront display currency uses these rates.
            </p>
            <label>
              <span className={ADMIN_LABEL}>USD per 1 AMD</span>
              <input
                name="usd"
                type="text"
                inputMode="decimal"
                defaultValue={fxRates.usd}
                placeholder="0.0026"
                className={ADMIN_INPUT}
                disabled={isPending}
                required
              />
            </label>
            <label>
              <span className={ADMIN_LABEL}>RUB per 1 AMD</span>
              <input
                name="rub"
                type="text"
                inputMode="decimal"
                defaultValue={fxRates.rub}
                placeholder="0.24"
                className={ADMIN_INPUT}
                disabled={isPending}
                required
              />
            </label>
            <Button type="submit" size="sm" disabled={isPending}>
              Save exchange rates
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
