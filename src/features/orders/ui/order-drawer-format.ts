import { isCurrency, currencySymbols } from "@/lib/money/currency";

/** Formats admin money as "2,334 ֏" style for the order drawer. */
export function formatOrderDrawerMoney(
  amount: number,
  currency: string,
): string {
  const symbol = isCurrency(currency) ? currencySymbols[currency] : currency;
  return `${amount.toLocaleString("en-US")} ${symbol}`;
}

/** Title-cases status tokens like PENDING → Pending. */
export function formatOrderStatusLabel(status: string): string {
  if (!status) return status;
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/** Formats order placed date for the drawer header. */
export function formatOrderPlacedDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  if (locale === "hy") {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  return date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
