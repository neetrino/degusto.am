"use client";

import { Plus, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_TEXT_MUTED,
} from "@/features/admin/ui/admin-form-classes";

export type ProductModifierDraft = {
  key: string;
  label: string;
  isEnabled: boolean;
  /** AMD integer; used for additions. */
  priceAmount: number;
};

type ProductDrawerModifiersProps = {
  additions: readonly ProductModifierDraft[];
  exclusions: readonly ProductModifierDraft[];
  disabled?: boolean;
  onAdditionsChange: (next: ProductModifierDraft[]) => void;
  onExclusionsChange: (next: ProductModifierDraft[]) => void;
};

type ModifierColumnProps = {
  title: string;
  subtitle: string;
  placeholder: string;
  items: readonly ProductModifierDraft[];
  disabled: boolean;
  showPrice: boolean;
  onChange: (next: ProductModifierDraft[]) => void;
};

function createModifierKey(): string {
  return `mod-${crypto.randomUUID()}`;
}

function parsePriceInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  if (!/^\d{1,10}$/.test(trimmed)) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function ModifierColumn({
  title,
  subtitle,
  placeholder,
  items,
  disabled,
  showPrice,
  onChange,
}: ModifierColumnProps) {
  const [draft, setDraft] = useState("");
  const [draftPrice, setDraftPrice] = useState("");

  function addItem(): void {
    const label = draft.trim().replace(/\s+/g, " ");
    if (!label || disabled) {
      return;
    }
    const priceAmount = showPrice ? parsePriceInput(draftPrice) : 0;
    if (priceAmount == null) {
      return;
    }
    onChange([
      ...items,
      {
        key: createModifierKey(),
        label,
        isEnabled: true,
        priceAmount,
      },
    ]);
    setDraft("");
    setDraftPrice("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      addItem();
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-[#ead7bf] bg-[#fffaf2] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[#ead7bf]/80 px-4 py-3">
        <p className="text-sm font-semibold text-[#1f1a17]">{title}</p>
        <p className={`mt-0.5 text-xs ${ADMIN_TEXT_MUTED}`}>{subtitle}</p>
      </div>

      <ul className="min-h-[180px] max-h-[240px] flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-2">
        {items.length === 0 ? (
          <li className={`px-2 py-8 text-center text-sm ${ADMIN_TEXT_MUTED}`}>
            Դատարկ է
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/80"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={item.isEnabled}
                  disabled={disabled}
                  onChange={(event) => {
                    onChange(
                      items.map((row) =>
                        row.key === item.key
                          ? { ...row, isEnabled: event.target.checked }
                          : row,
                      ),
                    );
                  }}
                  className="size-4 shrink-0 rounded border-[#cfc5b6] text-[#1f3a22] accent-[#1f3a22] focus:ring-[#f66812]/30"
                />
                <span className="min-w-0 truncate text-sm font-medium text-[#183322]">
                  {item.label}
                </span>
              </label>
              {showPrice ? (
                <div className="flex shrink-0 items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    disabled={disabled}
                    value={item.priceAmount}
                    aria-label={`${item.label} price`}
                    onChange={(event) => {
                      const nextPrice = parsePriceInput(event.target.value);
                      if (nextPrice == null) {
                        return;
                      }
                      onChange(
                        items.map((row) =>
                          row.key === item.key
                            ? { ...row, priceAmount: nextPrice }
                            : row,
                        ),
                      );
                    }}
                    className="h-8 w-[4.75rem] rounded-lg border border-[#ead7bf] bg-white px-2 text-right text-xs font-semibold tabular-nums text-[#183322] outline-none focus:border-[#f66812] focus:ring-2 focus:ring-[#f66812]/15"
                  />
                  <span className={`text-xs font-medium ${ADMIN_TEXT_MUTED}`}>
                    Դ
                  </span>
                </div>
              ) : null}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${item.label}`}
                onClick={() =>
                  onChange(items.filter((row) => row.key !== item.key))
                }
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-[#c04545] transition-colors hover:bg-[#fff0f0] disabled:opacity-50"
              >
                <X className="size-4" strokeWidth={2.25} aria-hidden />
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="flex flex-col gap-2 border-t border-[#ead7bf]/80 bg-white/70 p-2.5">
        <div
          className={
            showPrice
              ? "grid grid-cols-2 gap-2"
              : "flex items-center gap-2"
          }
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={80}
            className={`${ADMIN_INPUT} h-10 min-w-0 !w-full !rounded-xl !px-3 !text-sm`}
          />
          {showPrice ? (
            <input
              value={draftPrice}
              onChange={(event) => setDraftPrice(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Գին"
              inputMode="numeric"
              disabled={disabled}
              className={`${ADMIN_INPUT} h-10 min-w-0 !w-full !rounded-xl !px-3 !text-sm tabular-nums`}
            />
          ) : null}
        </div>
        <button
          type="button"
          disabled={
            disabled ||
            !draft.trim() ||
            (showPrice && parsePriceInput(draftPrice) == null)
          }
          onClick={addItem}
          className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-[#3c2f2f] px-3 text-sm font-medium text-white transition hover:bg-[#2a211f] disabled:opacity-50"
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          Ավելացնել
        </button>
      </div>
    </div>
  );
}

/** Admin product additions / exclusions editor. */
export function ProductDrawerModifiers({
  additions,
  exclusions,
  disabled = false,
  onAdditionsChange,
  onExclusionsChange,
}: ProductDrawerModifiersProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <div>
        <legend className={ADMIN_LABEL}>Ավելացում / Բացառում</legend>
        <p className={`-mt-0.5 text-sm leading-relaxed ${ADMIN_TEXT_MUTED}`}>
          Ավելացում — լրացուցիչ տարբերակ գնով։ Բացառում — ուտեստի հիմնական
          բաղադրիչները, որոնք client-ը կարող է նշել PDP-ում, որ չմտնեն պատրաստի
          ուտեստի մեջ։ Checkbox-ը որոշում է՝ տարբերակը երևա խանութում։
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ModifierColumn
          title="Ավելացում"
          subtitle="լրացուցիչ + գին"
          placeholder="Նոր ավելացում..."
          items={additions}
          disabled={disabled}
          showPrice
          onChange={onAdditionsChange}
        />
        <ModifierColumn
          title="Բացառում (բաղադրիչներ)"
          subtitle="ներառված են սկզբից"
          placeholder="Նոր բաղադրիչ..."
          items={exclusions}
          disabled={disabled}
          showPrice={false}
          onChange={onExclusionsChange}
        />
      </div>
    </fieldset>
  );
}
