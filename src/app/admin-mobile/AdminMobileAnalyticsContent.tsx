'use client';

import { useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import { useAnalytics } from '../supersudo/analytics/hooks/useAnalytics';
import { AdminMobilePeriodSelector } from './components/AdminMobilePeriodSelector';
import { AdminMobileStatsCards } from './components/AdminMobileStatsCards';
import { AdminMobileAnalyticsLists } from './components/AdminMobileAnalyticsLists';
import { ADMIN_MOBILE_CARD_CLASS } from './components/admin-mobile-ui';

export function AdminMobileAnalyticsContent() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin } = useAuth();
  const [period, setPeriod] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { analytics, totalUsers, loading } = useAnalytics({
    period,
    startDate,
    endDate,
    isLoggedIn: isLoggedIn ?? false,
    isAdmin: isAdmin ?? false,
  });

  return (
    <div className="pb-2">
      <AdminMobilePeriodSelector
        period={period}
        startDate={startDate}
        endDate={endDate}
        analytics={analytics}
        onPeriodChange={setPeriod}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {loading ? (
        <div className={`${ADMIN_MOBILE_CARD_CLASS} py-10 text-center`}>
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-[#f66812]" />
          <p className="text-sm text-gray-600">{t('admin.analytics.loadingAnalytics')}</p>
        </div>
      ) : analytics ? (
        <>
          <AdminMobileStatsCards analytics={analytics} totalUsers={totalUsers} />
          <AdminMobileAnalyticsLists analytics={analytics} />
        </>
      ) : (
        <div className={`${ADMIN_MOBILE_CARD_CLASS} py-8 text-center text-sm text-gray-600`}>
          {t('admin.analytics.noAnalyticsData')}
        </div>
      )}
    </div>
  );
}
