'use client';

import Image from 'next/image';
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
    <div className="relative min-h-screen overflow-hidden bg-[#FBF6EA]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Image
          src="/images/about-page-botanical-bg.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-[#FBF6EA]/62" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F6EEDF] via-[#F8F1E4]/88 to-transparent" />
        <div className="absolute -bottom-12 -left-16 hidden h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(246,238,223,0.9)_0%,_rgba(246,238,223,0)_72%)] blur-xl md:block" />
        <div className="absolute -bottom-12 -right-16 hidden h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(246,238,223,0.9)_0%,_rgba(246,238,223,0)_72%)] blur-xl md:block" />
      </div>
      <div className="relative z-10">
        <AboutHeroSection t={t} />
        <AboutStatsSection t={t} highlights={trustHighlights} />
        <AboutMissionSection t={t} />
      </div>
    </div>
  );
}
