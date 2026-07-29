"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { SelectDropdown } from "@/components/ui/SelectDropdown";
import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
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

const RADIO_SELECTED =
  "border-[#ff7f20] bg-[#fff5ed] shadow-[0_0_0_1px_rgba(255,127,32,0.15)]";
const RADIO_IDLE =
  "border-[#dedede] bg-white hover:border-[#ff7f20]/45 hover:bg-[#fffaf6]";

type CheckoutDetailsLabels = {
  contactInformation: string;
  shippingMethod: string;
  shippingAddress: string;
  paymentMethod: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  deliveryLocation: string;
  selectLocation: string;
  phonePlaceholder: string;
  cityPlaceholder: string;
  addressPlaceholder: string;
  storePickup: string;
  storePickupDescription: string;
  delivery: string;
  deliveryDescription: string;
  changeTitle: string;
  changeHint: string;
  changeNone: string;
};

type PaymentOption = {
  id: CheckoutPaymentMethod;
  name: string;
  description: string;
  logoSrc: string | null;
};

type CheckoutDetailsSectionsProps = {
  labels: CheckoutDetailsLabels;
  pending: boolean;
  shippingMethod: "pickup" | "delivery";
  onShippingMethodChange: (method: "pickup" | "delivery") => void;
  deliveryOptions: CheckoutDeliveryOption[];
  deliveryRuleId: string;
  onDeliveryRuleChange: (ruleId: string) => void;
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
  onDeliveryRuleChange,
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
        className={SECTION_CLASS}
      >
        <h2 className={SECTION_TITLE}>{labels.shippingMethod}</h2>
        <div className="space-y-3">
          <label
            className={`flex cursor-pointer items-center rounded-[24px] border-2 p-4 transition-all ${
              shippingMethod === "pickup" ? RADIO_SELECTED : RADIO_IDLE
            }`}
          >
            <input
              type="radio"
              name="shippingMethod"
              value="pickup"
              checked={shippingMethod === "pickup"}
              onChange={() => onShippingMethodChange("pickup")}
              className="mr-4 accent-[#ff7f20]"
              disabled={pending}
            />
            <div className="flex-1">
              <div className="font-semibold text-[#3C2F2F]">
                {labels.storePickup}
              </div>
              <div className="mt-0.5 text-sm text-[#717182]">
                {labels.storePickupDescription}
              </div>
            </div>
          </label>
          <label
            className={`flex cursor-pointer items-center rounded-[24px] border-2 p-4 transition-all ${
              shippingMethod === "delivery" ? RADIO_SELECTED : RADIO_IDLE
            }`}
          >
            <input
              type="radio"
              name="shippingMethod"
              value="delivery"
              checked={shippingMethod === "delivery"}
              onChange={() => onShippingMethodChange("delivery")}
              className="mr-4 accent-[#ff7f20]"
              disabled={pending || deliveryOptions.length === 0}
            />
            <div className="flex-1">
              <div className="font-semibold text-[#3C2F2F]">
                {labels.delivery}
              </div>
              <div className="mt-0.5 text-sm text-[#717182]">
                {labels.deliveryDescription}
              </div>
            </div>
          </label>
        </div>
      </motion.section>

      <AnimatePresence initial={false}>
        {shippingMethod === "delivery" ? (
          <motion.section
            key="shipping-address"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 20, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, y: -12, filter: "blur(6px)" }
            }
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={SECTION_CLASS}
          >
            <h2 className={SECTION_TITLE}>{labels.shippingAddress}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2 text-sm font-semibold text-[#3C2F2F]">
                {labels.deliveryLocation}
                <SelectDropdown
                  name="deliveryRuleId"
                  ariaLabel={labels.deliveryLocation}
                  value={deliveryRuleId}
                  allLabel={labels.selectLocation}
                  options={deliveryOptions.map((option) => ({
                    label: option.label,
                    value: option.id,
                  }))}
                  disabled={pending || deliveryOptions.length === 0}
                  onValueChange={onDeliveryRuleChange}
                />
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
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

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
