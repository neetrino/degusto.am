'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { formatDate } from '../../supersudo/analytics/utils';
import type { AnalyticsData } from '../../supersudo/analytics/types';
import { ADMIN_MOBILE_CARD_CLASS, ADMIN_MOBILE_FIELD_CLASS } from './admin-mobile-ui';

type AdminMobilePeriodSelectorProps = {
  period: string;
  startDate: string;
  endDate: string;
  analytics: AnalyticsData | null;
  onPeriodChange: (period: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
};

export function AdminMobilePeriodSelector({
  period,
  startDate,
  endDate,
  analytics,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
}: AdminMobilePeriodSelectorProps) {
  const { t } = useTranslation();

  return (
    <section className={`${ADMIN_MOBILE_CARD_CLASS} mb-4`}>
      <div className="mb-3 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-gray-900">{t('admin.analytics.timePeriod')}</h2>
        {analytics ? (
          <p className="text-xs text-gray-500">
            {formatDate(analytics.dateRange.start)} – {formatDate(analytics.dateRange.end)}
          </p>
        ) : null}
      </div>
      <label className="mb-2 block text-xs font-medium text-gray-600">{t('admin.analytics.period')}</label>
      <select
        value={period}
        onChange={(event) => {
          onPeriodChange(event.target.value);
          if (event.target.value !== 'custom') {
            onStartDateChange('');
            onEndDateChange('');
          }
        }}
        className={ADMIN_MOBILE_FIELD_CLASS}
      >
        <option value="day">{t('admin.analytics.today')}</option>
        <option value="week">{t('admin.analytics.last7Days')}</option>
        <option value="month">{t('admin.analytics.last30Days')}</option>
        <option value="year">{t('admin.analytics.lastYear')}</option>
        <option value="custom">{t('admin.analytics.customRange')}</option>
      </select>
      {period === 'custom' ? (
        <div className="mt-3 grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t('admin.analytics.startDate')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className={ADMIN_MOBILE_FIELD_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t('admin.analytics.endDate')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className={ADMIN_MOBILE_FIELD_CLASS}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
