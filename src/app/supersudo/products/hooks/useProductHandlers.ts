import { useState } from 'react';
import type { FormEvent } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { useTranslation } from '../../../../lib/i18n-client';
import type { Product, ProductsResponse } from '../types';
import type { DailyOfferSelection } from '@/lib/services/daily-offer/daily-offer.types';
import { logger } from "@/lib/utils/logger";
import { useAdminDialogs } from '../../context/AdminDialogsContext';
import { invalidateAdminReadCache } from '@/lib/admin/admin-read-cache';
import { notifyStorefrontCatalogUpdated } from '@/lib/storefront/storefront-catalog-events';

interface UseProductHandlersProps {
  products: Product[];
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  fetchProducts: (options?: { force?: boolean; silent?: boolean }) => Promise<void>;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setPage: (page: number | ((prev: number) => number)) => void;
  setBulkDeleting: (deleting: boolean) => void;
  setTogglingAllFeatured: (toggling: boolean) => void;
  setDailyOfferSelection: (
    selection: DailyOfferSelection | ((prev: DailyOfferSelection) => DailyOfferSelection)
  ) => void;
  setMeta: (
    meta: ProductsResponse['meta'] | null | ((prev: ProductsResponse['meta'] | null) => ProductsResponse['meta'] | null)
  ) => void;
}

