'use client';

import { motion } from 'framer-motion';
import { ViewMoreButton } from '@/components/view-more/ViewMoreButton';
import { NotFoundHeroNumber } from '@/components/errors/NotFoundHeroNumber';
import { useTranslation } from '@/lib/i18n-client';

const CONTENT_MOTION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

/**
 * Branded 404 body — page shell supplies unified cream background.
 */
export function NotFoundPageContent() {
  const { t } = useTranslation();

  return (
    <section
      className="relative flex min-h-[calc(100vh-8rem)] flex-1 flex-col overflow-hidden px-4 py-12 sm:px-6 lg:min-h-[calc(100vh-11rem)] lg:py-20"
      aria-labelledby="not-found-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_72%,_rgba(255,127,32,0.14)_0%,_transparent_48%)]"
      />

      <motion.div
        {...CONTENT_MOTION}
        className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B94A24] sm:text-sm">
          404
        </p>

        <NotFoundHeroNumber />

        <h1
          id="not-found-heading"
          className="mt-6 text-2xl font-semibold leading-tight text-[#163F2E] sm:text-3xl"
        >
          {t('common.notFound.title')}
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[#3c2f2f]/78 sm:text-lg">
          {t('common.notFound.description')}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          <ViewMoreButton href="/" size="lg">
            {t('common.notFound.goHome')}
          </ViewMoreButton>
          <ViewMoreButton href="/shop" size="lg" variant="text">
            {t('common.buttons.browseProducts')}
          </ViewMoreButton>
        </div>
      </motion.div>
    </section>
  );
}
