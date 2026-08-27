"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState, useTransition, type FormEvent } from "react";

import type { CheckoutOrderProduct } from "@/features/checkout/ui/checkout-order-product";
import { previewCouponAction } from "@/features/checkout/application/preview-coupon";
import { createOrderAction } from "@/features/checkout/create-order";
import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import {
  isPickupBranchId,
  resolvePickupBranchLabel,
  type PickupBranchId,
  type PickupBranchOption,
} from "@/features/checkout/domain/pickup-branches";
import type { CashChangePreference } from "@/features/checkout/ui/CheckoutCashChange";
import { CheckoutDetailsSections } from "@/features/checkout/ui/CheckoutDetailsSections";
import {
  CHECKOUT_EASE,
  checkoutBlock,
} from "@/features/checkout/ui/CheckoutMotion";
import { CheckoutOrderSummary } from "@/features/checkout/ui/CheckoutOrderSummary";
import { CheckoutProductsInOrder } from "@/features/checkout/ui/CheckoutProductsInOrder";
import { CheckoutSmoothScroll } from "@/features/checkout/ui/CheckoutSmoothScroll";
import { submitIdramForm } from "@/features/checkout/ui/submit-idram-form";
import type { CheckoutDeliveryOption } from "@/features/delivery/application/queries";
import type { Locale } from "@/lib/i18n/config";
import { formatMoneyAmount } from "@/lib/money/format";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

type CheckoutLabels = {
  title: string;
  productsInOrder: string;
  itemsOne: string;
  itemsMany: string;
  removeItem: string;
  contactInformation: string;
  shippingMethod: string;
  shippingAddress: string;
  paymentMethod: string;
  orderSummary: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  deliveryLocation: string;
  selectLocation: string;
  pickupBranch: string;
  selectBranch: string;
  phonePlaceholder: string;
  cityPlaceholder: string;
  addressPlaceholder: string;
  storePickup: string;
  storePickupDescription: string;
  delivery: string;
  deliveryDescription: string;
  freePickup: string;
  enterCity: string;
  selectDeliveryLocation: string;
  selectPickupBranch: string;
  pickupBranchRequired: string;
  cashOnDelivery: string;
  cashOnDeliveryDescription: string;
  idram: string;
  idramDescription: string;
  arca: string;
  arcaDescription: string;
  changeTitle: string;
  changeHint: string;
  changeNone: string;
  changeRequired: string;
  couponTitle: string;
  couponPlaceholder: string;
  couponApply: string;
  couponApplying: string;
  discount: string;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  placeOrder: string;
  processing: string;
  continueShopping: string;
  cartEmpty: string;
};

type CheckoutFormProps = {
  locale: Locale;
  labels: CheckoutLabels;
  productsHref: string;
  orderProducts: CheckoutOrderProduct[];
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
  defaultPhone: string;
  defaultLine1: string;
  subtotalAmount: number;
  deliveryOptions: CheckoutDeliveryOption[];
  pickupBranches: ReadonlyArray<PickupBranchOption>;
  hasItems: boolean;
  paymentNotice?: string | null;
};

function quoteDeliveryAmount(
  option: CheckoutDeliveryOption | undefined,
  subtotalAmount: number,
): number {
  if (!option) return 0;
  if (
    option.freeThresholdAmount !== null &&
    subtotalAmount >= option.freeThresholdAmount
  ) {
    return 0;
  }
  return option.priceAmount;
}