export function useProductHandlers({
  products,
  setProducts,
  fetchProducts,
  selectedIds,
  setSelectedIds,
  setPage,
  setBulkDeleting,
  setTogglingAllFeatured,
  setDailyOfferSelection,
  setMeta,
}: UseProductHandlersProps) {
  const { t } = useTranslation();
  const { confirm: confirmDialog } = useAdminDialogs();
  const [duplicatingProductId, setDuplicatingProductId] = useState<string | null>(null);
  const [togglingDailyOfferProductId, setTogglingDailyOfferProductId] = useState<string | null>(null);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (products.length === 0) return;
    setSelectedIds(prev => {
      const allIds = products.map(p => p.id);
      const hasAll = allIds.every(id => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const removeProductsFromList = (productIds: readonly string[]) => {
    const idsToRemove = new Set(productIds);
    setProducts((prev) => prev.filter((product) => !idsToRemove.has(product.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      productIds.forEach((id) => next.delete(id));
      return next;
    });
    setMeta((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        total: Math.max(0, prev.total - productIds.length),
      };
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const isConfirmed = await confirmDialog({
      title: t('admin.common.delete'),
      message: t('admin.products.bulkDeleteConfirm').replace('{count}', selectedIds.size.toString()),
      confirmText: t('admin.common.delete'),
      destructive: true,
    });
    if (!isConfirmed) return;

    const ids = Array.from(selectedIds);
    setBulkDeleting(true);
    removeProductsFromList(ids);

    try {
      const results = await Promise.allSettled(
        ids.map(id => apiClient.delete(`/api/v1/admin/products/${id}`))
      );
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        invalidateAdminReadCache('/api/v1/admin/products');
        await fetchProducts({ force: true });
        alert(t('admin.products.bulkDeleteFinished').replace('{success}', (ids.length - failed.length).toString()).replace('{total}', ids.length.toString()));
        return;
      }

      invalidateAdminReadCache('/api/v1/admin/products');
      notifyStorefrontCatalogUpdated();
      await fetchProducts({ force: true, silent: true });
      alert(t('admin.products.bulkDeleteFinished').replace('{success}', ids.length.toString()).replace('{total}', ids.length.toString()));
    } catch (err) {
      console.error('❌ [ADMIN] Bulk delete products error:', err);
      invalidateAdminReadCache('/api/v1/admin/products');
      await fetchProducts({ force: true });
      alert(t('admin.products.failedToDelete'));
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDuplicateProduct = async (productId: string) => {
    if (duplicatingProductId) {
      return;
    }
    setDuplicatingProductId(productId);
    try {
      await apiClient.post<{ id: string }>(
        `/api/v1/admin/products/${productId}/duplicate`,
        {}
      );
      await fetchProducts();
      alert(t('admin.products.duplicateSuccess'));
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error duplicating product:', err);
      const message =
        err instanceof Error ? err.message : t('admin.common.unknownErrorFallback');
      alert(t('admin.products.duplicateError').replace('{message}', message));
    } finally {
      setDuplicatingProductId(null);
    }
  };

  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    const isConfirmed = await confirmDialog({
      title: t('admin.common.delete'),
      message: t('admin.products.deleteConfirm').replace('{title}', productTitle),
      confirmText: t('admin.common.delete'),
      destructive: true,
    });
    if (!isConfirmed) {
      return;
    }

    removeProductsFromList([productId]);

    try {
      await apiClient.delete(`/api/v1/admin/products/${productId}`);
      logger.debug('✅ [ADMIN] Product deleted successfully');

      invalidateAdminReadCache('/api/v1/admin/products');
      notifyStorefrontCatalogUpdated();
      await fetchProducts({ force: true, silent: true });

      alert(t('admin.products.deletedSuccess'));
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error deleting product:', err);
      invalidateAdminReadCache('/api/v1/admin/products');
      await fetchProducts({ force: true });
      const message =
        err instanceof Error ? err.message : t('admin.common.unknownErrorFallback');
      alert(t('admin.products.errorDeleting').replace('{message}', message));
    }
  };

  const handleTogglePublished = async (productId: string, currentStatus: boolean, productTitle: string) => {
    try {
      const newStatus = !currentStatus;
      
      // При изменении только статуса published, отправляем только статус
      // Это позволяет избежать проблем с валидацией вариантов (например, требование размеров)
      // Варианты и другие данные останутся без изменений на сервере
      const updateData = {
        published: newStatus,
      };
      
      logger.debug(`🔄 [ADMIN] Updating product status to ${newStatus ? 'published' : 'draft'}`);
      
      await apiClient.put(`/api/v1/admin/products/${productId}`, updateData);
      
      logger.debug(`✅ [ADMIN] Product ${newStatus ? 'published' : 'unpublished'} successfully`);
      
      // Refresh products list
      fetchProducts();
      
      if (newStatus) {
        alert(t('admin.products.productPublished').replace('{title}', productTitle));
      } else {
        alert(t('admin.products.productDraft').replace('{title}', productTitle));
      }
    } catch (err: any) {
      console.error('❌ [ADMIN] Error updating product status:', err);
      alert(t('admin.products.errorUpdatingStatus').replace('{message}', err.message || t('admin.common.unknownErrorFallback')));
    }
  };

  const handleToggleFeatured = async (productId: string, currentStatus: boolean, productTitle: string) => {
    try {
      const newStatus = !currentStatus;
      
      const updateData = {
        featured: newStatus,
      };
      
      logger.debug(`⭐ [ADMIN] Updating product featured status to ${newStatus ? 'featured' : 'not featured'}`);
      
      await apiClient.put(`/api/v1/admin/products/${productId}`, updateData);
      
      logger.debug(`✅ [ADMIN] Product ${newStatus ? 'marked as featured' : 'removed from featured'} successfully`);
      
      // Refresh products list
      fetchProducts();
    } catch (err: any) {
      console.error('❌ [ADMIN] Error updating product featured status:', err);
      alert(t('admin.products.errorUpdatingFeatured').replace('{message}', err.message || t('admin.common.unknownErrorFallback')));
    }
  };

  const handleToggleAllFeatured = async () => {
    if (products.length === 0) return;

    // Check if all products are featured
    const allFeatured = products.every(p => p.featured);
    const newStatus = !allFeatured;

    setTogglingAllFeatured(true);
    try {
      const results = await Promise.allSettled(
        products.map(product => 
          apiClient.put(`/api/v1/admin/products/${product.id}`, { featured: newStatus })
        )
      );
      
      const failed = results.filter(r => r.status === 'rejected');
      const successCount = products.length - failed.length;
      
      logger.debug(`✅ [ADMIN] Toggle all featured completed: ${successCount}/${products.length} successful`);
      
      // Refresh products list
      await fetchProducts();
      
      if (failed.length > 0) {
        alert(t('admin.products.featuredToggleFinished').replace('{success}', successCount.toString()).replace('{total}', products.length.toString()));
      }
    } catch (err) {
      console.error('❌ [ADMIN] Toggle all featured error:', err);
      alert(t('admin.products.failedToUpdateFeatured'));
    } finally {
      setTogglingAllFeatured(false);
    }
  };

  const handleToggleDailyOffer = async (productId: string) => {
    if (togglingDailyOfferProductId) {
      return;
    }

    setTogglingDailyOfferProductId(productId);
    try {
      const selection = await apiClient.put<DailyOfferSelection>('/api/v1/admin/daily-offers', {
        productId,
      });
      setDailyOfferSelection(selection);
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error toggling daily offer:', err);
      const message =
        err instanceof Error ? err.message : t('admin.common.unknownErrorFallback');
      alert(t('admin.products.dailyOffer.errorUpdating').replace('{message}', message));
    } finally {
      setTogglingDailyOfferProductId(null);
    }
  };

  return {
    handleSearch,
    toggleSelect,
    toggleSelectAll,
    handleBulkDelete,
    handleDuplicateProduct,
    duplicatingProductId,
    handleDeleteProduct,
    handleTogglePublished,
    handleToggleFeatured,
    handleToggleAllFeatured,
    handleToggleDailyOffer,
    togglingDailyOfferProductId,
  };
}






