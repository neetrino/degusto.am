'use client';

import Image from 'next/image';
import { Card } from '@shop/ui';
import { Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

const ABOUT_HERO_IMAGE = '/images/about-hero.png';
const ABOUT_MISSION_GOAL_IMAGE = '/images/about-mission-interior.png';

const SECTION_GUTTERS = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
const SECTION_VERTICAL = 'py-12 md:py-16';
const EYEBROW =
  'text-sm font-semibold uppercase tracking-wide text-[color:var(--project-color)] md:text-base';
const BODY_TEXT = 'text-base leading-relaxed text-gray-600 md:text-lg';
const HERO_COPY_TEXT = 'text-base leading-8 text-[#5F6B66] md:text-lg md:leading-8';
const STATS_CARD_ICON_SOURCES = [
  '/images/about-stats-users.png',
  '/images/about-stats-cloche.png',
  '/images/about-stats-star.png',
  '/images/about-stats-location.png',
] as const;

export type AboutTranslate = (path: string) => string;

export type TrustHighlight = {
  value: string;
  label: string;
};

export function AboutHeroSection({ t }: { t: AboutTranslate }) {
  return (
    <section className={`${SECTION_VERTICAL} relative z-20 pb-16 md:pb-20`}>
      <div className={SECTION_GUTTERS}>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-8 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[32px] shadow-[0_24px_45px_-28px_rgba(18,63,42,0.55)] ring-1 ring-[rgba(201,164,92,0.35)] transition-shadow duration-300 hover:shadow-[0_30px_52px_-28px_rgba(18,63,42,0.65)] md:aspect-[5/4] lg:h-[min(36rem,74vh)] lg:min-h-[24rem] lg:aspect-auto">
              <Image
                src={ABOUT_HERO_IMAGE}
                alt={t('about.heroImageAlt')}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.05 }}
            className="space-y-6 md:pl-2"
          >
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#B94A24] md:text-sm">
                {t('about.subtitle')}
              </p>
            </div>
            <div className="inline-flex w-fit flex-col">
              <h1 className="text-[2.15rem] font-semibold leading-[1.08] text-[#163F2E] md:text-5xl">
                {t('about.title')}
              </h1>
              <div className="mt-4 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-[#C9A45C]/70" />
                <Leaf className="h-4 w-4 text-[#C9A45C]" strokeWidth={1.7} />
                <span className="h-px flex-1 bg-[#C9A45C]/55" />
              </div>
            </div>
            <div className={`max-w-xl space-y-4 ${HERO_COPY_TEXT}`}>
              <p>{t('about.description.paragraph1')}</p>
              <p>{t('about.description.paragraph2')}</p>
              <p>{t('about.description.paragraph3')}</p>
            </div>
          </motion.div>
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
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`${SECTION_VERTICAL} relative z-10 -mt-12 pt-20 md:-mt-14 md:pt-24`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#FBF6EA]/40 to-transparent" />
        <div className="absolute -right-10 top-12 hidden h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(233,172,154,0.18)_0%,_rgba(233,172,154,0)_72%)] blur-2xl md:block" />
        <div className="absolute -left-14 bottom-2 hidden h-52 w-52 rounded-full bg-[radial-gradient(circle,_rgba(126,157,116,0.16)_0%,_rgba(126,157,116,0)_72%)] blur-2xl lg:block" />
      </div>
      <div className={`${SECTION_GUTTERS} relative`}>
        <Card className="rounded-[30px] border-[rgba(201,164,92,0.33)] bg-[#FFFDF7]/78 p-6 shadow-[0_18px_38px_-24px_rgba(22,63,46,0.45)] backdrop-blur-[2px] md:p-9 lg:rounded-[34px] lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B94A24] md:text-sm">
              {t('about.trust.subtitle')}
            </p>
            <div className="mt-3 inline-flex w-fit flex-col">
              <h2 className="text-2xl font-semibold text-[#163F2E] md:text-3xl lg:text-4xl">
                {t('about.trust.title')}
              </h2>
              <div className="mt-4 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-[#C9A45C]/75" />
                <Leaf className="h-4 w-4 text-[#C9A45C]" strokeWidth={1.7} />
                <span className="h-px flex-1 bg-[#C9A45C]/60" />
              </div>
            </div>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-10 lg:grid-cols-4 lg:gap-6">
            {highlights.map((item, index) => (
              <motion.article
                key={item.label}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
                className="group rounded-[24px] border border-[rgba(201,164,92,0.28)] bg-[#FFFDF7]/90 px-5 py-6 text-center shadow-[0_14px_26px_-22px_rgba(22,63,46,0.7)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-20px_rgba(22,63,46,0.75)] md:px-6 md:py-7"
              >
                <div className="mx-auto flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full border border-[rgba(201,164,92,0.48)] bg-[#FFF8E8] p-0.5 transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={STATS_CARD_ICON_SOURCES[index] ?? STATS_CARD_ICON_SOURCES[0]}
                    alt=""
                    width={60}
                    height={60}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <p className="mt-4 text-3xl font-semibold tabular-nums text-[#163F2E] md:text-4xl">
                  {item.value}
                </p>
                <span className="mx-auto mt-3 block h-px w-12 bg-[#C9A45C]/72" aria-hidden="true" />
                <p className="mt-3 text-sm text-[#5F6B66] md:text-base">{item.label}</p>
              </motion.article>
            ))}
          </div>
        </Card>
      </div>
    </motion.section>
  );
}

