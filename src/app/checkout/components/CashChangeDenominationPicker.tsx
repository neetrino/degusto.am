'use client';

import Image from 'next/image';
import type { CashChangeAmdDenomination } from '../constants/cash-denominations';
import { CASH_CHANGE_AMD_DENOMINATIONS, cashChangeAmdNoteSrc } from '../constants/cash-denominations';
import { CHECKOUT_OPTION_IDLE, CHECKOUT_OPTION_SELECTED } from '../checkout-ui';

interface CashChangeDenominationPickerProps {
  value: string | undefined;
  onSelectAmount: (amount: CashChangeAmdDenomination) => void;
  onClearSelection: () => void;
  disabled: boolean;
  noteAlt: (amount: CashChangeAmdDenomination) => string;
  groupAriaLabel: string;
  noChangeLabel: string;
}

function parseCashAmount(raw: string | undefined): number | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function CashChangeDenominationPicker({
  value,
  onSelectAmount,
  onClearSelection,
  disabled,
  noteAlt,
  groupAriaLabel,
  noChangeLabel,
}: CashChangeDenominationPickerProps) {
  const parsed = parseCashAmount(value);
  const isNoChangeSelected = parsed === null;

  return (
    <div
      className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4"
      role="group"
      aria-label={groupAriaLabel}
    >
      {CASH_CHANGE_AMD_DENOMINATIONS.map((amount) => {
        const selected = parsed === amount;
        return (
          <button
            key={amount}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => {
              if (selected) {
                onClearSelection();
                return;
              }
              onSelectAmount(amount);
            }}
            className={`relative aspect-[2.05/1] w-full overflow-hidden rounded-xl border-2 p-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F66812] focus-visible:ring-offset-2 ${
              selected ? CHECKOUT_OPTION_SELECTED : CHECKOUT_OPTION_IDLE
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Image
              src={cashChangeAmdNoteSrc(amount)}
              alt={noteAlt(amount)}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover object-center"
              unoptimized
            />
          </button>
        );
      })}
      <button
        type="button"
        disabled={disabled}
        aria-pressed={isNoChangeSelected}
        onClick={onClearSelection}
        className={`col-span-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F66812] focus-visible:ring-offset-2 md:col-span-4 ${
          isNoChangeSelected ? CHECKOUT_OPTION_SELECTED : CHECKOUT_OPTION_IDLE
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {noChangeLabel}
      </button>
    </div>
  );
}
