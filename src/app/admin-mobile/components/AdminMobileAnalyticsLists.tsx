'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { formatCurrency, formatDateShort } from '../../supersudo/analytics/utils';
import type { AnalyticsData } from '../../supersudo/analytics/types';
import { ADMIN_MOBILE_CARD_CLASS } from './admin-mobile-ui';

type AdminMobileAnalyticsListsProps = {
  analytics: AnalyticsData;
};

function SectionTitle({ title }: { title: string }) {
  return <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>;
}

export function AdminMobileAnalyticsLists({ analytics }: AdminMobileAnalyticsListsProps) {
  const { t } = useTranslation();
  const maxDayCount = Math.max(...analytics.ordersByDay.map((day) => day.count), 1);

  return (
    <div className="space-y-4">
      <section className={ADMIN_MOBILE_CARD_CLASS}>
        <SectionTitle title={t('admin.analytics.topSellingProducts')} />
        {analytics.topProducts.length === 0 ? (
          <p className="text-sm text-gray-500">{t('admin.analytics.noSalesDataAvailable')}</p>
        ) : (
          <ul className="space-y-3">
            {analytics.topProducts.map((product, index) => (
              <li key={product.variantId} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
                  {index + 1}
                </span>
                {product.image ? (
                  <img src={product.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{product.title}</p>
                  <p className="text-xs text-gray-500">
                    {t('admin.analytics.sold').replace('{count}', String(product.totalQuantity))}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-gray-900">{formatCurrency(product.totalRevenue)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={ADMIN_MOBILE_CARD_CLASS}>
        <SectionTitle title={t('admin.analytics.topCategories')} />
        {analytics.topCategories.length === 0 ? (
          <p className="text-sm text-gray-500">{t('admin.analytics.noCategoryDataAvailable')}</p>
        ) : (
          <ul className="space-y-3">
            {analytics.topCategories.map((category, index) => (
              <li
                key={category.categoryId}
                className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-xs font-bold text-purple-800">
                    {index + 1}
                  </span>
                  <p className="truncate text-sm font-medium text-gray-900">{category.categoryName}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-gray-900">{formatCurrency(category.totalRevenue)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={ADMIN_MOBILE_CARD_CLASS}>
        <SectionTitle title={t('admin.analytics.ordersByDay')} />
        {analytics.ordersByDay.length === 0 ? (
          <p className="text-sm text-gray-500">{t('admin.analytics.noDataAvailable')}</p>
        ) : (
          <ul className="space-y-3">
            {analytics.ordersByDay.map((day) => {
              const widthPercent = Math.max((day.count / maxDayCount) * 100, 8);
              return (
                <li key={day._id}>
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                    <span>{formatDateShort(day._id)}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(day.revenue)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#f66812] to-[#ff9f5a]"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('admin.analytics.ordersLabel').replace('{count}', String(day.count))}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
