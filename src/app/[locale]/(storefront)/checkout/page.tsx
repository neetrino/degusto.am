import { notFound } from "next/navigation";

import { StorefrontMobileChrome } from "@/components/layout/StorefrontMobileChrome";
import { getCartWithItems } from "@/features/cart/cart";
import { getCheckoutDeliveryOptions } from "@/features/checkout/application/get-checkout-delivery";
import { getCheckoutOrderProducts } from "@/features/checkout/application/get-checkout-order-products";
import { CheckoutForm } from "@/features/checkout/ui/CheckoutForm";
import { getDefaultShippingAddress } from "@/features/profile/application/address-queries";
import { resolveProductPrices } from "@/features/promotions/application/resolve-product-prices";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getSelectedCurrency } from "@/lib/money/display-price";

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
};

function firstPhoneHref(phones: string): string {
  const match = phones.match(/\d[\d\s()-]{5,}/);
  if (!match) {
    return "tel:+37460388080";
  }
  const digits = match[0].replace(/\D/g, "");
  return `tel:+${digits.startsWith("0") ? `374${digits.slice(1)}` : digits}`;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const copy = dictionary.checkout;
  const [user, { items }, deliveryOptions, currency] = await Promise.all([
    getCurrentUser(),
    getCartWithItems(),
    getCheckoutDeliveryOptions(),
    getSelectedCurrency(),
  ]);
  const [defaultAddress, prices, orderProducts] = await Promise.all([
    user ? getDefaultShippingAddress(user.id) : Promise.resolve(null),
    resolveProductPrices(
      items.map(({ product }) => ({
        id: product.id,
        priceAmount: product.priceAmount,
        compareAtAmount: product.compareAtAmount,
      })),
    ),
    getCheckoutOrderProducts(rawLocale, items),
  ]);
  const subtotal = items.reduce((sum, { item, product }) => {
    const unit = prices.get(product.id)?.unitAmount ?? product.priceAmount;
    return sum + item.quantity * unit;
  }, 0);

  const formProps = {
    locale: rawLocale,
    productsHref: `/${rawLocale}/products`,
    hasItems: items.length > 0,
    orderProducts,
    defaultFirstName:
      defaultAddress?.recipientFirstName ?? user?.firstName ?? "",
    defaultLastName:
      defaultAddress?.recipientLastName ?? user?.lastName ?? "",
    defaultEmail: user?.email ?? "",
    defaultPhone: defaultAddress?.phone ?? user?.phone ?? "",
    defaultLine1: defaultAddress?.line1 ?? "",
    subtotalAmount: subtotal,
    deliveryOptions,
    labels: {
      title: copy.title,
      productsInOrder: copy.productsInOrder,
      itemsOne: copy.itemsOne,
      itemsMany: copy.itemsMany,
      removeItem: copy.removeItem,
      contactInformation: copy.contactInformation,
      shippingMethod: copy.shippingMethod,
      shippingAddress: copy.shippingAddress,
      paymentMethod: copy.paymentMethod,
      orderSummary: copy.orderSummary,
      firstName: copy.form.firstName,
      lastName: copy.form.lastName,
      email: copy.form.email,
      phone: copy.form.phone,
      city: copy.form.city,
      address: copy.form.address,
      deliveryLocation: copy.form.deliveryLocation,
      selectLocation: copy.form.selectLocation,
      phonePlaceholder: copy.placeholders.phone,
      cityPlaceholder: copy.placeholders.city,
      addressPlaceholder: copy.placeholders.address,
      storePickup: copy.shipping.storePickup,
      storePickupDescription: copy.shipping.storePickupDescription,
      delivery: copy.shipping.delivery,
      deliveryDescription: copy.shipping.deliveryDescription,
      freePickup: copy.shipping.freePickup,
      enterCity: copy.shipping.enterCity,
      selectDeliveryLocation: copy.shipping.selectDeliveryLocation,
      cashOnDelivery: copy.payment.cashOnDelivery,
      cashOnDeliveryDescription: copy.payment.cashOnDeliveryDescription,
      idram: copy.payment.idram,
      idramDescription: copy.payment.idramDescription,
      arca: copy.payment.arca,
      arcaDescription: copy.payment.arcaDescription,
      changeTitle: copy.payment.changeTitle,
      changeHint: copy.payment.changeHint,
      changeNone: copy.payment.changeNone,
      changeRequired: copy.payment.changeRequired,
      couponTitle: copy.coupon.title,
      couponPlaceholder: copy.coupon.placeholder,
      couponApply: copy.coupon.apply,
      couponApplying: copy.coupon.applying,
      discount: copy.summary.discount,
      subtotal: copy.summary.subtotal,
      shipping: copy.summary.shipping,
      tax: copy.summary.tax,
      total: copy.summary.total,
      placeOrder: copy.buttons.placeOrder,
      processing: copy.buttons.processing,
      continueShopping: copy.buttons.continueShopping,
      cartEmpty: copy.errors.cartEmpty,
    },
  } as const;

  const mobileChrome = {
    locale: rawLocale,
    currency,
    brand: dictionary.brand,
    callLabel: dictionary.home.call,
    phoneHref: firstPhoneHref(dictionary.footer.phones),
    currencyLabel: dictionary.header.currency,
    languageLabel: dictionary.header.language,
    searchLabel: dictionary.header.search,
    searchPlaceholder: dictionary.header.search,
  };

  return (
    <div
      data-checkout-page
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white"
    >
      <StorefrontMobileChrome
        {...mobileChrome}
        sheetClassName="bg-[linear-gradient(180deg,#fff8f2_0%,#ffffff_38%,#ffffff_100%)]"
      >
        <CheckoutForm {...formProps} />
      </StorefrontMobileChrome>

      <div className="hidden bg-[linear-gradient(180deg,#fff8f2_0%,#ffffff_38%,#ffffff_100%)] lg:block">
        <div className="mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
          <CheckoutForm {...formProps} />
        </div>
      </div>
    </div>
  );
}
