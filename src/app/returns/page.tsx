'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';
import { SITE_CONTACT_PHONES } from '../../lib/site-contact';

const PRIMARY_CONTACT_PHONE = SITE_CONTACT_PHONES[0];

/**
 * Returns page — return policy content from locale `returns` namespace (hy / en / ru).
 */
export default function ReturnsPage() {
  const { t } = useTranslation();

  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <h1 className="text-4xl font-bold text-gray-900">{t('returns.title')}</h1>

        <div className="mt-8 space-y-6">
          <Card className="p-6">
            <p className="text-gray-600">
              {t('returns.contentBeforePhone')}{' '}
              <a href={`tel:${PRIMARY_CONTACT_PHONE.tel}`} className="text-blue-600 hover:underline">
                {PRIMARY_CONTACT_PHONE.display}
              </a>
              {t('returns.contentAfterPhone')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
