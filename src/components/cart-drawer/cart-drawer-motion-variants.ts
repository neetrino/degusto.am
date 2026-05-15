import type { Transition, Variants } from 'framer-motion';

const TEXT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function cartDrawerPanelTransition(reduceMotion: boolean | null): Transition {
  if (reduceMotion) {
    return { duration: 0 };
  }
  return { type: 'spring', damping: 34, stiffness: 380, mass: 0.82 };
}

export function cartDrawerBackdropTransition(reduceMotion: boolean | null): Transition {
  if (reduceMotion) {
    return { duration: 0 };
  }
  return { duration: 0.34, ease: TEXT_EASE };
}

export const cartDrawerBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export function cartDrawerPanelVariants(
  panelTransition: Transition,
  reduceMotion: boolean | null,
): Variants {
  const exitDuration = reduceMotion ? 0 : 0.3;
  return {
    hidden: { x: '100%', opacity: 0.88, scale: 0.985 },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: panelTransition,
    },
    exit: {
      x: '100%',
      opacity: 0.72,
      scale: 0.99,
      transition: { duration: exitDuration, ease: [0.4, 0, 0.2, 1] },
    },
  };
}

export function cartDrawerHeaderStagger(reduceMotion: boolean | null): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.07,
        delayChildren: reduceMotion ? 0 : 0.06,
      },
    },
  };
}

export function cartDrawerBodyStagger(reduceMotion: boolean | null): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.075,
        delayChildren: reduceMotion ? 0 : 0.14,
      },
    },
  };
}

export function cartDrawerFadeUpItem(reduceMotion: boolean | null): Variants {
  const duration = reduceMotion ? 0 : 0.4;
  return {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: TEXT_EASE },
    },
  };
}
