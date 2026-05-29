'use client';

import { Card, Button } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import { formatCurrency } from '../utils/dashboardUtils';

interface TopProduct {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  image?: string | null;
}

interface TopProductsCardProps {
  topProducts: TopProduct[];
  topProductsLoading: boolean;
}

export function TopProductsCard({ topProducts, topProductsLoading }: TopProductsCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card className="rounded-2xl border border-[#e3e8e3] bg-[#f9fcf9] p-5 shadow-[0_8px_24px_rgba(24,46,34,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-[#1b3a2b]">
          <span className="text-[#2b8d64]">❦</span>
          {t('admin.dashboard.topSellingProducts')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#2c5743] transition-colors hover:bg-[#e9f3ec] hover:text-[#173a2a]"
          onClick={() => router.push('/supersudo/products')}
        >
          {t('admin.dashboard.viewAll')}
        </Button>
      </div>
      <div className="space-y-4">
        {topProductsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 rounded-xl bg-[#e1e7e2]" />
              </div>
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-600">
            <p>{t('admin.dashboard.noSalesData')}</p>
          </div>
        ) : (
          topProducts.map((product, index) => (
            <div
              key={product.variantId}
              className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#e1e6e1] bg-white p-4 transition-colors hover:border-[#cadacb] hover:bg-[#fefefe]"
              onClick={() => router.push(`/supersudo/products/${product.productId}`)}
            >
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5e5c5] text-sm font-bold text-[#9a6c1d]">
                  {index + 1}
                </div>
              </div>
              {product.image && (
                <div className="flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-[#1f2c24]">{product.title}</p>
                <p className="text-xs text-[#53685b]">SKU: {product.sku}</p>
                <p className="mt-1 text-xs text-[#72857a]">
                  {t('admin.dashboard.sold').replace('{count}', product.totalQuantity.toString())} • {t('admin.dashboard.orders').replace('{count}', product.orderCount.toString())}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#2a6548]">
                  {formatCurrency(product.totalRevenue, 'USD')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

