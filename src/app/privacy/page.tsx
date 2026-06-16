'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';

type PrivacySectionKey =
  | 'welcome'
  | 'websiteVisitors'
  | 'gatheringPersonallyIdentifying'
  | 'security'
  | 'protectionPersonallyIdentifying'
  | 'aggregatedStatistics'
  | 'cookies'
  | 'ecommerce'
  | 'privacyPolicyChanges'
  | 'childrensPrivacy';

const PRIVACY_SECTIONS: ReadonlyArray<{
  key: PrivacySectionKey;
  paragraphKeys: ReadonlyArray<'paragraph1' | 'paragraph2' | 'paragraph3' | 'lead'>;
  showTitle?: boolean;
}> = [
  { key: 'welcome', paragraphKeys: ['lead', 'paragraph1'], showTitle: false },
  { key: 'websiteVisitors', paragraphKeys: ['paragraph1', 'paragraph2'] },
  { key: 'gatheringPersonallyIdentifying', paragraphKeys: ['paragraph1'] },
  { key: 'security', paragraphKeys: ['paragraph1'] },
  { key: 'protectionPersonallyIdentifying', paragraphKeys: ['paragraph1', 'paragraph2'] },
  { key: 'aggregatedStatistics', paragraphKeys: ['paragraph1'] },
  { key: 'cookies', paragraphKeys: ['paragraph1', 'paragraph2', 'paragraph3'] },
  { key: 'ecommerce', paragraphKeys: ['paragraph1'] },
  { key: 'privacyPolicyChanges', paragraphKeys: ['paragraph1'] },
  { key: 'childrensPrivacy', paragraphKeys: ['paragraph1'] },
];

/**
 * Privacy Policy page — content from locale `privacy` namespace (hy / en / ru).
 */
export default function PrivacyPage() {
  const { t, lang } = useTranslation();
  const fixedLastUpdatedIsoDate = '2026-06-16T00:00:00.000Z';
  const lastUpdatedDateLabel = new Date(fixedLastUpdatedIsoDate).toLocaleDateString(lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <h1 className="text-4xl font-bold text-gray-900">{t('privacy.title')}</h1>
        <p className="text-gray-600">
          {t('privacy.lastUpdated')} {lastUpdatedDateLabel}
        </p>

        <div className="mt-8 space-y-6">
          <Card className="space-y-8 p-6">
            {PRIVACY_SECTIONS.map((section) => (
              <section key={section.key} className="space-y-3">
                {section.showTitle !== false ? (
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {t(`privacy.${section.key}.title`)}
                  </h2>
                ) : null}
                {section.paragraphKeys.map((paragraphKey) => (
                  <p key={paragraphKey} className="text-gray-600">
                    {t(`privacy.${section.key}.${paragraphKey}`)}
                  </p>
                ))}
              </section>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