export function AboutMissionSection({ t }: { t: AboutTranslate }) {
  return (
    <section className={`${SECTION_VERTICAL} relative`}>
      <div className={SECTION_GUTTERS}>
        <div className="grid grid-cols-1 gap-8 md:gap-9 lg:min-h-[42rem] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-stretch lg:gap-10 xl:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="order-1"
          >
            <div className="relative mx-auto aspect-[4/5] w-full max-w-xl overflow-hidden rounded-[30px] border border-[rgba(201,164,92,0.34)] shadow-[0_24px_50px_-28px_rgba(22,63,46,0.62)] lg:mx-0 lg:h-full lg:max-w-none lg:rounded-[32px]">
              <Image
                src={ABOUT_MISSION_GOAL_IMAGE}
                alt={t('about.missionGoalImageAlt')}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 52vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.05 }}
            className="order-2 flex flex-col gap-6 lg:h-full lg:gap-7"
          >
            <Card className="rounded-[26px] border-[rgba(201,164,92,0.34)] bg-[#FFFDF7]/88 p-6 shadow-[0_16px_34px_-22px_rgba(22,63,46,0.58)] backdrop-blur-[1px] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_22px_42px_-20px_rgba(22,63,46,0.6)] md:p-8 lg:flex-1">
              <div className="min-w-0">
                <div className="inline-flex w-fit flex-col">
                  <h2 className="text-2xl font-semibold text-[#163F2E] md:text-3xl">
                    {t('about.mission.title')}
                  </h2>
                  <div className="mt-3 grid w-full grid-cols-[minmax(2.6rem,1fr)_auto_minmax(2.6rem,1fr)] items-center gap-3" aria-hidden="true">
                    <span className="h-px w-full bg-[#C9A45C]/75" />
                    <Leaf className="h-4 w-4 text-[#C9A45C]" strokeWidth={1.7} />
                    <span className="h-px w-full bg-[#C9A45C]/60" />
                  </div>
                </div>
                <p className="mt-4 text-base leading-8 text-[#5F6B66] md:text-lg">
                  {t('about.mission.description')}
                </p>
              </div>
            </Card>

            <Card className="rounded-[26px] border-[rgba(201,164,92,0.34)] bg-[#FFFDF7]/88 p-6 shadow-[0_16px_34px_-22px_rgba(22,63,46,0.58)] backdrop-blur-[1px] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_22px_42px_-20px_rgba(22,63,46,0.6)] md:p-8 lg:flex-1">
              <div className="min-w-0">
                <div className="inline-flex w-fit flex-col">
                  <h2 className="text-2xl font-semibold text-[#163F2E] md:text-3xl">
                    {t('about.goal.title')}
                  </h2>
                  <div className="mt-3 grid w-full grid-cols-[minmax(2.6rem,1fr)_auto_minmax(2.6rem,1fr)] items-center gap-3" aria-hidden="true">
                    <span className="h-px w-full bg-[#C9A45C]/75" />
                    <Leaf className="h-4 w-4 text-[#C9A45C]" strokeWidth={1.7} />
                    <span className="h-px w-full bg-[#C9A45C]/60" />
                  </div>
                </div>
                <p className="mt-4 text-base leading-8 text-[#5F6B66] md:text-lg">
                  {t('about.goal.paragraph1')}
                </p>
                <p className="mt-4 text-base leading-8 text-[#5F6B66] md:text-lg">
                  {t('about.goal.paragraph2')}
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