export function CheckoutForm({
  locale,
  labels,
  productsHref,
  orderProducts,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  defaultPhone,
  defaultLine1,
  subtotalAmount,
  deliveryOptions,
  pickupBranches,
  hasItems,
  paymentNotice = null,
}: CheckoutFormProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const defaultRuleId = deliveryOptions[0]?.id ?? "";
  const [shippingMethod, setShippingMethod] = useState<"pickup" | "delivery">(
    deliveryOptions.length > 0 ? "delivery" : "pickup",
  );
  const [deliveryRuleId, setDeliveryRuleId] = useState(defaultRuleId);
  const [pickupBranchId, setPickupBranchId] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("cash_on_delivery");
  const [cashChangePreference, setCashChangePreference] =
    useState<CashChangePreference>(null);
  const [error, setError] = useState<string | null>(paymentNotice);
  const [couponDraft, setCouponDraft] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null,
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [applyingCoupon, startApplyCoupon] = useTransition();

  const selectedDelivery = deliveryOptions.find(
    (option) => option.id === deliveryRuleId,
  );

  const paymentOptions = useMemo(
    () => [
      {
        id: "cash_on_delivery" as const,
        name: labels.cashOnDelivery,
        description: labels.cashOnDeliveryDescription,
        logoSrc: null,
      },
      {
        id: "idram" as const,
        name: labels.idram,
        description: labels.idramDescription,
        logoSrc: staticAssetUrl("/assets/payments/idram.webp"),
      },
      {
        id: "arca" as const,
        name: labels.arca,
        description: labels.arcaDescription,
        logoSrc: staticAssetUrl("/assets/payments/arca.webp"),
      },
    ],
    [
      labels.arca,
      labels.arcaDescription,
      labels.cashOnDelivery,
      labels.cashOnDeliveryDescription,
      labels.idram,
      labels.idramDescription,
    ],
  );

  function formatMoney(amount: number): string {
    return formatMoneyAmount(amount, "AMD", locale);
  }

  const quotedDelivery = quoteDeliveryAmount(selectedDelivery, subtotalAmount);
  const shippingAmount = shippingMethod === "pickup" ? 0 : quotedDelivery;
  const totalAmount =
    Math.max(0, subtotalAmount - discountAmount) + shippingAmount;

  const selectedPickupBranch = pickupBranches.find(
    (branch) => branch.id === pickupBranchId,
  );

  const shippingFormatted =
    shippingMethod === "pickup"
      ? selectedPickupBranch
        ? `${labels.freePickup} · ${selectedPickupBranch.label}`
        : labels.selectPickupBranch
      : selectedDelivery
        ? `${formatMoney(shippingAmount)} (${selectedDelivery.label})`
        : labels.selectDeliveryLocation;

  function onPickupBranchChange(branchId: string): void {
    setPickupBranchId(branchId);
  }

  function onPaymentMethodChange(method: CheckoutPaymentMethod): void {
    setPaymentMethod(method);
    if (method !== "cash_on_delivery") {
      setCashChangePreference(null);
    }
  }

  function clearAppliedCoupon(): void {
    setAppliedCouponCode(null);
    setDiscountAmount(0);
  }

  function onCouponDraftChange(value: string): void {
    setCouponDraft(value);
    setCouponError(null);
    if (appliedCouponCode) {
      clearAppliedCoupon();
    }
  }

  function onApplyCoupon(): void {
    const code = couponDraft.trim();
    if (!code) {
      return;
    }

    setCouponError(null);
    startApplyCoupon(async () => {
      const result = await previewCouponAction({ couponCode: code });
      if (!result.ok) {
        clearAppliedCoupon();
        setCouponError(result.error);
        return;
      }

      setAppliedCouponCode(result.code);
      setCouponDraft(result.code);
      setDiscountAmount(result.discountAmount);
      setCouponError(null);
    });
  }

  if (!hasItems) {
    return (
      <CheckoutSmoothScroll>
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white">
          <div className="mx-auto max-w-[min(1450px,calc(100%-2rem))] px-4 py-16 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))] lg:py-20">
            <motion.h1
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 28, filter: "blur(12px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: CHECKOUT_EASE }}
              className="font-display text-4xl leading-none font-black tracking-tight text-brand-headline uppercase md:text-5xl lg:text-[3.75rem]"
            >
              {labels.title}
            </motion.h1>
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 32, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.75,
                ease: CHECKOUT_EASE,
                delay: 0.15,
              }}
              className="mt-10 max-w-xl rounded-[32px] border border-[#dedede] bg-white p-8 text-center shadow-[0_18px_50px_rgba(60,47,47,0.06)] sm:p-10"
            >
              <p className="text-base text-[#5F6B66]">{labels.cartEmpty}</p>
              <Link
                href={productsHref}
                className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#ff7f20] px-7 text-base font-bold text-white transition hover:brightness-95"
              >
                {labels.continueShopping}
              </Link>
            </motion.div>
          </div>
        </div>
      </CheckoutSmoothScroll>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);

    if (
      paymentMethod === "cash_on_delivery" &&
      cashChangePreference == null
    ) {
      setError(labels.changeRequired);
      return;
    }

    if (shippingMethod === "pickup" && !isPickupBranchId(pickupBranchId)) {
      setError(labels.pickupBranchRequired);
      return;
    }

    const resolvedPickupBranchId: PickupBranchId | undefined =
      shippingMethod === "pickup" && isPickupBranchId(pickupBranchId)
        ? pickupBranchId
        : undefined;
    const pickupBranchLabel =
      resolvedPickupBranchId != null
        ? resolvePickupBranchLabel(resolvedPickupBranchId, pickupBranches)
        : null;

    startTransition(async () => {
      const result = await createOrderAction({
        locale,
        idempotencyKey,
        firstName: String(data.get("firstName") ?? ""),
        lastName: String(data.get("lastName") ?? ""),
        contactEmail: String(data.get("contactEmail") ?? ""),
        contactPhone: String(data.get("contactPhone") ?? ""),
        shippingMethod,
        paymentMethod,
        cashChangePreference:
          paymentMethod === "cash_on_delivery"
            ? (cashChangePreference ?? undefined)
            : undefined,
        deliveryRuleId:
          shippingMethod === "delivery" ? deliveryRuleId || undefined : undefined,
        pickupBranchId: resolvedPickupBranchId,
        city:
          shippingMethod === "delivery"
            ? selectedDelivery?.city
            : undefined,
        line1:
          shippingMethod === "delivery"
            ? String(data.get("line1") ?? "")
            : (pickupBranchLabel ?? undefined),
        couponCode: appliedCouponCode ?? undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.idram) {
        submitIdramForm(result.idram.formAction, result.idram.formData);
        return;
      }

      router.push(`/${locale}/checkout/success/${result.orderNumber}`);
      router.refresh();
    });
  }

  return (
    <CheckoutSmoothScroll>
      <div className="relative w-full">
        <div className="relative mx-auto max-w-[min(1450px,calc(100%-2rem))] px-0 pt-2 pb-8 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-0 lg:max-w-[min(1450px,calc(100%-3rem))] lg:px-0 lg:pt-14 lg:pb-20">
          <motion.h1
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={reduceMotion ? undefined : checkoutBlock}
            className="font-display text-4xl leading-none font-black tracking-tight text-brand-headline uppercase md:text-5xl lg:text-[3.75rem]"
          >
            {labels.title}
          </motion.h1>

          <motion.div
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={reduceMotion ? undefined : checkoutBlock}
            className="mt-8 lg:mt-10"
          >
            <CheckoutProductsInOrder
              products={orderProducts}
              title={labels.productsInOrder}
              itemsOneLabel={labels.itemsOne}
              itemsManyLabel={labels.itemsMany}
              removeItemLabel={labels.removeItem}
              onCartChanged={clearAppliedCoupon}
            />
          </motion.div>

          <form onSubmit={onSubmit} className="mt-8 lg:mt-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
              <motion.div
                initial={reduceMotion ? false : "hidden"}
                animate="visible"
                variants={reduceMotion ? undefined : checkoutBlock}
                className="min-w-0 lg:col-span-2"
              >
                <CheckoutDetailsSections
                  labels={labels}
                  pending={pending}
                  shippingMethod={shippingMethod}
                  onShippingMethodChange={setShippingMethod}
                  deliveryOptions={deliveryOptions}
                  deliveryRuleId={deliveryRuleId}
                  onDeliveryRuleChange={setDeliveryRuleId}
                  pickupBranches={pickupBranches}
                  pickupBranchId={pickupBranchId}
                  onPickupBranchChange={onPickupBranchChange}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={onPaymentMethodChange}
                  paymentOptions={paymentOptions}
                  cashChangePreference={cashChangePreference}
                  onCashChangePreferenceChange={setCashChangePreference}
                  defaultFirstName={defaultFirstName}
                  defaultLastName={defaultLastName}
                  defaultEmail={defaultEmail}
                  defaultPhone={defaultPhone}
                  defaultLine1={defaultLine1}
                />
              </motion.div>

              {/* Tall grid column (default stretch) so sticky has room to travel */}
              <div className="min-w-0">
                <CheckoutOrderSummary
                  title={labels.orderSummary}
                  couponTitle={labels.couponTitle}
                  couponPlaceholder={labels.couponPlaceholder}
                  couponApplyLabel={labels.couponApply}
                  couponApplyingLabel={labels.couponApplying}
                  discountLabel={labels.discount}
                  subtotalLabel={labels.subtotal}
                  shippingLabel={labels.shipping}
                  taxLabel={labels.tax}
                  totalLabel={labels.total}
                  subtotalFormatted={formatMoney(subtotalAmount)}
                  shippingFormatted={shippingFormatted}
                  taxFormatted={formatMoney(0)}
                  discountFormatted={
                    discountAmount > 0 ? formatMoney(discountAmount) : null
                  }
                  totalFormatted={formatMoney(totalAmount)}
                  couponDraft={couponDraft}
                  onCouponDraftChange={onCouponDraftChange}
                  onApplyCoupon={onApplyCoupon}
                  couponError={couponError}
                  isApplyingCoupon={applyingCoupon}
                  error={error}
                  isSubmitting={pending}
                  placeOrderLabel={labels.placeOrder}
                  processingLabel={labels.processing}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </CheckoutSmoothScroll>
  );
}
