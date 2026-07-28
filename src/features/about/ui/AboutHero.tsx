"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef } from "react";

import { ABOUT_HERO_IMAGE } from "@/features/about/content/about-assets";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutHeroProps = {
  copy: Dictionary["about"];
  locale: Locale;
  ctaLabel: string;
  lead: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** Full-bleed brand hero with Motion parallax + staggered entrance. */
export function AboutHero({ copy, locale, ctaLabel, lead }: AboutHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["0%", "18%"],
  );
  const imageScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1.08, 1.08] : [1.08, 1.22],
  );
  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["0%", "12%"],
  );
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.75],
    reduceMotion ? [1, 1] : [1, 0.35],
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-20 min-h-[min(92vh,54rem)] overflow-hidden md:min-h-[min(88vh,58rem)]"
    >
      <motion.div className="absolute inset-0" style={{ y: imageY }}>
        <motion.div className="absolute inset-0" style={{ scale: imageScale }}>
          <Image
            src={ABOUT_HERO_IMAGE}
            alt={copy.heroImageAlt}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(105deg,rgba(12,18,14,0.88)_0%,rgba(18,40,28,0.72)_42%,rgba(12,18,14,0.42)_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/70 to-transparent"
        />
        <div
          aria-hidden
          className="about-hero-grain pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
        />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex min-h-[min(92vh,54rem)] w-full max-w-[min(1450px,calc(100%-2rem))] flex-col justify-end px-4 pt-[7.5rem] pb-16 md:min-h-[min(88vh,58rem)] md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 md:pb-24 lg:max-w-[min(1450px,calc(100%-3rem))] lg:pb-28"
      >
        <div className="max-w-2xl space-y-5 md:space-y-6">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            className="font-display text-sm font-black tracking-[0.28em] text-brand uppercase md:text-base md:tracking-[0.32em]"
          >
            {copy.eyebrow}
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 28, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
            className="font-display text-[2.75rem] leading-[0.95] font-black tracking-tight text-white md:text-6xl lg:text-7xl"
          >
            {copy.title}
          </motion.h1>
          <motion.span
            aria-hidden
            initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
            className="block h-1 w-16 origin-left rounded-full bg-brand md:w-20"
          />
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE, delay: 0.45 }}
            className="max-w-xl text-base leading-7 text-white/88 md:text-lg md:leading-8"
          >
            {lead}
          </motion.p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
            className="pt-1"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center justify-center rounded-[15px] bg-brand px-7 py-3.5 text-sm font-semibold text-brand-foreground shadow-[0_12px_30px_-12px_rgba(246,104,18,0.85)] transition-colors hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {ctaLabel}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
