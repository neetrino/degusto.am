import { Card } from "@shop/ui";
import type { CouponHistoryItem, UserCoupon } from "./types";

interface ProfileCouponsProps {
  couponsLoading: boolean;
  availableCoupons: UserCoupon[];
  couponHistory: CouponHistoryItem[];
  t: (key: string) => string;
}

export function ProfileCoupons({
  couponsLoading,
  availableCoupons,
  couponHistory,
  t,
}: ProfileCouponsProps) {
  if (couponsLoading) {
    return (
      <Card className="rounded-2xl border border-gray-200/80 p-5 shadow-none sm:p-7 lg:p-8">
        <h2 className="mb-6 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
          {t("profile.coupons.title")}
        </h2>
        <p className="text-sm text-gray-600">{t("profile.coupons.loading")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="rounded-2xl border border-gray-200/80 p-5 shadow-none sm:p-7 lg:p-8">
        <h2 className="mb-6 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
          {t("profile.coupons.availableTitle")}
        </h2>
        {availableCoupons.length === 0 ? (
          <p className="text-sm text-gray-600">{t("profile.coupons.noAvailable")}</p>
        ) : (
          <ul className="space-y-3">
            {availableCoupons.map((coupon) => (
              <li key={coupon.code} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{coupon.code}</p>
                    {coupon.description ? (
                      <p className="text-sm text-gray-600">{coupon.description}</p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      coupon.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {coupon.isActive
                      ? t("profile.coupons.active")
                      : t("profile.coupons.inactive")}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-700">
                  {coupon.discountType === "fixed"
                    ? `${coupon.discountValue} AMD`
                    : `${coupon.discountValue}%`}{" "}
                  {t("profile.coupons.discount")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="rounded-2xl border border-gray-200/80 p-5 shadow-none sm:p-7 lg:p-8">
        <h2 className="mb-6 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
          {t("profile.coupons.historyTitle")}
        </h2>
        {couponHistory.length === 0 ? (
          <p className="text-sm text-gray-600">{t("profile.coupons.noHistory")}</p>
        ) : (
          <ul className="space-y-3">
            {couponHistory.map((item) => (
              <li
                key={`${item.orderNumber}-${item.usedAt}`}
                className="rounded-xl border border-gray-200 p-4"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {t("profile.coupons.order")} #{item.orderNumber}
                </p>
                <p className="text-sm text-gray-600">
                  {t("profile.coupons.discountUsed")}: {item.discountAmount} AMD
                </p>
                {item.code ? (
                  <p className="text-sm text-gray-600">
                    {t("profile.coupons.code")}: {item.code}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
