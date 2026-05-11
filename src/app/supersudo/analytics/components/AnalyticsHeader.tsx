'use client';

import { useTranslation } from '../../../../lib/i18n-client';

export function AnalyticsHeader() {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <p className="text-gray-600">{t('admin.analytics.subtitle')}</p>
    </div>
  );
}




