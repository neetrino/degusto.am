'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@shop/ui';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { useTranslation } from '../../../../lib/i18n-client';
import { apiClient } from '../../../../lib/api-client';
import { formatPrice } from '../../../../lib/currency';
import { PromocodeCodeWithCopy } from '../PromocodeCodeWithCopy';

type AnalyticsPeriod = 'day' | 'week' | 'month';

interface CouponsAnalyticsResponse {
  period: AnalyticsPeriod;
  selectedCouponCode: string | null;
  summary: {
    totalUses: number;
    totalDiscount: number;
    uniqueUsers: number;
    couponsUsed: number;
  };
  timeline: Array<{ date: string; uses: number; discount: number }>;
  topCoupons: Array<{ code: string; uses: number; totalDiscount: number }>;
  coupons: Array<{
    code: string;
    uses: number;
    totalDiscount: number;
    uniqueUsers: number;
    isActive: boolean;
  }>;
}

const PERIOD_OPTIONS: AnalyticsPeriod[] = ['day', 'week', 'month'];

function formatTimelineLabel(value: string): string {
  if (!value) {
    return value;
  }
  return value.slice(5);
}

export default function PromocodeAnalyticsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<AnalyticsPeriod>('week');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CouponsAnalyticsResponse | null>(null);

  const couponsForFilter = useMemo(
    () => analytics?.coupons.map((item) => item.code) ?? [],
    [analytics?.coupons]
  );
  const timelineData = useMemo(
    () => analytics?.timeline.filter((item) => item.uses > 0) ?? [],
    [analytics?.timeline]
  );
  const topCouponData = useMemo(
    () => analytics?.topCoupons.filter((item) => item.uses > 0) ?? [],
    [analytics?.topCoupons]
  );

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/supersudo');
    }
  }, [isLoading, isLoggedIn, isAdmin, router]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (isLoading || !isLoggedIn || !isAdmin) {
        return;
      }
      try {
        setLoading(true);
        const params: Record<string, string> = { period };
        if (couponCode) {
          params.couponCode = couponCode;
        }
        const response = await apiClient.get<CouponsAnalyticsResponse>(
          '/api/v1/admin/coupons/analytics',
          { params }
        );
        setAnalytics(response);
      } catch (_error: unknown) {
        setAnalytics(null);
        alert(t('admin.promocode.analyticsLoadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period, couponCode, isLoading, isLoggedIn, isAdmin, t]);

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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('admin.promocode.analyticsTitle')}
        </h1>
        <Button
          variant="outline"
          onClick={() => router.push('/supersudo/promocode')}
          className="border-[#f66812]/40 text-[#f66812] hover:border-[#f66812] hover:bg-[#fff4eb]"
        >
          {t('admin.promocode.backToPromocodes')}
        </Button>
      </div>

      <Card className="rounded-xl border border-[#f2d8c6] bg-white p-4 shadow-[0_8px_24px_rgba(245,104,20,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((item) => (
              <Button
                key={item}
                type="button"
                variant={period === item ? 'primary' : 'outline'}
                onClick={() => setPeriod(item)}
                className={
                  period === item
                    ? 'bg-gradient-to-r from-[#f66812] to-[#2f7d4a]'
                    : 'border-[#f66812]/40 text-[#f66812]'
                }
              >
                {t(`admin.promocode.period${item[0].toUpperCase()}${item.slice(1)}`)}
              </Button>
            ))}
          </div>
          <select
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            className="h-10 rounded-md border border-[#ebd3c1] px-3 py-2 text-sm"
          >
            <option value="">{t('admin.promocode.allPromocodes')}</option>
            {couponsForFilter.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-xl border border-[#f2d8c6] p-4">
              <p className="text-sm text-gray-500">{t('admin.promocode.totalUses')}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.summary.totalUses}</p>
            </Card>
            <Card className="rounded-xl border border-[#f2d8c6] p-4">
              <p className="text-sm text-gray-500">{t('admin.promocode.totalDiscountAmount')}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatPrice(analytics.summary.totalDiscount, 'AMD')}
              </p>
            </Card>
            <Card className="rounded-xl border border-[#f2d8c6] p-4">
              <p className="text-sm text-gray-500">{t('admin.promocode.uniqueUsers')}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.summary.uniqueUsers}</p>
            </Card>
            <Card className="rounded-xl border border-[#f2d8c6] p-4">
              <p className="text-sm text-gray-500">{t('admin.promocode.couponsUsed')}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.summary.couponsUsed}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="rounded-xl border border-[#f2d8c6] bg-gradient-to-br from-white via-[#fffaf7] to-[#eef8f1] p-5 shadow-[0_8px_24px_rgba(245,104,20,0.08)]">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t('admin.promocode.timeline')}
              </h3>
              {timelineData.length === 0 ? (
                <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-[#f1d7c6] bg-white/70 text-sm text-gray-500">
                  {t('admin.promocode.analyticsNoData')}
                </div>
              ) : (
                <div className="h-72 rounded-xl bg-white/70 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3dfd0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickFormatter={formatTimelineLabel}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #f1d7c6',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="uses"
                        stroke="#f66812"
                        strokeWidth={3}
                        dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                        activeDot={{ r: 5 }}
                        name={t('admin.promocode.totalUses')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="rounded-xl border border-[#f2d8c6] bg-gradient-to-br from-white via-[#f8fcf9] to-[#fff8f2] p-5 shadow-[0_8px_24px_rgba(47,125,74,0.10)]">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t('admin.promocode.topCoupons')}
              </h3>
              {topCouponData.length === 0 ? (
                <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-[#d9eadf] bg-white/70 text-sm text-gray-500">
                  {t('admin.promocode.analyticsNoData')}
                </div>
              ) : (
                <div className="h-72 rounded-xl bg-white/70 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={topCouponData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#deece4" />
                      <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #d5e8dc',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="uses"
                        stroke="#2f7d4a"
                        strokeWidth={3}
                        dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                        activeDot={{ r: 5 }}
                        name={t('admin.promocode.totalUses')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <Card className="rounded-xl border border-[#f2d8c6] p-4">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {t('admin.promocode.perCouponStats')}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2">{t('admin.promocode.code')}</th>
                    <th className="px-3 py-2">{t('admin.promocode.status')}</th>
                    <th className="px-3 py-2">{t('admin.promocode.totalUses')}</th>
                    <th className="px-3 py-2">{t('admin.promocode.uniqueUsers')}</th>
                    <th className="px-3 py-2">{t('admin.promocode.totalDiscountAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.coupons.map((coupon) => (
                    <tr key={coupon.code} className="border-b border-gray-100">
                      <td className="px-3 py-3">
                        <PromocodeCodeWithCopy code={coupon.code} />
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
                      <td className="px-3 py-3 text-gray-700">{coupon.uses}</td>
                      <td className="px-3 py-3 text-gray-700">{coupon.uniqueUsers}</td>
                      <td className="px-3 py-3 text-gray-700">
                        {formatPrice(coupon.totalDiscount, 'AMD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-6">
          <p className="text-center text-gray-600">{t('admin.promocode.analyticsNoData')}</p>
        </Card>
      )}
    </div>
  );
}
