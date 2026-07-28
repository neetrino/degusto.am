"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";
import { useRef } from "react";

import {
  ABOUT_STAT_ICONS,
  type AboutStatIconKey,
} from "@/features/about/content/about-assets";
import { AboutStatValue } from "@/features/about/ui/AboutStatValue";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutStatsProps = {
  copy: Dictionary["about"];
};

type StatItem = Dictionary["about"]["stats"][number];

const EASE = [0.22, 1, 0.36, 1] as const;

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.18 },
  },
};

const cardEnterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 64,
    scale: 0.9,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 95, damping: 16 },
  },
};

function isStatIconKey(value: string): value is AboutStatIconKey {
  return value in ABOUT_STAT_ICONS;
}

type AboutStatCardProps = {
  stat: StatItem;
  index: number;
  progress: MotionValue<number>;
  reduceMotion: boolean | null;
};

/** Entrance once; scroll continuously drives y / tilt / ring / glow. */
function AboutStatCard({
  stat,
  index,
  progress,
  reduceMotion,
}: AboutStatCardProps) {
  const direction = index % 2 === 0 ? 1 : -1;
  const iconSrc = isStatIconKey(stat.icon)
    ? ABOUT_STAT_ICONS[stat.icon]
    : ABOUT_STAT_ICONS.users;

  const y = useTransform(
    progress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [36 * direction, 0, -42 * direction],
  );
  const rotate = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0, 0] : [-4.5 * direction, 4.5 * direction],
  );
  const scale = useTransform(
    progress,
    [0, 0.5, 1],
    reduceMotion ? [1, 1, 1] : [0.96, 1.02, 0.97],
  );
  const ringRotate = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, 220 * direction],
  );
  const glowOpacity = useTransform(
    progress,
    [0, 0.45, 1],
    reduceMotion ? [0.35, 0.35, 0.35] : [0.15, 0.55, 0.2],
  );

  return (
    <motion.article
      variants={reduceMotion ? undefined : cardEnterVariants}
      className="relative"
    >
      <motion.div
        style={{ y, rotate, scale }}
        whileHover={
          reduceMotion
            ? undefined
            : {
                y: -12,
                scale: 1.04,
                transition: { type: "spring", stiffness: 280, damping: 18 },
              }
        }
        className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] px-4 py-7 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.65)] backdrop-blur-md will-change-transform md:rounded-[40px] md:px-5 md:py-9 md:text-left"
      >
        <motion.div
          aria-hidden
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-brand/25 blur-2xl"
        />

        <div className="relative mx-auto flex h-[4.75rem] w-[4.75rem] items-center justify-center md:mx-0">
          <motion.svg
            viewBox="0 0 96 96"
            className="absolute inset-0 size-full"
            style={{ rotate: ringRotate }}
            aria-hidden
          >
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2"
            />
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="var(--brand)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="276"
              strokeDashoffset={48 + index * 18}
            />
          </motion.svg>

          <motion.div
            initial={reduceMotion ? false : { scale: 0.45, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 160,
              damping: 14,
              delay: 0.35 + index * 0.1,
            }}
            className="relative size-14 overflow-hidden rounded-full ring-2 ring-white/15"
          >
            <Image
              src={iconSrc}
              alt=""
              width={56}
              height={56}
              className="h-full w-full object-cover"
              aria-hidden
            />
          </motion.div>
        </div>

        <AboutStatValue
          value={stat.value}
          delayMs={260 + index * 110}
          className="mt-6 block font-display text-5xl font-black tabular-nums tracking-tight text-white md:text-6xl lg:text-7xl"
        />

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.55,
            ease: EASE,
            delay: 0.5 + index * 0.1,
          }}
          className="mt-3 text-sm text-white/65 md:text-base"
        >
          {stat.label}
        </motion.p>

        <span
          aria-hidden
          className="mx-auto mt-5 block h-px w-12 bg-brand/70 md:mx-0"
        />
      </motion.div>
    </motion.article>
  );
}

/** Stats band — one-time entrance + continuous scroll-scrubbed motion. */
export function AboutStats({ copy }: AboutStatsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.45,
    restDelta: 0.001,
  });

  const watermarkY = useTransform(
    smoothProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["22%", "-22%"],
  );
  const watermarkRotate = useTransform(
    smoothProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [-6, 6],
  );
  const orbLeft = useTransform(
    smoothProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["-10%", "14%"],
  );
  const orbRight = useTransform(
    smoothProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["12%", "-14%"],
  );
  const headerY = useTransform(
    smoothProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["8%", "-10%"],
  );

  return (
    <section
      ref={sectionRef}
      className="relative z-10 mx-3 overflow-hidden rounded-[28px] bg-[#0f1612] py-20 text-white sm:mx-4 md:mx-6 md:rounded-[40px] md:py-28 lg:mx-8 lg:rounded-[48px] lg:py-32"
    >
      <motion.div
        aria-hidden
        style={{ x: orbLeft }}
        className="pointer-events-none absolute -top-20 -left-16 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(246,104,18,0.28)_0%,_transparent_68%)] blur-3xl"
      />
      <motion.div
        aria-hidden
        style={{ x: orbRight }}
        className="pointer-events-none absolute -right-20 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(62,87,61,0.45)_0%,_transparent_70%)] blur-3xl"
      />
      <motion.p
        aria-hidden
        style={{ y: watermarkY, rotate: watermarkRotate }}
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 select-none font-display text-[9rem] leading-none font-black tracking-tighter text-white/[0.045] uppercase md:text-[14rem] lg:text-[18rem]"
      >
        Stats
      </motion.p>

      <div className="relative mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
        <motion.div style={{ y: headerY }} className="max-w-2xl">
          <motion.p
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 20, letterSpacing: "0.5em" }
            }
            whileInView={{ opacity: 1, y: 0, letterSpacing: "0.28em" }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="text-xs font-semibold tracking-[0.28em] text-brand uppercase md:text-sm"
          >
            {copy.statsEyebrow}
          </motion.p>
          <motion.h2
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 48, filter: "blur(14px)", scale: 0.96 }
            }
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.95, ease: EASE, delay: 0.08 }}
            className="mt-4 font-display text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            {copy.statsTitle}
          </motion.h2>
          <motion.span
            aria-hidden
            initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.28 }}
            className="mt-5 block h-1.5 w-20 origin-left rounded-full bg-brand md:w-24"
          />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={reduceMotion ? undefined : gridVariants}
          className="mt-14 grid grid-cols-2 gap-5 md:mt-16 md:grid-cols-4 md:gap-6 lg:mt-20 lg:gap-8"
          style={{ perspective: 1200 }}
        >
          {copy.stats.map((stat, index) => (
            <AboutStatCard
              key={`${stat.value}-${stat.label}`}
              stat={stat}
              index={index}
              progress={smoothProgress}
              reduceMotion={reduceMotion}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
