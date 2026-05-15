'use client';

import { useMemo } from 'react';
import { Card, Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { logger } from "@/lib/utils/logger";

interface Product {
  id: string;
  title: string;
  image?: string;
  price?: number;
  discountPercent?: number;
}

interface ProductDiscountsCardProps {
  products: Product[];
  productsLoading: boolean;
  productsPage: number;
  productsTotalPages: number;
  productsTotal: number;
  productsSearch: string;
  onProductsSearchChange: (value: string) => void;
  onProductsPageChange: (page: number) => void;
  productDiscounts: Record<string, number>;
  setProductDiscounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleProductDiscountSave: (productId: string) => void;
  savingProductId: string | null;
}

export function ProductDiscountsCard({
  products,
  productsLoading,
  productsPage,
  productsTotalPages,
  productsTotal,
  productsSearch,
  onProductsSearchChange,
  onProductsPageChange,
  productDiscounts,
  setProductDiscounts,
  handleProductDiscountSave,
  savingProductId,
}: ProductDiscountsCardProps) {
  const { t } = useTranslation();
  const PAGE_CHUNK_SIZE = 3;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const paginationWindow = useMemo(() => {
    if (productsTotalPages <= 10) {
      return {
        start: 1,
        end: productsTotalPages,
      };
    }

    const chunkIndex = Math.floor((productsPage - 1) / PAGE_CHUNK_SIZE);
    const start = chunkIndex * PAGE_CHUNK_SIZE + 1;
    const end = Math.min(productsTotalPages, start + PAGE_CHUNK_SIZE - 1);

    return { start, end };
  }, [productsPage, productsTotalPages]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    for (let page = paginationWindow.start; page <= paginationWindow.end; page++) {
      pages.push(page);
    }
    return pages;
  }, [paginationWindow]);

  const goToPage = (page: number) => {
    const nextPage = Math.min(productsTotalPages, Math.max(1, page));
    onProductsPageChange(nextPage);
  };

  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('admin.quickSettings.productDiscounts')}</h2>
        <p className="text-sm text-gray-600">{t('admin.quickSettings.productDiscountsSubtitle')}</p>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          value={productsSearch}
          onChange={(e) => onProductsSearchChange(e.target.value)}
          placeholder={t('admin.products.searchPlaceholder')}
          className="max-w-md"
        />
      </div>

      {productsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.quickSettings.loadingProducts')}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('admin.quickSettings.noProducts')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const currentDiscount = Number(productDiscounts[product.id] ?? product.discountPercent ?? 0);
            const originalPrice = product.price || 0;
            const discountedPrice = currentDiscount > 0 && originalPrice > 0
              ? Math.round(originalPrice * (1 - currentDiscount / 100))
              : originalPrice;

            return (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors bg-blue-50/30"
              >
                {product.image && (
                  <div className="flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{product.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {currentDiscount > 0 && originalPrice > 0 ? (
                      <>
                        <span className="text-xs font-semibold text-blue-600 select-none">
                          {formatPrice(discountedPrice)}
                        </span>
                        <span className="text-xs text-gray-400 line-through select-none">
                          {formatPrice(originalPrice)}
                        </span>
                        <span className="text-xs text-red-600 font-medium">
                          -{currentDiscount}%
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 select-none">
                        {originalPrice > 0 ? formatPrice(originalPrice) : 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={productDiscounts[product.id] ?? product.discountPercent ?? 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      const discountValue = value === '' ? 0 : parseFloat(value) || 0;
                      logger.debug(`🔄 [QUICK SETTINGS] Updating discount for product ${product.id}: ${discountValue}%`);
                      setProductDiscounts((prev) => {
                        const updated = {
                          ...prev,
                          [product.id]: discountValue,
                        };
                        logger.debug(`✅ [QUICK SETTINGS] Updated productDiscounts:`, updated);
                        return updated;
                      });
                    }}
                    className="w-20"
                    placeholder="0"
                  />
                  <span className="text-sm font-medium text-gray-700 w-6">%</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleProductDiscountSave(product.id)}
                    disabled={savingProductId === product.id}
                    className="px-4"
                  >
                    {savingProductId === product.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      t('admin.quickSettings.save')
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-600">
              {t('admin.products.showingPage')
                .replace('{page}', String(productsPage))
                .replace('{totalPages}', String(productsTotalPages))
                .replace('{total}', String(productsTotal))}
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {productsTotalPages > 10 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => goToPage(paginationWindow.start - PAGE_CHUNK_SIZE)}
                  disabled={paginationWindow.start <= 1 || productsLoading}
                >
                  -{PAGE_CHUNK_SIZE}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToPage(productsPage - 1)}
                disabled={productsPage <= 1 || productsLoading}
              >
                {t('admin.products.previous')}
              </Button>
              {visiblePages.map((page) => (
                <Button
                  key={page}
                  variant={productsPage === page ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => goToPage(page)}
                  disabled={productsLoading}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToPage(productsPage + 1)}
                disabled={productsPage >= productsTotalPages || productsLoading}
              >
                {t('admin.products.next')}
              </Button>
              {productsTotalPages > 10 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => goToPage(paginationWindow.end + 1)}
                  disabled={paginationWindow.end >= productsTotalPages || productsLoading}
                >
                  +{PAGE_CHUNK_SIZE}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

