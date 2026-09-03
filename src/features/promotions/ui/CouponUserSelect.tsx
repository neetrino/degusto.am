"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useId, useState, useTransition } from "react";

import {
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import { getAdminCopy } from "@/features/admin/ui/admin-copy";
import {
  formatCouponUserLabel,
  MAX_COUPON_ALLOWED_USERS,
  type CouponUserPickerOption,
} from "@/features/promotions/domain/coupon-user-picker";
import { searchCouponUsersAction } from "@/features/promotions/application/coupon-user-actions";

type CouponUserSelectProps = {
  locale: string;
  selectedUsers: CouponUserPickerOption[];
  disabled: boolean;
  onSelectedChange: (users: CouponUserPickerOption[]) => void;
};

function userKey(user: CouponUserPickerOption): string {
  return user.id;
}

export function CouponUserSelect({
  locale,
  selectedUsers,
  disabled,
  onSelectedChange,
}: CouponUserSelectProps) {
  const copy = getAdminCopy(locale);
  const couponCopy = copy.drawers.coupon;
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CouponUserPickerOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedIds = new Set(selectedUsers.map((user) => user.id));
  const triggerHint =
    selectedUsers.length === 0
      ? couponCopy.allUsersAllowed
      : couponCopy.selectedUsersCount.replace(
          "{count}",
          String(selectedUsers.length),
        );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handle = window.setTimeout(() => {
      startTransition(async () => {
        setError(null);
        const result = await searchCouponUsersAction(locale, { query });
        if (!result.ok) {
          setError(result.error.message);
          setResults([]);
          return;
        }
        setResults(result.value);
      });
    }, 250);

    return () => window.clearTimeout(handle);
  }, [locale, open, query]);

  function addUser(user: CouponUserPickerOption): void {
    if (selectedIds.has(user.id)) {
      return;
    }
    if (selectedUsers.length >= MAX_COUPON_ALLOWED_USERS) {
      setError(
        couponCopy.maxUsersError.replace(
          "{count}",
          String(MAX_COUPON_ALLOWED_USERS),
        ),
      );
      return;
    }
    onSelectedChange([...selectedUsers, user]);
    setError(null);
  }

  function removeUser(userId: string): void {
    onSelectedChange(selectedUsers.filter((user) => user.id !== userId));
  }

  return (
    <div>
      <span className={ADMIN_LABEL}>{couponCopy.allowedUsers}</span>
      <div className={`relative mt-1 ${open ? "z-50" : "z-0"}`}>
        <button
          type="button"
          disabled={disabled || isPending}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
          className={`${ADMIN_INPUT} flex items-center justify-between gap-2 pr-3 text-left disabled:opacity-50`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-[#1f1a17]">
                {couponCopy.selectUsers}
            </span>
            <span className="mt-0.5 block truncate text-sm text-[#8a837a]">
              {triggerHint}
            </span>
          </span>
          <ChevronDown
            className={`mt-1 h-4 w-4 shrink-0 text-[#8a837a] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        <div
          className={`absolute top-[calc(100%+0.5rem)] left-0 z-[100] grid w-full transition-[grid-template-rows,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open
              ? "translate-y-0 grid-rows-[1fr] opacity-100"
              : "pointer-events-none -translate-y-1 grid-rows-[0fr] opacity-0"
          }`}
          aria-hidden={!open}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              id={listId}
              className="max-h-72 overflow-y-auto rounded-2xl border border-[#ead7bf]/80 bg-white p-3"
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={couponCopy.searchUsersPlaceholder}
                className={ADMIN_INPUT}
                disabled={disabled || isPending}
              />

              {selectedUsers.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {selectedUsers.map((user) => (
                    <li
                      key={userKey(user)}
                      className="flex items-center justify-between gap-2 rounded-xl bg-[#fff8f0] px-3 py-2 text-sm text-[#1f1a17]"
                    >
                      <span className="min-w-0 truncate">
                        {formatCouponUserLabel(user)}
                      </span>
                      <button
                        type="button"
                        disabled={disabled || isPending}
                        aria-label={`Remove ${formatCouponUserLabel(user)}`}
                        onClick={() => removeUser(user.id)}
                        className="shrink-0 rounded-md p-1 text-[#8a837a] hover:bg-white hover:text-[#1f1a17] disabled:opacity-50"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[#8a837a]">
                  {couponCopy.leaveEmptyHint}
                </p>
              )}

              <div className="mt-3 border-t border-[#ead7bf]/60 pt-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#8a837a]">
                  {couponCopy.searchResults}
                </p>
                {results.length === 0 ? (
                  <p className="text-sm text-[#8a837a]">
                    {isPending ? couponCopy.searching : couponCopy.noUsersFound}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {results.map((user) => {
                      const selected = selectedIds.has(user.id);
                      return (
                        <li key={userKey(user)}>
                          <button
                            type="button"
                            disabled={
                              disabled || isPending || selected
                            }
                            onClick={() => addUser(user)}
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-[#1f1a17] hover:bg-[#fff4eb] disabled:opacity-50"
                          >
                            <span
                              className={
                                selected
                                  ? "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-900 bg-[#1f3a22] text-white"
                                  : "flex h-4 w-4 shrink-0 rounded border border-[#ead7bf] bg-white"
                              }
                              aria-hidden
                            >
                              {selected ? (
                                <svg
                                  viewBox="0 0 12 12"
                                  className="h-3 w-3"
                                  fill="none"
                                >
                                  <path
                                    d="M2.5 6.2 4.8 8.5 9.5 3.5"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : null}
                            </span>
                            <span className="min-w-0 truncate">
                              {formatCouponUserLabel(user)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {error ? (
                <p className="mt-3 text-sm text-red-700">{error}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
