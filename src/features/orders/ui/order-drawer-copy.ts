import type { Locale } from "@/lib/i18n/config";

export type OrderDrawerCopy = {
  order: string;
  orderedOn: string;
  orderStatus: string;
  orderProducts: string;
  orderSummary: string;
  subtotal: string;
  delivery: string;
  total: string;
  deliveryMethod: string;
  deliveryAddress: string;
  payment: string;
  method: string;
  amount: string;
  customer: string;
  name: string;
  phone: string;
  email: string;
  quantity: string;
  loading: string;
  ariaLabel: string;
};

const COPY: Record<Locale, OrderDrawerCopy> = {
  hy: {
    order: "Պատվեր",
    orderedOn: "Պատվիրված է",
    orderStatus: "Պատվերի կարգավիճակ",
    orderProducts: "Պատվերի ապրանքներ",
    orderSummary: "Պատվերի ամփոփում",
    subtotal: "Ենթագումար",
    delivery: "Առաքում",
    total: "Ընդամենը",
    deliveryMethod: "Առաքման եղանակ",
    deliveryAddress: "Առաքման հասցե",
    payment: "Վճարում",
    method: "Եղանակ",
    amount: "Գումար",
    customer: "Հաճախորդ",
    name: "Անուն",
    phone: "Հեռախոսահամար",
    email: "Էլ. փոստ",
    quantity: "Քանակ",
    loading: "Բեռնվում է…",
    ariaLabel: "Պատվերի մանրամասներ",
  },
  en: {
    order: "Order",
    orderedOn: "Ordered on",
    orderStatus: "Order status",
    orderProducts: "Order products",
    orderSummary: "Order summary",
    subtotal: "Subtotal",
    delivery: "Delivery",
    total: "Total",
    deliveryMethod: "Delivery method",
    deliveryAddress: "Delivery address",
    payment: "Payment",
    method: "Method",
    amount: "Amount",
    customer: "Customer",
    name: "Name",
    phone: "Phone",
    email: "Email",
    quantity: "Qty",
    loading: "Loading order…",
    ariaLabel: "Order details",
  },
  ru: {
    order: "Заказ",
    orderedOn: "Оформлен",
    orderStatus: "Статус заказа",
    orderProducts: "Товары в заказе",
    orderSummary: "Итог заказа",
    subtotal: "Подытог",
    delivery: "Доставка",
    total: "Итого",
    deliveryMethod: "Способ доставки",
    deliveryAddress: "Адрес доставки",
    payment: "Оплата",
    method: "Способ",
    amount: "Сумма",
    customer: "Клиент",
    name: "Имя",
    phone: "Телефон",
    email: "Email",
    quantity: "Кол-во",
    loading: "Загрузка заказа…",
    ariaLabel: "Детали заказа",
  },
};

/** Localized labels for the admin order details sheet. */
export function getOrderDrawerCopy(locale: string): OrderDrawerCopy {
  if (locale in COPY) {
    return COPY[locale as Locale];
  }
  return COPY.en;
}
