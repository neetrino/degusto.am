"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { SelectDropdown } from "@/components/ui/SelectDropdown";
import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import type { PickupBranchOption } from "@/features/checkout/domain/pickup-branches";
import {
  CheckoutCashChange,
  type CashChangePreference,
} from "@/features/checkout/ui/CheckoutCashChange";
import {
  checkoutSectionItem,
  checkoutSectionStagger,
} from "@/features/checkout/ui/CheckoutMotion";
import { CheckoutPaymentMethods } from "@/features/checkout/ui/CheckoutPaymentMethods";
import type { CheckoutDeliveryOption } from "@/features/delivery/application/queries";

const FIELD_CLASS =
  "h-12 w-full rounded-[70px] border border-[#dedede] bg-white px-5 text-[#3C2F2F] shadow-none outline-none transition-[border-color,box-shadow] placeholder:text-[#a1a1aa] hover:border-[#ff7f20]/50 focus:border-[#ff7f20] focus:ring-2 focus:ring-[#ff7f20]/20 disabled:bg-[#f7f7f8]";

const SECTION_CLASS =
  "rounded-[32px] border border-[#dedede]/90 bg-white p-6 shadow-[0_12px_40px_rgba(60,47,47,0.04)] sm:p-7";

const SECTION_TITLE =
  "mb-6 font-display text-2xl leading-none font-black tracking-tight text-[#3C2F2F] uppercase";

const FULFILLMENT_TOGGLE_ACTIVE =
  "border-[#ff7f20] bg-[#fff5ed] text-[#3C2F2F] shadow-[0_0_0_1px_rgba(255,127,32,0.15)]";
const FULFILLMENT_TOGGLE_IDLE =
  "border-[#dedede] bg-[#f7f7f8] text-[#3C2F2F] hover:border-[#ff7f20]/45 hover:bg-[#fffaf6]";

type CheckoutDetailsLabels = {
  contactInformation: string;
  shippingMethod: string;
  paymentMethod: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  deliveryLocation: string;
  pickupBranch: string;
  selectBranch: string;
  phonePlaceholder: string;
  addressPlaceholder: string;
  storePickup: string;
  delivery: string;
  changeTitle: string;
  changeHint: string;
  changeNone: string;
};

type PaymentOption = {
  id: CheckoutPaymentMethod;
  name: string;
  description: string;
  logos?: Array<{ src: string; alt: string }>;
};

type CheckoutDetailsSectionsProps = {
  labels: CheckoutDetailsLabels;
  pending: boolean;
  shippingMethod: "pickup" | "delivery";
  onShippingMethodChange: (method: "pickup" | "delivery") => void;
  deliveryOptions: CheckoutDeliveryOption[];
  deliveryRuleId: string;
  pickupBranches: ReadonlyArray<PickupBranchOption>;
  pickupBranchId: string;
  onPickupBranchChange: (branchId: string) => void;
  paymentMethod: CheckoutPaymentMethod;
  onPaymentMethodChange: (method: CheckoutPaymentMethod) => void;
  paymentOptions: PaymentOption[];
  cashChangePreference: CashChangePreference;
  onCashChangePreferenceChange: (value: CashChangePreference) => void;
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
  defaultPhone: string;
  defaultLine1: string;
};

