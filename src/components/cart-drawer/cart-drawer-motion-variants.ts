import type { Transition, Variants } from 'framer-motion';

const TEXT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function cartDrawerPanelTransition(
  reduceMotion: boolean | null,
  options?: { fullScreen?: boolean },
): Transition {
  if (reduceMotion) {
    return { duration: 0 };
  }
  if (options?.fullScreen) {
    return { duration: 0.34, ease: TEXT_EASE };
  }
  return { duration: 0.3, ease: TEXT_EASE };
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
  options?: { fullScreen?: boolean },
): Variants {
  const exitDuration = reduceMotion ? 0 : 0.3;
  const exitTransition = { duration: exitDuration, ease: [0.4, 0, 0.2, 1] as const };

  if (options?.fullScreen) {
    return {
      hidden: { y: '100%' },
      visible: {
        y: 0,
        transition: panelTransition,
      },
      exit: {
        y: '100%',
        transition: exitTransition,
      },
    };
  }

  return {
    hidden: { x: '100%' },
    visible: {
      x: 0,
      transition: panelTransition,
    },
    exit: {
      x: '100%',
      transition: exitTransition,
    },
  };
}

export function cartDrawerHeaderStagger(
  reduceMotion: boolean | null,
  options?: { fullScreen?: boolean },
): Variants {
  const delayChildren = reduceMotion ? 0 : options?.fullScreen ? 0.02 : 0.06;
  const staggerChildren = reduceMotion ? 0 : options?.fullScreen ? 0.02 : 0.07;

  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
}

export function cartDrawerBodyStagger(
  reduceMotion: boolean | null,
  options?: { fullScreen?: boolean },
): Variants {
  const delayChildren = reduceMotion ? 0 : options?.fullScreen ? 0.12 : 0.18;
  const staggerChildren = reduceMotion ? 0 : options?.fullScreen ? 0.025 : 0.075;

  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
}

export function cartDrawerFadeUpItem(
  reduceMotion: boolean | null,
  options?: { fullScreen?: boolean },
): Variants {
  const duration = reduceMotion ? 0 : options?.fullScreen ? 0.22 : 0.4;
  return {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: TEXT_EASE },
    },
  };
}
