"use client";

import { useEffect, useRef } from "react";

const NEW_ORDER_SOUND_SRC = "/sounds/new-order.wav";

/**
 * Loops the new-order alert sound while `active` is true.
 * Retries after the next user gesture when the browser blocks autoplay.
 */
export function useNewOrderAlertSound(active: boolean): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(NEW_ORDER_SOUND_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!active) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    let cancelled = false;

    const tryPlay = (): void => {
      if (cancelled || !audioRef.current) {
        return;
      }
      void audioRef.current.play().catch(() => {
        // Autoplay blocked until a user gesture.
      });
    };

    tryPlay();

    const unlock = (): void => {
      tryPlay();
    };

    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [active]);
}
