'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';
import { SITE_CONTACT_EMAIL } from '../../lib/site-contact';

type TermsParagraphSectionKey =
  | 'welcome'
  | 'cookies'
  | 'iframes'
  | 'reservationOfRights'
  | 'removalOfLinks'
  | 'contentLiability';

const TERMS_PARAGRAPH_SECTIONS: ReadonlyArray<{
  key: TermsParagraphSectionKey;
  paragraphKeys: ReadonlyArray<'paragraph1' | 'paragraph2' | 'paragraph3'>;
}> = [
  { key: 'welcome', paragraphKeys: ['paragraph1', 'paragraph2', 'paragraph3'] },
  { key: 'cookies', paragraphKeys: ['paragraph1', 'paragraph2', 'paragraph3'] },
  { key: 'iframes', paragraphKeys: ['paragraph1'] },
  { key: 'reservationOfRights', paragraphKeys: ['paragraph1'] },
  { key: 'removalOfLinks', paragraphKeys: ['paragraph1'] },
  { key: 'contentLiability', paragraphKeys: ['paragraph1'] },
];

const LICENSE_ITEM_KEYS = ['republish', 'sell', 'reproduce', 'redistribute'] as const;
const HYPERLINKING_ORG_KEYS = ['government', 'searchEngines', 'news', 'directories'] as const;
const LINK_REQUIREMENT_KEYS = ['notMisleading', 'noFalseEndorsement', 'fitsContext'] as const;
const APPROVAL_CRITERIA_KEYS = ['notUnfavorable', 'satisfactoryRecord', 'visibilityBenefit', 'consistentContent'] as const;
const APPROVED_LINKING_KEYS = ['corporateName', 'url', 'description'] as const;
const DISCLAIMER_ITEM_KEYS = ['deathInjury', 'fraud', 'notPermitted', 'notExcluded'] as const;
const DISCLAIMER_LIMITATION_KEYS = ['preceding', 'govern'] as const;

function TermsSectionTitle({ children }: { children: string }) {
  return <h2 className="text-2xl font-semibold text-gray-900">{children}</h2>;
}

function TermsParagraph({ children }: { children: string }) {
  return <p className="text-gray-600">{children}</p>;
}

function TermsList({ items }: { items: readonly string[] }) {
  return (
    <ul className="ml-4 list-disc list-inside space-y-1 text-gray-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Terms page — content from locale `terms` namespace (hy / en / ru).
 */
export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="policy-page">
      <div className="policy-page-inner">
        <h1 className="text-4xl font-bold text-gray-900">{t('terms.title')}</h1>

        <div className="mt-8 space-y-6">
          <Card className="space-y-8 p-6">
            {TERMS_PARAGRAPH_SECTIONS.slice(0, 2).map((section) => (
              <section key={section.key} className="space-y-3">
                <TermsSectionTitle>{t(`terms.${section.key}.title`)}</TermsSectionTitle>
                {section.paragraphKeys.map((paragraphKey) => (
                  <TermsParagraph key={paragraphKey}>
                    {t(`terms.${section.key}.${paragraphKey}`)}
                  </TermsParagraph>
                ))}
              </section>
            ))}

            <section className="space-y-3">
              <TermsSectionTitle>{t('terms.license.title')}</TermsSectionTitle>
              <TermsParagraph>{t('terms.license.paragraph1')}</TermsParagraph>
              <TermsParagraph>{t('terms.license.restrictionsIntro')}</TermsParagraph>
              <TermsList
                items={LICENSE_ITEM_KEYS.map((itemKey) => t(`terms.license.items.${itemKey}`))}
              />
            </section>

            <section className="space-y-3">
              <TermsSectionTitle>{t('terms.hyperlinking.title')}</TermsSectionTitle>
              <TermsParagraph>{t('terms.hyperlinking.paragraph1')}</TermsParagraph>
              <TermsList
                items={HYPERLINKING_ORG_KEYS.map((itemKey) =>
                  t(`terms.hyperlinking.approvedOrganizations.${itemKey}`),
                )}
              />
              <TermsParagraph>{t('terms.hyperlinking.paragraph2')}</TermsParagraph>
              <TermsParagraph>{t('terms.hyperlinking.linkRequirementsIntro')}</TermsParagraph>
              <TermsList
                items={LINK_REQUIREMENT_KEYS.map((itemKey) =>
                  t(`terms.hyperlinking.linkRequirements.${itemKey}`),
                )}
              />
              <TermsParagraph>{t('terms.hyperlinking.paragraph3')}</TermsParagraph>
              <TermsList
                items={APPROVAL_CRITERIA_KEYS.map((itemKey) =>
                  t(`terms.hyperlinking.approvalCriteria.${itemKey}`),
                )}
              />
              <TermsParagraph>{t('terms.hyperlinking.linkRequirementsIntro2')}</TermsParagraph>
              <TermsList
                items={LINK_REQUIREMENT_KEYS.map((itemKey) =>
                  t(`terms.hyperlinking.linkRequirements.${itemKey}`),
                )}
              />
              <p className="text-gray-600">
                {t('terms.hyperlinking.contactBeforeEmail')}{' '}
                <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
                  {SITE_CONTACT_EMAIL}
                </a>
                {t('terms.hyperlinking.contactAfterEmail')}
              </p>
              <TermsParagraph>{t('terms.hyperlinking.paragraph4')}</TermsParagraph>
              <TermsParagraph>{t('terms.hyperlinking.approvedLinkingIntro')}</TermsParagraph>
              <TermsList
                items={APPROVED_LINKING_KEYS.map((itemKey) =>
                  t(`terms.hyperlinking.approvedLinking.${itemKey}`),
                )}
              />
              <TermsParagraph>{t('terms.hyperlinking.paragraph5')}</TermsParagraph>
            </section>

            {TERMS_PARAGRAPH_SECTIONS.slice(2).map((section) => (
              <section key={section.key} className="space-y-3">
                <TermsSectionTitle>{t(`terms.${section.key}.title`)}</TermsSectionTitle>
                {section.paragraphKeys.map((paragraphKey) => (
                  <TermsParagraph key={paragraphKey}>
                    {t(`terms.${section.key}.${paragraphKey}`)}
                  </TermsParagraph>
                ))}
              </section>
            ))}

            <section className="space-y-3">
              <TermsSectionTitle>{t('terms.disclaimer.title')}</TermsSectionTitle>
              <TermsParagraph>{t('terms.disclaimer.paragraph1')}</TermsParagraph>
              <TermsList
                items={DISCLAIMER_ITEM_KEYS.map((itemKey) => t(`terms.disclaimer.items.${itemKey}`))}
              />
              <TermsParagraph>{t('terms.disclaimer.paragraph2')}</TermsParagraph>
              <TermsList
                items={DISCLAIMER_LIMITATION_KEYS.map((itemKey) =>
                  t(`terms.disclaimer.limitations.${itemKey}`),
                )}
              />
              <TermsParagraph>{t('terms.disclaimer.paragraph3')}</TermsParagraph>
            </section>
          </Card>
        </div>
      </div>
    </div>
  );
}
