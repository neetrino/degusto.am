'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { HomeOptimizedImage } from '@/components/home/HomeOptimizedImage';
import { NOT_FOUND_BURGER_ZERO_SRC } from './not-found-page.constants';

const NOT_FOUND_DIGIT_CLASS =
  "font-['Montserrat_arm','Montserrat',sans-serif] text-[5.5rem] font-[1000] leading-none tracking-[-0.06em] text-[#ff7f20] drop-shadow-[0_10px_24px_rgba(246,104,19,0.28)] sm:text-[7rem] lg:text-[8.5rem]";

const NOT_FOUND_BURGER_CLASS =
  'relative z-10 h-[4.75rem] w-[4.75rem] shrink-0 object-contain drop-shadow-[0_12px_22px_rgba(60,47,47,0.22)] sm:h-[6.1rem] sm:w-[6.1rem] lg:h-[7.5rem] lg:w-[7.5rem]';

const NOT_FOUND_BURGER_OFFSET_CLASS = 'translate-x-1 sm:translate-x-1.5 lg:translate-x-2';

const DIGIT_SPRING = { type: 'spring' as const, stiffness: 320, damping: 22 };

/** Animated “4 🍔 4” hero — drop-in burger + gentle float loop. */
export function NotFoundHeroNumber() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mt-4 inline-flex flex-col items-center">
      <div
        aria-hidden
        className="flex items-end justify-center gap-0.5 sm:items-center sm:gap-1.5"
      >
        <motion.span
          className={NOT_FOUND_DIGIT_CLASS}
          initial={reduceMotion ? false : { opacity: 0, x: -52, scale: 0.82 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ ...DIGIT_SPRING, delay: reduceMotion ? 0 : 0.04 }}
        >
          4
        </motion.span>

        <div
          className={`relative mx-0.5 flex w-[4.75rem] flex-col items-center sm:mx-1 sm:w-[6.1rem] lg:w-[7.5rem] ${NOT_FOUND_BURGER_OFFSET_CLASS}`}
        >
          <motion.div
            aria-hidden
            className="absolute bottom-0.5 z-0 h-3 w-[72%] rounded-[50%] bg-[#3c2f2f]/20 blur-[7px] sm:bottom-1 sm:h-3.5"
            initial={reduceMotion ? false : { opacity: 0, scaleX: 0.35 }}
            animate={
              reduceMotion
                ? { opacity: 0.28, scaleX: 1 }
                : { opacity: [0.28, 0.16, 0.28], scaleX: [1, 0.78, 1] }
            }
            transition={
              reduceMotion
                ? { ...DIGIT_SPRING, delay: 0.22 }
                : { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 1.05 }
            }
          />

          <motion.div
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: -110, scale: 0.45, rotate: -22 }
            }
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            transition={
              reduceMotion
                ? { ...DIGIT_SPRING, delay: 0.16 }
                : {
                    type: 'spring',
                    stiffness: 460,
                    damping: 17,
                    mass: 0.95,
                    delay: 0.16,
                  }
            }
          >
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -14, -5, -14, 0], rotate: [0, -4, 3, -2, 0] }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.95 }
              }
            >
              <HomeOptimizedImage
                src={NOT_FOUND_BURGER_ZERO_SRC}
                alt=""
                width={152}
                height={152}
                className={NOT_FOUND_BURGER_CLASS}
                priority
                loading="eager"
              />
            </motion.div>
          </motion.div>
        </div>

        <motion.span
          className={NOT_FOUND_DIGIT_CLASS}
          initial={reduceMotion ? false : { opacity: 0, x: 52, scale: 0.82 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ ...DIGIT_SPRING, delay: reduceMotion ? 0 : 0.42 }}
        >
          4
        </motion.span>
      </div>

      <span className="sr-only">404</span>

      <motion.div
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0, scaleX: 0.35 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut', delay: reduceMotion ? 0 : 0.58 }}
        className="mt-5 flex w-full max-w-xs origin-center items-center gap-3 sm:max-w-sm"
      >
        <span className="h-px flex-1 bg-[#C9A45C]/70" />
        <motion.span
          initial={reduceMotion ? false : { scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 45 }}
          transition={{ ...DIGIT_SPRING, delay: reduceMotion ? 0 : 0.68 }}
          className="h-2 w-2 bg-[#3E573D]/70"
        />
        <span className="h-px flex-1 bg-[#C9A45C]/55" />
      </motion.div>
    </div>
  );
}
