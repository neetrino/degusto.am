export const MAX_COUPON_ALLOWED_USERS = 50;

export type CouponUserPickerOption = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

export function formatCouponUserLabel(user: CouponUserPickerOption): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (name) {
    return `${name} (${user.email})`;
  }
  return user.email;
}
