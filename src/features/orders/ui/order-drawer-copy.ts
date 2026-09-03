import type { Locale } from "@/lib/i18n/config";

export type OrderDrawerCopy = {
  order: string;
  orderedOn: string;
  orderStatus: string;
  orderProducts: string;
  orderSummary: string;
  subtotal: string;
  delivery: string;
  bag: string;
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
  comment: string;
  quantity: string;
  reorderCta: string;
  reordering: string;
  reorderPartial: string;
  reorderUnavailable: string;
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
    bag: "Տոպրակի գումար",
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
    comment: "Մեկնաբանություն",
    quantity: "Քանակ",
    reorderCta: "Կրկին պատվիրել",
    reordering: "Ավելացվում է…",
    reorderPartial: "Պատվերի հասանելի ապրանքները ավելացվել են զամբյուղում։",
    reorderUnavailable: "Այս ապրանքները սպառվել են կամ հասանելի չեն.",
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
    bag: "Bag fee",
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
    comment: "Comment",
    quantity: "Qty",
    reorderCta: "Reorder",
    reordering: "Adding…",
    reorderPartial: "Available items were added to your cart.",
    reorderUnavailable: "These products are out of stock or unavailable:",
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
    bag: "Сумма пакета",
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
    comment: "Комментарий",
    quantity: "Кол-во",
    reorderCta: "Заказать снова",
    reordering: "Добавляем…",
    reorderPartial: "Доступные товары добавлены в корзину.",
    reorderUnavailable: "Эти товары закончились или недоступны:",
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
