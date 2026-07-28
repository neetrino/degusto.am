"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { useRef } from "react";

type AboutStoryProps = {
  paragraphs: readonly string[];
  brand: string;
  eyebrow: string;
  title: string;
  yearsValue: string;
  yearsLabel: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 28, rotateX: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE },
  },
};

type StoryWordsProps = {
  text: string;
  delayChildren?: number;
};

function StoryWords({ text, delayChildren = 0 }: StoryWordsProps) {
  const words = text.split(" ");

  return (
    <motion.p
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.032, delayChildren },
        },
      }}
      className="text-lg leading-9 text-[#3f4844] md:text-xl md:leading-10"
      style={{ perspective: 800 }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          variants={wordVariants}
          className="mr-[0.3em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
}

/** Editorial story section — giant year mark + word-stagger Motion. */
export function AboutStory({
  paragraphs,
  brand,
  eyebrow,
  title,
  yearsValue,
  yearsLabel,
}: AboutStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const yearY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["12%", "-12%"],
  );
  const yearRotate = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [-4, 4],
  );
  const orbX = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["-8%", "10%"],
  );
  const lineScale = useTransform(
    scrollYProgress,
    [0.15, 0.45],
    reduceMotion ? [1, 1] : [0.15, 1],
  );

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white py-20 md:py-28 lg:py-32"
    >
      <motion.div
        aria-hidden
        style={{ x: orbX }}
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(246,104,18,0.16)_0%,_transparent_68%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] bottom-[-20%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(62,87,61,0.12)_0%,_transparent_70%)] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16 xl:gap-20">
          <div className="relative min-h-[14rem] lg:min-h-[28rem]">
            <motion.div
              style={{ y: yearY, rotate: yearRotate }}
              className="relative z-10"
            >
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="text-xs font-semibold tracking-[0.28em] text-brand uppercase md:text-sm"
              >
                {eyebrow}
              </motion.p>
              <motion.h2
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: 40, filter: "blur(12px)" }
                }
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.08 }}
                className="mt-4 max-w-sm font-display text-4xl font-black tracking-tight text-product-ink md:text-5xl lg:text-6xl"
              >
                {title}
              </motion.h2>

              <div className="mt-8 flex items-end gap-4 md:mt-12">
                <motion.span
                  initial={
                    reduceMotion ? false : { opacity: 0, scale: 0.7, y: 40 }
                  }
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 16,
                    delay: 0.15,
                  }}
                  className="font-display text-[7.5rem] leading-none font-black tracking-tighter text-brand md:text-[9.5rem] lg:text-[11rem]"
                >
                  {yearsValue}
                </motion.span>
                <motion.span
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
                  className="mb-4 font-display text-xl font-black text-brand-forest md:mb-6 md:text-2xl"
                >
                  {yearsLabel}
                </motion.span>
              </div>
            </motion.div>

            <motion.div
              aria-hidden
              style={{ scaleX: lineScale }}
              className="mt-8 h-1 w-full max-w-xs origin-left rounded-full bg-gradient-to-r from-brand via-brand-forest to-transparent"
            />

            <motion.p
              aria-hidden
              initial={reduceMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 0.1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.4 }}
              className="pointer-events-none absolute top-28 -left-2 hidden select-none font-display text-[8rem] leading-none font-black tracking-tighter text-brand-forest uppercase lg:block xl:text-[10rem]"
            >
              {brand}
            </motion.p>
          </div>

          <div className="relative space-y-10 md:space-y-12">
            <motion.span
              aria-hidden
              initial={reduceMotion ? false : { height: 0 }}
              whileInView={{ height: "100%" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
              className="absolute top-0 -left-6 hidden w-px bg-gradient-to-b from-brand via-brand-forest/50 to-transparent lg:block xl:-left-8"
            />

            {paragraphs.map((paragraph, index) => (
              <div key={paragraph} className="relative pl-0 lg:pl-2">
                <motion.span
                  aria-hidden
                  initial={reduceMotion ? false : { scale: 0, rotate: -90 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 16,
                    delay: 0.1 + index * 0.12,
                  }}
                  className="mb-4 inline-flex size-9 items-center justify-center rounded-full bg-brand/10 font-display text-sm font-black text-brand"
                >
                  {String(index + 1).padStart(2, "0")}
                </motion.span>
                {reduceMotion ? (
                  <p className="text-lg leading-9 text-[#3f4844] md:text-xl md:leading-10">
                    {paragraph}
                  </p>
                ) : (
                  <StoryWords
                    text={paragraph}
                    delayChildren={0.12 + index * 0.08}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
