"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { SideSheet } from "@/components/ui/SideSheet";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_SHEET_CANCEL,
  ADMIN_SHEET_FOOTER,
  ADMIN_SHEET_PRIMARY_BUTTON,
  ADMIN_SHEET_SURFACE,
} from "@/features/admin/ui/admin-form-classes";
import { AdminSheetHeader } from "@/features/admin/ui/AdminSheetHeader";
import { getAdminCopy } from "@/features/admin/ui/admin-copy";
import { getCouponAllowedUsersAction } from "@/features/promotions/application/coupon-user-actions";
import {
  createPromotionAction,
  updatePromotionAction,
} from "@/features/promotions/application/upsert-promotion";
import type { AdminPromotionListItem } from "@/features/promotions/application/queries";
import type { CouponUserPickerOption } from "@/features/promotions/domain/coupon-user-picker";
import type { DiscountType } from "@/features/promotions/domain/promotion-rules";
import { CouponUserSelect } from "@/features/promotions/ui/CouponUserSelect";

type CouponDrawerCoupon = Pick<
  AdminPromotionListItem,
  | "id"
  | "code"
  | "discountType"
  | "discountValue"
  | "totalUsageLimit"
  | "endsAt"
  | "isActive"
>;

type CouponDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  coupon?: CouponDrawerCoupon | null;
};

function toDateTimeLocal(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export function CouponDrawer({
  locale,
  open,
  onClose,
  coupon = null,
}: CouponDrawerProps) {
  const router = useRouter();
  const copy = getAdminCopy(locale);
  const commonCopy = copy.common;
  const drawerCopy = copy.drawers.coupon;
  const isEdit = coupon != null;
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] =
    useState<DiscountType>("PERCENTAGE");
  const [value, setValue] = useState("10");
  const [quantity, setQuantity] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [allowedUsers, setAllowedUsers] = useState<CouponUserPickerOption[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      if (coupon) {
        setName(coupon.code ?? "");
        setCode(coupon.code ?? "");
        setDiscountType(
          coupon.discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
        );
        setValue(String(coupon.discountValue));
        setQuantity(
          coupon.totalUsageLimit != null ? String(coupon.totalUsageLimit) : "",
        );
        setExpiresAt(toDateTimeLocal(coupon.endsAt));
        setError(null);
        return;
      }

      setName("");
      setCode("");
      setDiscountType("PERCENTAGE");
      setValue("10");
      setQuantity("1");
      setExpiresAt("");
      setAllowedUsers([]);
      setError(null);
    });

    if (coupon) {
      startTransition(async () => {
        const result = await getCouponAllowedUsersAction(locale, {
          promotionId: coupon.id,
        });
        if (cancelled) {
          return;
        }
        if (result.ok) {
          setAllowedUsers(result.value);
        } else {
          setAllowedUsers([]);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [open, coupon, locale]);

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? drawerCopy.editTitle : drawerCopy.addTitle}
      panelClassName="w-full max-w-md"
      surfaceClassName={ADMIN_SHEET_SURFACE}
      closeTone="brand"
      backdropBlur
    >
      <AdminSheetHeader
        title={isEdit ? drawerCopy.editTitle : drawerCopy.addTitle}
      />

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            const nextCode = (code.trim() || name.trim()).toUpperCase();
            if (!nextCode) {
              setError(drawerCopy.codeRequired);
              return;
            }

            const payload = {
              kind: "COUPON" as const,
              code: nextCode,
              productId: null,
              categoryId: null,
              discountType,
              discountValue: Number(value),
              maxDiscountAmount: null,
              minimumOrderAmount: null,
              totalUsageLimit: quantity ? Number(quantity) : null,
              perUserUsageLimit: null,
              priority: 0,
              allowStacking: false,
              isActive: coupon?.isActive ?? true,
              startsAt: null,
              endsAt: expiresAt ? new Date(expiresAt) : null,
              allowedUserIds: allowedUsers.map((user) => user.id),
            };

            startTransition(async () => {
              setError(null);
              const result =
                isEdit && coupon
                  ? await updatePromotionAction(locale, coupon.id, payload)
                  : await createPromotionAction(locale, payload);

              if (!result.ok) {
                setError(result.error.message);
                return;
              }

              onClose();
              router.refresh();
            });
          }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={ADMIN_LABEL}>{drawerCopy.name}</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={drawerCopy.name}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
              <label>
                <span className={ADMIN_LABEL}>{drawerCopy.code}</span>
                <input
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
                  placeholder={drawerCopy.code}
                  className={`${ADMIN_INPUT} uppercase`}
                  disabled={isPending}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className={ADMIN_LABEL}>{drawerCopy.discountType}</span>
                <SelectDropdown
                  ariaLabel={drawerCopy.discountType}
                  value={discountType}
                  options={[
                    { label: drawerCopy.percentOff, value: "PERCENTAGE" },
                    { label: drawerCopy.fixedAmd, value: "FIXED" },
                  ]}
                  disabled={isPending}
                  deferChange={false}
                  className="mt-1"
                  onValueChange={(next) =>
                    setDiscountType(next as DiscountType)
                  }
                />
              </div>
              <label>
                <span className={ADMIN_LABEL}>{drawerCopy.value}</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={ADMIN_LABEL}>{drawerCopy.quantity}</span>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
              <label>
                <span className={ADMIN_LABEL}>{drawerCopy.expiresOptional}</span>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                />
              </label>
            </div>

            <CouponUserSelect
              locale={locale}
              selectedUsers={allowedUsers}
              disabled={isPending}
              onSelectedChange={setAllowedUsers}
            />

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </div>

          <div className={ADMIN_SHEET_FOOTER}>
            <Button
              type="submit"
              disabled={isPending}
              className={ADMIN_SHEET_PRIMARY_BUTTON}
            >
              {isPending
                ? isEdit
                  ? commonCopy.saving
                  : commonCopy.creating
                : isEdit
                  ? commonCopy.save
                  : commonCopy.create}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className={ADMIN_SHEET_CANCEL}
            >
              {commonCopy.cancel}
            </button>
          </div>
        </form>
    </SideSheet>
  );
}