export function CheckoutDetailsSections({
  labels,
  pending,
  shippingMethod,
  onShippingMethodChange,
  deliveryOptions,
  deliveryRuleId,
  pickupBranches,
  pickupBranchId,
  onPickupBranchChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentOptions,
  cashChangePreference,
  onCashChangePreferenceChange,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  defaultPhone,
  defaultLine1,
}: CheckoutDetailsSectionsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={reduceMotion ? undefined : checkoutSectionStagger}
      className="space-y-6"
    >
      <motion.section
        variants={reduceMotion ? undefined : checkoutSectionItem}
        className={SECTION_CLASS}
      >
        <h2 className={SECTION_TITLE}>{labels.contactInformation}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-[#3C2F2F]">
              {labels.firstName}
              <input
                name="firstName"
                required
                defaultValue={defaultFirstName}
                disabled={pending}
                className={FIELD_CLASS}
                autoComplete="given-name"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-[#3C2F2F]">
              {labels.lastName}
              <input
                name="lastName"
                required
                defaultValue={defaultLastName}
                disabled={pending}
                className={FIELD_CLASS}
                autoComplete="family-name"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-[#3C2F2F]">
              {labels.email}
              <input
                name="contactEmail"
                type="email"
                required
                defaultValue={defaultEmail}
                disabled={pending}
                className={FIELD_CLASS}
                autoComplete="email"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-[#3C2F2F]">
              {labels.phone}
              <input
                name="contactPhone"
                type="tel"
                required
                defaultValue={defaultPhone}
                placeholder={labels.phonePlaceholder}
                disabled={pending}
                className={FIELD_CLASS}
                autoComplete="tel"
              />
            </label>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={reduceMotion ? undefined : checkoutSectionItem}
        className={`${SECTION_CLASS} relative z-20`}
      >
        <h2 className={SECTION_TITLE}>{labels.shippingMethod}</h2>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onShippingMethodChange("pickup")}
            disabled={pending}
            aria-pressed={shippingMethod === "pickup"}
            className={`rounded-[24px] border-2 px-3 py-2.5 text-center text-xs font-bold tracking-wide uppercase transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
              shippingMethod === "pickup"
                ? FULFILLMENT_TOGGLE_ACTIVE
                : FULFILLMENT_TOGGLE_IDLE
            }`}
          >
            {labels.storePickup}
          </button>
          <button
            type="button"
            onClick={() => onShippingMethodChange("delivery")}
            disabled={pending || deliveryOptions.length === 0}
            aria-pressed={shippingMethod === "delivery"}
            className={`rounded-[24px] border-2 px-3 py-2.5 text-center text-xs font-bold tracking-wide uppercase transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
              shippingMethod === "delivery"
                ? FULFILLMENT_TOGGLE_ACTIVE
                : FULFILLMENT_TOGGLE_IDLE
            }`}
          >
            {labels.delivery}
          </button>
        </div>

        <AnimatePresence initial={false} mode="wait">
          {shippingMethod === "pickup" ? (
            <motion.div
              key="pickup-branch"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 12, filter: "blur(6px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, y: -8, filter: "blur(4px)" }
              }
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl"
            >
              <div className="flex flex-col gap-2 text-sm font-semibold text-[#3C2F2F]">
                {labels.pickupBranch}
                <SelectDropdown
                  name="pickupBranchId"
                  ariaLabel={labels.pickupBranch}
                  value={pickupBranchId}
                  allLabel={labels.selectBranch}
                  options={pickupBranches.map((branch) => ({
                    label: branch.label,
                    value: branch.id,
                  }))}
                  disabled={pending || pickupBranches.length === 0}
                  onValueChange={onPickupBranchChange}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="shipping-address"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 12, filter: "blur(6px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, y: -8, filter: "blur(4px)" }
              }
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div className="flex flex-col gap-2 text-sm font-semibold text-[#3C2F2F]">
                {labels.deliveryLocation}
                <input
                  type="hidden"
                  name="deliveryRuleId"
                  value={deliveryRuleId}
                />
                <div
                  aria-label={labels.deliveryLocation}
                  className="pointer-events-none flex h-12 w-full cursor-default select-none items-center rounded-[70px] border border-[#dedede] bg-[#f7f7f8] px-5 text-[#3C2F2F]"
                >
                  {deliveryOptions.find((option) => option.id === deliveryRuleId)
                    ?.label ?? "Yerevan, Armenia"}
                </div>
              </div>
              <label className="flex flex-col gap-2 text-sm font-semibold text-[#3C2F2F]">
                {labels.address}
                <input
                  name="line1"
                  required
                  defaultValue={defaultLine1}
                  placeholder={labels.addressPlaceholder}
                  disabled={pending}
                  className={FIELD_CLASS}
                  autoComplete="street-address"
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <motion.div variants={reduceMotion ? undefined : checkoutSectionItem}>
        <CheckoutPaymentMethods
          title={labels.paymentMethod}
          options={paymentOptions}
          value={paymentMethod}
          onChange={onPaymentMethodChange}
          disabled={pending}
        />
      </motion.div>

      <AnimatePresence initial={false}>
        {paymentMethod === "cash_on_delivery" ? (
          <motion.div
            key="cash-change"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 24, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, y: -12, filter: "blur(6px)" }
            }
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <CheckoutCashChange
              title={labels.changeTitle}
              hint={labels.changeHint}
              noneLabel={labels.changeNone}
              value={cashChangePreference}
              onChange={onCashChangePreferenceChange}
              disabled={pending}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
