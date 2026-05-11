'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { useAnalytics } from './hooks/useAnalytics';
import { AnalyticsHeader } from './components/AnalyticsHeader';
import { PeriodSelector } from './components/PeriodSelector';
import { StatsCards } from './components/StatsCards';
import { TopProducts } from './components/TopProducts';
import { TopCategories } from './components/TopCategories';
import { OrdersByDayChart } from './components/OrdersByDayChart';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<string>('week');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { analytics, totalUsers, loading } = useAnalytics({
    period,
    startDate,
    endDate,
    isLoggedIn: isLoggedIn ?? false,
    isAdmin: isAdmin ?? false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

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
    <>
      <AnalyticsHeader />

      <PeriodSelector
        period={period}
        startDate={startDate}
        endDate={endDate}
        analytics={analytics}
        onPeriodChange={setPeriod}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-gray-600">{t('admin.analytics.loadingAnalytics')}</p>
        </div>
      ) : analytics ? (
        <>
          <StatsCards analytics={analytics} totalUsers={totalUsers} />

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopProducts products={analytics.topProducts} />
            <TopCategories categories={analytics.topCategories} />
          </div>

          <OrdersByDayChart ordersByDay={analytics.ordersByDay} />
        </>
      ) : (
        <Card className="p-6">
          <p className="text-center text-gray-600">{t('admin.analytics.noAnalyticsData')}</p>
        </Card>
      )}
    </>
  );
}
