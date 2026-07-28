"use client";

import Image from "next/image";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef } from "react";

import { ABOUT_MISSION_IMAGE } from "@/features/about/content/about-assets";
import { AboutMissionTitle } from "@/features/about/ui/AboutMissionTitle";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutMissionProps = {
  copy: Dictionary["about"];
  brand: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** Master-style mission — curtain reveal, 3D scroll tilt, char cascade. */
export function AboutMission({ copy, brand }: AboutMissionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.12 });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 26,
    mass: 0.4,
    restDelta: 0.001,
  });
  const showCopy = Boolean(reduceMotion) || sectionInView;

  const imageY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["-16%", "16%"],
  );
  const imageScale = useTransform(
    progress,
    [0, 0.5, 1],
    reduceMotion ? [1.14, 1.14, 1.14] : [1.22, 1.1, 1.24],
  );
  const tiltY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0, 0] : [9, -9],
  );
  const tiltX = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0, 0] : [5, -5],
  );
  const textY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["12%", "-10%"],
  );
  const indexY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["20%", "-24%"],
  );
  const beamX = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["-20%", "-20%"] : ["-40%", "120%"],
  );
  const corner = useTransform(
    progress,
    [0.12, 0.48],
    reduceMotion ? [1, 1] : [0, 1],
  );
  const orb = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["-14%", "12%"],
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#f7f6f3] py-20 md:py-28 lg:py-32"
      style={{ perspective: 1400 }}
    >
      <motion.div
        aria-hidden
        style={{ x: orb }}
        className="pointer-events-none absolute -top-28 left-[-12%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(246,104,18,0.16)_0%,_transparent_68%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] bottom-[-20%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_rgba(62,87,61,0.16)_0%,_transparent_70%)] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start lg:gap-16 xl:gap-20">
          <motion.div
            style={{ y: textY }}
            className="order-2 flex flex-col justify-center gap-16 lg:order-1 lg:min-h-[38rem] lg:gap-20"
          >
            <div className="relative">
              <motion.span
                aria-hidden
                style={{ y: indexY }}
                className="pointer-events-none absolute -top-10 -left-2 select-none font-display text-[6.5rem] leading-none font-black tracking-tighter text-brand/[0.08] md:-top-14 md:text-[8.5rem]"
              >
                01
              </motion.span>
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease: EASE }}
                className="relative text-xs font-semibold tracking-[0.28em] text-brand uppercase md:text-sm"
              >
                {brand}
              </motion.p>
              <AboutMissionTitle
                text={copy.missionTitle}
                className="relative mt-4 font-display text-4xl font-black tracking-tight text-product-ink md:text-5xl"
              />
              <motion.span
                aria-hidden
                initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
                className="mt-5 block h-1.5 w-20 origin-left rounded-full bg-gradient-to-r from-brand to-brand/20"
              />
              <motion.p
                initial={false}
                animate={
                  showCopy ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }
                }
                transition={{ duration: 0.75, ease: EASE, delay: 0.2 }}
                className="relative z-10 mt-6 max-w-xl text-base leading-8 text-[#3f4844] md:text-lg md:leading-9"
              >
                {copy.missionBody}
              </motion.p>
            </div>

            <div className="relative">
              <motion.span
                aria-hidden
                style={{ y: indexY }}
                className="pointer-events-none absolute -top-10 -left-2 select-none font-display text-[6.5rem] leading-none font-black tracking-tighter text-brand-forest/[0.08] md:-top-14 md:text-[8.5rem]"
              >
                02
              </motion.span>
              <AboutMissionTitle
                text={copy.goalTitle}
                className="relative font-display text-4xl font-black tracking-tight text-product-ink md:text-5xl"
              />
              <motion.span
                aria-hidden
                initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
                className="mt-5 block h-1.5 w-20 origin-left rounded-full bg-gradient-to-r from-brand-forest to-brand-forest/15"
              />
              <div className="relative z-10 mt-6 max-w-xl space-y-5 text-base leading-8 text-[#3f4844] md:text-lg md:leading-9">
                {copy.goalParagraphs.map((paragraph, index) => (
                  <motion.p
                    key={paragraph}
                    initial={false}
                    animate={
                      showCopy ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
                    }
                    transition={{
                      duration: 0.7,
                      ease: EASE,
                      delay: 0.28 + index * 0.1,
                    }}
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-32">
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : { clipPath: "inset(12% 12% 12% 12% round 40px)", opacity: 0.4 }
              }
              whileInView={{
                clipPath: "inset(0% 0% 0% 0% round 40px)",
                opacity: 1,
              }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.25, ease: EASE }}
              style={{
                rotateX: tiltX,
                rotateY: tiltY,
                transformStyle: "preserve-3d",
              }}
              className="relative mx-auto aspect-[4/5] w-full max-w-xl overflow-hidden rounded-[28px] shadow-[0_36px_80px_-34px_rgba(15,22,18,0.6)] will-change-transform md:rounded-[40px] lg:mx-0 lg:aspect-auto lg:h-[min(42rem,70vh)] lg:max-w-none"
            >
              <motion.div
                className="absolute inset-0"
                style={{ y: imageY, scale: imageScale }}
              >
                <Image
                  src={ABOUT_MISSION_IMAGE}
                  alt={copy.missionImageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top"
                />
              </motion.div>

              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,18,14,0.05)_0%,rgba(12,18,14,0.15)_45%,rgba(12,18,14,0.62)_100%)]"
              />

              <motion.div
                aria-hidden
                style={{ x: beamX }}
                className="pointer-events-none absolute inset-y-0 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />

              <motion.div
                aria-hidden
                style={{ scale: corner, opacity: corner }}
                className="absolute top-6 left-6 h-14 w-14 origin-top-left border-t-[3px] border-l-[3px] border-brand md:top-8 md:left-8"
              />
              <motion.div
                aria-hidden
                style={{ scale: corner, opacity: corner }}
                className="absolute right-6 bottom-6 h-14 w-14 origin-bottom-right border-r-[3px] border-b-[3px] border-white/90 md:right-8 md:bottom-8"
              />

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 28, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}
                className="absolute inset-x-0 bottom-0 p-6 md:p-8"
              >
                <div className="inline-flex flex-col rounded-[18px] border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md">
                  <p className="font-display text-lg font-black tracking-tight text-white md:text-xl">
                    {brand}
                  </p>
                  <p className="text-sm text-white/75">Food Studio</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
