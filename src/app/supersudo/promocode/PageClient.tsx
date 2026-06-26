'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@shop/ui';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useTranslation } from '../../../lib/i18n-client';
import { apiClient } from '../../../lib/api-client';
import { logger } from '../../../lib/utils/logger';
import { adminGet } from '@/lib/admin/admin-read-cache';
import { useAdminDialogs } from '../context/AdminDialogsContext';
import { PromocodeCodeWithCopy } from './PromocodeCodeWithCopy';

interface CouponItem {
  code: string;
  description: string | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  minOrderAmount: number | null;
  maxUsesPerUser: number | null;
}

interface CouponsResponse {
  data: CouponItem[];
}

export default function PromocodePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { confirm: confirmDialog } = useAdminDialogs();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();

  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  const sortedCoupons = useMemo(
    () => [...coupons].sort((a, b) => a.code.localeCompare(b.code)),
    [coupons]
  );

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminGet<CouponsResponse>('/api/v1/admin/coupons');
      setCoupons(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      logger.error('Failed to fetch coupons', { error });
      setCoupons([]);
      alert(t('admin.promocode.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/supersudo');
    }
  }, [isLoading, isLoggedIn, isAdmin, router]);

  useEffect(() => {
    if (!isLoading && isLoggedIn && isAdmin) {
      void fetchCoupons();
    }
  }, [isLoading, isLoggedIn, isAdmin, fetchCoupons]);

  const handleDelete = async (code: string) => {
    const isConfirmed = await confirmDialog({
      title: t('admin.common.delete'),
      message: t('admin.promocode.deleteConfirm').replace('{code}', code),
      confirmText: t('admin.common.delete'),
      destructive: true,
    });
    if (!isConfirmed) {
      return;
    }

    try {
      setDeletingCode(code);
      await apiClient.delete(`/api/v1/admin/coupons/${encodeURIComponent(code)}`);
      await fetchCoupons();
      alert(t('admin.promocode.deleteSuccess'));
    } catch (error: unknown) {
      logger.error('Failed to delete coupon', { error, code });
      alert(t('admin.promocode.deleteError'));
    } finally {
      setDeletingCode(null);
    }
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    try {
      setTogglingCode(coupon.code);
      await apiClient.put(`/api/v1/admin/coupons/${encodeURIComponent(coupon.code)}`, {
        isActive: !coupon.isActive,
      });
      await fetchCoupons();
    } catch (error: unknown) {
      logger.error('Failed to toggle coupon status', { error, code: coupon.code });
      alert(t('admin.promocode.saveError'));
    } finally {
      setTogglingCode(null);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Card className="rounded-xl border border-[#f2d8c6] bg-gradient-to-br from-[#fff8f2] via-white to-[#eef8f1] p-6 shadow-[0_8px_24px_rgba(245,104,20,0.08)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('admin.promocode.listTitle')}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/supersudo/promocode/analytics')}
              className="border-[#f66812]/40 text-[#f66812] hover:border-[#f66812] hover:bg-[#fff4eb]"
            >
              {t('admin.promocode.analytics')}
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/supersudo/promocode/create')}
              className="bg-gradient-to-r from-[#f66812] to-[#2f7d4a] hover:from-[#e85d0b] hover:to-[#25653c]"
            >
              {t('admin.promocode.create')}
            </Button>
          </div>
        </div>
        {sortedCoupons.length === 0 ? (
          <p className="py-8 text-center text-gray-500">{t('admin.promocode.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">{t('admin.promocode.code')}</th>
                  <th className="px-3 py-2">{t('admin.promocode.discount')}</th>
                  <th className="px-3 py-2">{t('admin.promocode.maxUsesPerUser')}</th>
                  <th className="px-3 py-2">{t('admin.promocode.period')}</th>
                  <th className="px-3 py-2">{t('admin.promocode.status')}</th>
                  <th className="px-3 py-2 text-center">{t('admin.promocode.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedCoupons.map((coupon) => (
                  <tr key={coupon.code} className="border-b border-gray-100">
                    <td className="px-3 py-3">
                      <PromocodeCodeWithCopy code={coupon.code} />
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {coupon.discountType === 'percent'
                        ? `${coupon.discountValue}%`
                        : coupon.discountValue.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {coupon.maxUsesPerUser === null
                        ? t('admin.promocode.unlimited')
                        : `${coupon.maxUsesPerUser} ${t('admin.promocode.timesSuffix')}`}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {coupon.startsAt ? new Date(coupon.startsAt).toLocaleString() : '-'} -{' '}
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {coupon.isActive
                          ? t('admin.promocode.activeStatus')
                          : t('admin.promocode.inactiveStatus')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={coupon.isActive}
                          onClick={() => handleToggleActive(coupon)}
                          disabled={
                            deletingCode === coupon.code || togglingCode === coupon.code
                          }
                          title={
                            coupon.isActive
                              ? t('admin.promocode.markInactive')
                              : t('admin.promocode.markActive')
                          }
                          aria-label={
                            coupon.isActive
                              ? t('admin.promocode.markInactive')
                              : t('admin.promocode.markActive')
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full border border-black/10 shadow-sm transition-colors ${
                            coupon.isActive ? 'bg-[#2f7d4a]' : 'bg-gray-300'
                          } ${
                            deletingCode === coupon.code || togglingCode === coupon.code
                              ? 'cursor-not-allowed opacity-60'
                              : 'cursor-pointer'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                              coupon.isActive ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            router.push(
                              `/supersudo/promocode/${encodeURIComponent(coupon.code)}/edit`
                            )
                          }
                          disabled={
                            deletingCode === coupon.code || togglingCode === coupon.code
                          }
                          className="p-0 text-gray-700 hover:text-[#f66812]"
                          title={t('admin.common.edit')}
                          aria-label={t('admin.common.edit')}
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L12 14l-4 1 1-4 7.5-7.5z"
                            />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(coupon.code)}
                          disabled={
                            deletingCode === coupon.code || togglingCode === coupon.code
                          }
                          className="p-0 text-red-600 hover:text-red-700"
                          title={t('admin.common.delete')}
                          aria-label={t('admin.common.delete')}
                        >
                          {deletingCode === coupon.code ? (
                            <span className="text-[10px]">{t('admin.promocode.saving')}</span>
                          ) : (
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
