'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@shop/ui';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { useTranslation } from '../../../../lib/i18n-client';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';

type CouponDiscountType = 'percent' | 'fixed';
const MAX_USES_PER_USER_OPTIONS = ['', '1', '2', '3', '5', '10', '20', '50', '100'] as const;

interface CouponFormState {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: string;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
  minOrderAmount: string;
  maxUsesPerUser: string;
}

const EMPTY_FORM: CouponFormState = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  isActive: true,
  startsAt: '',
  expiresAt: '',
  minOrderAmount: '',
  maxUsesPerUser: '',
};

function toIsoOrNull(value: string): string | null {
  if (!value.trim()) {
    return null;
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  return parsedDate.toISOString();
}

export default function CreatePromocodePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/supersudo');
    }
  }, [isLoading, isLoggedIn, isAdmin, router]);

  const handleSubmit = async () => {
    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      alert(t('admin.promocode.invalidDiscount'));
      return;
    }

    const minOrderAmount = form.minOrderAmount.trim()
      ? Number(form.minOrderAmount)
      : null;
    if (
      minOrderAmount !== null &&
      (!Number.isFinite(minOrderAmount) || minOrderAmount < 0)
    ) {
      alert(t('admin.promocode.invalidMinOrder'));
      return;
    }

    const maxUsesPerUser = form.maxUsesPerUser.trim()
      ? Number(form.maxUsesPerUser)
      : null;
    if (
      maxUsesPerUser !== null &&
      (!Number.isFinite(maxUsesPerUser) ||
        maxUsesPerUser < 1 ||
        !Number.isInteger(maxUsesPerUser))
    ) {
      alert(t('admin.promocode.invalidMaxUsesPerUser'));
      return;
    }

    const code = form.code.trim().toUpperCase();
    if (!code) {
      alert(t('admin.promocode.codeRequired'));
      return;
    }

    const payload = {
      code,
      description: form.description.trim() || null,
      discountType: form.discountType,
      discountValue,
      isActive: form.isActive,
      startsAt: toIsoOrNull(form.startsAt),
      expiresAt: toIsoOrNull(form.expiresAt),
      minOrderAmount,
      maxUsesPerUser,
    };

    try {
      setSaving(true);
      await apiClient.post('/api/v1/admin/coupons', payload);
      alert(t('admin.promocode.createSuccess'));
      router.push('/supersudo/promocode');
    } catch (error: unknown) {
      logger.error('Failed to create coupon', { error, payload });
      alert(t('admin.promocode.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
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
    <div className="mx-auto w-full max-w-5xl">
      <Card className="rounded-xl border border-[#f2d8c6] bg-gradient-to-br from-[#fff8f2] via-white to-[#eef8f1] p-6 shadow-[0_8px_24px_rgba(245,104,20,0.08)]">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          {t('admin.promocode.newTitle')}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin.promocode.code')}
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
              }
              className="w-full rounded-md border border-[#ebd3c1] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f7bc95]"
              placeholder={t('admin.promocode.codePlaceholder')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin.promocode.discountType')}
            </label>
            <select
              value={form.discountType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  discountType: event.target.value as CouponDiscountType,
                }))
              }
              className="w-full rounded-md border border-[#ebd3c1] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f7bc95]"
            >
              <option value="percent">{t('admin.promocode.percent')}</option>
              <option value="fixed">{t('admin.promocode.fixed')}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin.promocode.discountValue')}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discountValue}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, discountValue: event.target.value }))
              }
              className="w-full rounded-md border border-[#ebd3c1] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f7bc95]"
              placeholder={t('admin.promocode.discountPlaceholder')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin.promocode.minOrderAmount')}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderAmount}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))
              }
              className="w-full rounded-md border border-[#ebd3c1] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f7bc95]"
              placeholder={t('admin.promocode.minOrderPlaceholder')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin.promocode.maxUsesPerUser')}
            </label>
            <select
              value={form.maxUsesPerUser}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  maxUsesPerUser: event.target.value,
                }))
              }
              className="w-full rounded-md border border-[#ebd3c1] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f7bc95]"
            >
              {MAX_USES_PER_USER_OPTIONS.map((optionValue) => (
                <option key={optionValue || 'unlimited'} value={optionValue}>
                  {optionValue
                    ? `${optionValue} ${t('admin.promocode.timesSuffix')}`
                    : t('admin.promocode.unlimited')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin.promocode.startsAt')}
            </label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, startsAt: event.target.value }))
              }
              className="w-full rounded-md border border-[#ebd3c1] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f7bc95]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin.promocode.expiresAt')}
            </label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, expiresAt: event.target.value }))
              }
              className="w-full rounded-md border border-[#ebd3c1] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f7bc95]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin.promocode.description')}
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="w-full rounded-md border border-[#ebd3c1] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f7bc95]"
              placeholder={t('admin.promocode.descriptionPlaceholder')}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            {t('admin.promocode.active')}
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-gradient-to-r from-[#f66812] to-[#2f7d4a] hover:from-[#e85d0b] hover:to-[#25653c]"
          >
            {saving ? t('admin.promocode.saving') : t('admin.promocode.create')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/supersudo/promocode')}
            disabled={saving}
          >
            {t('admin.common.cancel')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
