'use client';

import Image from 'next/image';
import { Card } from '@shop/ui';

const ABOUT_HERO_IMAGE = '/images/about-hero.png';
const ABOUT_MISSION_GOAL_IMAGE = '/images/about-mission-goal.png';

const SECTION_GUTTERS = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
const SECTION_VERTICAL = 'py-12 md:py-16';
const EYEBROW =
  'text-sm font-semibold uppercase tracking-wide text-[color:var(--project-color)] md:text-base';
const BODY_TEXT = 'text-base leading-relaxed text-gray-600 md:text-lg';

export type AboutTranslate = (path: string) => string;

export type TrustHighlight = {
  value: string;
  label: string;
};

export function AboutHeroSection({ t }: { t: AboutTranslate }) {
  return (
    <section className={SECTION_VERTICAL}>
      <div className={SECTION_GUTTERS}>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl shadow-md ring-1 ring-gray-200/80 sm:aspect-[5/4] lg:aspect-auto lg:h-[min(32rem,70vh)] lg:min-h-[22rem]">
            <Image
              src={ABOUT_HERO_IMAGE}
              alt={t('about.heroImageAlt')}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="space-y-6">
            <p className={EYEBROW}>{t('about.subtitle')}</p>
            <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
              {t('about.title')}
            </h1>
            <div className={`space-y-4 ${BODY_TEXT}`}>
              <p>{t('about.description.paragraph1')}</p>
              <p>{t('about.description.paragraph2')}</p>
              <p>{t('about.description.paragraph3')}</p>
              <p>{t('about.description.paragraph4')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutStatsSection({
  t,
  highlights,
}: {
  t: AboutTranslate;
  highlights: TrustHighlight[];
}) {
  return (
    <section className={`${SECTION_VERTICAL} bg-neutral-50`}>
      <div className={SECTION_GUTTERS}>
        <Card className="p-6 md:p-8 lg:p-10">
          <div className="max-w-3xl">
            <p className={EYEBROW}>{t('about.trust.subtitle')}</p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 md:text-3xl">
              {t('about.trust.title')}
            </h2>
            <p className={`mt-4 ${BODY_TEXT}`}>{t('about.trust.description')}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-10 lg:grid-cols-4 lg:gap-6">
            {highlights.map((item) => (
              <article
                key={item.label}
                className="rounded-xl border border-gray-200 bg-neutral-50/80 px-5 py-6 md:px-6 md:py-7"
              >
                <p className="text-3xl font-bold tabular-nums text-gray-900 md:text-4xl">
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-gray-600 md:text-base">{item.label}</p>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

export function AboutMissionSection({ t }: { t: AboutTranslate }) {
  return (
    <section className={`${SECTION_VERTICAL} border-t border-gray-200`}>
      <div className={SECTION_GUTTERS}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div className="order-1 space-y-10 lg:order-2 lg:space-y-12">
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {t('about.mission.title')}
              </h2>
              <p className={`mt-4 ${BODY_TEXT}`}>{t('about.mission.description')}</p>
            </Card>
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {t('about.goal.title')}
              </h2>
              <p className={`mt-4 ${BODY_TEXT}`}>{t('about.goal.paragraph1')}</p>
              <p className={`mt-4 ${BODY_TEXT}`}>{t('about.goal.paragraph2')}</p>
            </Card>
          </div>

          <div className="order-2 lg:order-1">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-xl overflow-hidden rounded-xl shadow-md ring-1 ring-gray-200/80 lg:mx-0 lg:max-w-none lg:sticky lg:top-28">
              <Image
                src={ABOUT_MISSION_GOAL_IMAGE}
                alt={t('about.missionGoalImageAlt')}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
