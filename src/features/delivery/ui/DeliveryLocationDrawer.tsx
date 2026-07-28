"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
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
import {
  createDeliveryLocationAction,
  updateDeliveryLocationAction,
} from "@/features/delivery/application/manage-delivery";
import type { AdminDeliveryLocation } from "@/features/delivery/application/queries";

type DeliveryLocationDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  location?: AdminDeliveryLocation | null;
};

type DeliveryLocationFormProps = {
  locale: string;
  location: AdminDeliveryLocation | null;
  onClose: () => void;
};

function DeliveryLocationForm({
  locale,
  location,
  onClose,
}: DeliveryLocationFormProps) {
  const router = useRouter();
  const isEdit = location != null;
  const [country, setCountry] = useState(location?.country ?? "");
  const [city, setCity] = useState(location?.city ?? "");
  const [priceAmount, setPriceAmount] = useState(
    location ? String(location.priceAmount) : "",
  );
  const [freeThresholdAmount, setFreeThresholdAmount] = useState(
    location?.freeThresholdAmount != null
      ? String(location.freeThresholdAmount)
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();

        const payload = {
          country,
          city,
          priceAmount: Number(priceAmount),
          freeThresholdAmount:
            freeThresholdAmount.trim() === ""
              ? null
              : Number(freeThresholdAmount),
        };

        startTransition(async () => {
          setError(null);
          const result =
            isEdit && location
              ? await updateDeliveryLocationAction(
                  locale,
                  location.id,
                  payload,
                )
              : await createDeliveryLocationAction(locale, payload);

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={ADMIN_LABEL}>Country</span>
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Armenia"
              required
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>

          <label>
            <span className={ADMIN_LABEL}>City</span>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Yerevan"
              required
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={ADMIN_LABEL}>Price (AMD)</span>
            <input
              type="number"
              min={0}
              step={1}
              required
              value={priceAmount}
              onChange={(event) => setPriceAmount(event.target.value)}
              placeholder="1500"
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>

          <label>
            <span className={ADMIN_LABEL}>Free delivery from (AMD)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={freeThresholdAmount}
              onChange={(event) => setFreeThresholdAmount(event.target.value)}
              placeholder="50000"
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>

      <div className={ADMIN_SHEET_FOOTER}>
        <Button
          type="submit"
          disabled={isPending}
          className={ADMIN_SHEET_PRIMARY_BUTTON}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className={ADMIN_SHEET_CANCEL}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function DeliveryLocationDrawer({
  locale,
  open,
  onClose,
  location = null,
}: DeliveryLocationDrawerProps) {
  const formKey = location?.id ?? "new";

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={location ? "Edit location" : "Add location"}
      surfaceClassName={ADMIN_SHEET_SURFACE}
      closeTone="brand"
      backdropBlur
    >
      <AdminSheetHeader
        title={location ? "Edit location" : "Add location"}
      />

      <DeliveryLocationForm
        key={formKey}
        locale={locale}
        location={location}
        onClose={onClose}
      />
    </SideSheet>
  );
}
