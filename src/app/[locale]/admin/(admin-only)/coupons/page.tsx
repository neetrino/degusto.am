import Link from "next/link";
import { notFound } from "next/navigation";

import { ADMIN_LINK } from "@/features/admin/ui/admin-form-classes";
import { getAdminCopy } from "@/features/admin/ui/admin-copy";
import { listAdminPromotions } from "@/features/promotions/application/queries";
import { adminPromotionsFilterSchema } from "@/features/promotions/schemas/admin-promotions";
import { AdminCouponsView } from "@/features/promotions/ui/AdminCouponsView";
import { isLocale } from "@/lib/i18n/config";

type AdminCouponsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AdminCouponsPage({
  params,
  searchParams,
}: AdminCouponsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const copy = getAdminCopy(locale);

  const raw = await searchParams;
  const parsed = adminPromotionsFilterSchema.safeParse({
    kind: "COUPON",
    q: firstParam(raw.q) || undefined,
    active: firstParam(raw.active) || undefined,
    page: firstParam(raw.page) ?? "1",
  });

  const filters = parsed.success
    ? parsed.data
    : {
        kind: "COUPON" as const,
        page: 1 as const,
        q: undefined,
        active: undefined,
      };

  const { rows, total, pageSize } = await listAdminPromotions(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <AdminCouponsView locale={locale} coupons={rows} />
      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center gap-3 text-sm text-[#5c564e]">
          {filters.page > 1 ? (
            <Link
              href={`/${locale}/admin/coupons?page=${filters.page - 1}`}
              className={ADMIN_LINK}
            >
              {copy.pages.pagination.previous}
            </Link>
          ) : null}
          <span>
            {copy.pages.pagination.page} {filters.page} {copy.pages.pagination.of}{" "}
            {totalPages}
          </span>
          {filters.page < totalPages ? (
            <Link
              href={`/${locale}/admin/coupons?page=${filters.page + 1}`}
              className={ADMIN_LINK}
            >
              {copy.pages.pagination.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
