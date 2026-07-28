/** Status pill classes — Degusto warm palette. */
export function orderStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "PENDING" || normalized === "CONFIRMED") {
    return "bg-[#f7d18f]/45 text-[#8a5a12]";
  }
  if (normalized === "PROCESSING" || normalized === "SHIPPED") {
    return "bg-[#ff7f20]/15 text-[#c45a0a]";
  }
  if (normalized === "DELIVERED") {
    return "bg-[#3e573d]/15 text-[#3e573d]";
  }
  if (normalized === "CANCELLED" || normalized === "REFUNDED") {
    return "bg-red-100 text-red-800";
  }
  return "bg-[#e8e2d9] text-[#5c564e]";
}

export function paymentStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "PAID" || normalized === "CAPTURED") {
    return "bg-[#3e573d]/15 text-[#3e573d]";
  }
  if (normalized === "PENDING" || normalized === "AUTHORIZED") {
    return "bg-[#f7d18f]/45 text-[#8a5a12]";
  }
  if (
    normalized === "FAILED" ||
    normalized === "CANCELLED" ||
    normalized === "REFUNDED"
  ) {
    return "bg-red-100 text-red-800";
  }
  return "bg-[#e8e2d9] text-[#5c564e]";
}

export const ADMIN_BADGE =
  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium";
