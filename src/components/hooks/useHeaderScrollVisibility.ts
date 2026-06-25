'use client';

import { useEffect, useRef, useState } from 'react';

const TOP_THRESHOLD_PX = 12;
/** Cumulative net scroll down before hide (physical length, speed-independent). */
const HIDE_AFTER_MM = 2;
/** Cumulative net scroll up before show while hidden (hysteresis). */
const SHOW_AFTER_MM = 2;

function millimetersToCssPixels(mm: number): number {
  if (typeof document === 'undefined') {
    return (96 / 25.4) * mm;
  }
  const el = document.createElement('div');
  el.style.cssText = `position:absolute;left:-9999px;height:${mm}mm;visibility:hidden;pointer-events:none`;
  document.body.appendChild(el);
  const px = el.getBoundingClientRect().height;
  document.body.removeChild(el);
  return Math.max(1, px);
}

/**
 * Desktop top bar visibility from **window scroll position only** (no `wheel`):
 * counting `scrollY` deltas avoids double-counting wheel + scroll and stops
 * flicker on slow trackpad/mouse wheel.
 *
 * Hide after ~2mm cumulative **net** scroll down; show after ~2mm **net** scroll up
 * while hidden. Small opposite-direction movement reduces the accumulator instead
 * of wiping it, so jitter does not reset progress.
 *
 * When suppressHide is true, the strip stays visible (same-render) for modals /
 * menus; closing them does not reset scroll intent until the user scrolls again.
 */
export function useHeaderScrollVisibility(suppressHide: boolean): boolean {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const downAccumPx = useRef(0);
  const upAccumPx = useRef(0);
  const barHiddenRef = useRef(false);
  const hideThresholdPx = useRef(1);
  const showThresholdPx = useRef(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    lastScrollY.current = window.scrollY;
  }, []);

  useEffect(() => {
    if (suppressHide) {
      setVisible(true);
      barHiddenRef.current = false;
      downAccumPx.current = 0;
      upAccumPx.current = 0;
    }
  }, [suppressHide]);

  useEffect(() => {
    if (!suppressHide && typeof window !== 'undefined') {
      lastScrollY.current = window.scrollY;
      downAccumPx.current = 0;
      upAccumPx.current = 0;
      barHiddenRef.current = false;
    }
  }, [suppressHide]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refreshThresholds = () => {
      hideThresholdPx.current = millimetersToCssPixels(HIDE_AFTER_MM);
      showThresholdPx.current = millimetersToCssPixels(SHOW_AFTER_MM);
    };
    refreshThresholds();
    window.addEventListener('resize', refreshThresholds);

    const tryHideFromAccum = () => {
      if (barHiddenRef.current) return;
      if (downAccumPx.current < hideThresholdPx.current) return;
      setVisible(false);
      barHiddenRef.current = true;
      downAccumPx.current = 0;
      upAccumPx.current = 0;
    };

    const tryShowFromUpAccum = () => {
      if (!barHiddenRef.current) return;
      if (upAccumPx.current < showThresholdPx.current) return;
      setVisible(true);
      barHiddenRef.current = false;
      downAccumPx.current = 0;
      upAccumPx.current = 0;
    };

    const applyTopThreshold = () => {
      const y = window.scrollY;
      if (y <= TOP_THRESHOLD_PX) {
        setVisible(true);
        barHiddenRef.current = false;
        lastScrollY.current = y;
        downAccumPx.current = 0;
        upAccumPx.current = 0;
        return true;
      }
      return false;
    };

    const onScroll = () => {
      if (suppressHide) return;

      const y = window.scrollY;
      if (applyTopThreshold()) return;

      const prev = lastScrollY.current;
      if (y === prev) {
        return;
      }

      if (y < prev) {
        const deltaUp = prev - y;
        if (barHiddenRef.current) {
          upAccumPx.current += deltaUp;
          tryShowFromUpAccum();
        } else {
          downAccumPx.current = Math.max(0, downAccumPx.current - deltaUp);
        }
      } else {
        const deltaDown = y - prev;
        if (barHiddenRef.current) {
          upAccumPx.current = Math.max(0, upAccumPx.current - deltaDown);
        } else {
          downAccumPx.current += deltaDown;
          tryHideFromAccum();
        }
      }
      lastScrollY.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', refreshThresholds);
    };
  }, [suppressHide]);

  return suppressHide || visible;
}
