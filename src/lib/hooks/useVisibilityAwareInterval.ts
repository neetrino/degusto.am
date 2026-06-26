'use client';

import { useEffect, useRef } from 'react';

type UseVisibilityAwareIntervalOptions = {
  enabled: boolean;
  intervalMs: number;
  onTick: () => void;
  /** Fire once when polling starts or the tab becomes visible again. Default: true. */
  runImmediately?: boolean;
};

/**
 * Interval that runs only while `document` is visible.
 * Pauses in background tabs (avoids throttled 60s bursts) and resumes with an immediate tick.
 */
export function useVisibilityAwareInterval({
  enabled,
  intervalMs,
  onTick,
  runImmediately = true,
}: UseVisibilityAwareIntervalOptions): void {
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let intervalId: number | undefined;

    const tick = (): void => {
      onTickRef.current();
    };

    const stop = (): void => {
      if (intervalId === undefined) {
        return;
      }
      window.clearInterval(intervalId);
      intervalId = undefined;
    };

    const start = (): void => {
      if (intervalId !== undefined) {
        return;
      }
      if (runImmediately) {
        tick();
      }
      intervalId = window.setInterval(tick, intervalMs);
    };

    const onVisibilityChange = (): void => {
      if (document.hidden) {
        stop();
        return;
      }
      start();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    if (!document.hidden) {
      start();
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
    };
  }, [enabled, intervalMs, runImmediately]);
}
