'use client';

import { useTranslation } from '../../lib/i18n-client';
import {
  AboutHeroSection,
  AboutMissionSection,
  AboutStatsSection,
} from './about-sections';

/**
 * About Us: company story, stats, mission, and goals.
 */
export default function AboutPage() {
  const { t } = useTranslation();
  const trustHighlights = [
    {
      value: t('about.trust.items.customers.value'),
      label: t('about.trust.items.customers.label'),
    },
    {
      value: t('about.trust.items.food.value'),
      label: t('about.trust.items.food.label'),
    },
    {
      value: t('about.trust.items.couriers.value'),
      label: t('about.trust.items.couriers.label'),
    },
    {
      value: t('about.trust.items.years.value'),
      label: t('about.trust.items.years.label'),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <AboutHeroSection t={t} />
      <AboutStatsSection t={t} highlights={trustHighlights} />
      <AboutMissionSection t={t} />
    </div>
  );
}
