'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { formatPriceInCurrency, type CurrencyCode } from '../../../lib/currency';

const COUNT_DURATION_S = 0.55;
const HIGHLIGHT_DURATION_MS = 720;
const PULSE_SCALE_PEAK = 1.04;

const EASE_SMOOTH: [number, number, number, number] = [0.22, 1, 0.36, 1];

type PriceDirection = 'up' | 'down' | 'neutral';

interface PdpAnimatedPriceProps {
  amount: number;
  currency: CurrencyCode;
  className?: string;
}

function resolveDirection(next: number, prev: number): PriceDirection {
  if (next > prev) {
    return 'up';
  }
  if (next < prev) {
    return 'down';
  }
  return 'neutral';
}

export function PdpAnimatedPrice({ amount, currency, className = '' }: PdpAnimatedPriceProps) {
  const reduceMotion = useReducedMotion();
  const isFirstRender = useRef(true);
  const prevAmountRef = useRef(amount);
  const motionAmount = useMotionValue(amount);
  const [displayAmount, setDisplayAmount] = useState(amount);
  const [direction, setDirection] = useState<PriceDirection>('neutral');
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevAmountRef.current = amount;
      motionAmount.set(amount);
      setDisplayAmount(amount);
      return;
    }

    const prev = prevAmountRef.current;
    if (amount === prev) {
      return;
    }

    const nextDirection = resolveDirection(amount, prev);
    setDirection(nextDirection);
    prevAmountRef.current = amount;
    setPulseKey((k) => k + 1);

    if (reduceMotion) {
      motionAmount.set(amount);
      setDisplayAmount(amount);
      return;
    }

    const controls = animate(motionAmount, amount, {
      duration: COUNT_DURATION_S,
      ease: EASE_SMOOTH,
      onUpdate: (latest) => setDisplayAmount(Math.round(latest)),
    });

    return () => controls.stop();
  }, [amount, motionAmount, reduceMotion]);

  useEffect(() => {
    if (direction === 'neutral' || reduceMotion) {
      return;
    }
    const timer = window.setTimeout(() => setDirection('neutral'), HIGHLIGHT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [direction, pulseKey, reduceMotion]);

  const formatted = formatPriceInCurrency(displayAmount, currency);

  const toneClass =
    direction === 'up'
      ? 'text-emerald-600'
      : direction === 'down'
        ? 'text-[#d97706]'
        : 'text-[#3C2F2F]';

  const deltaLabel =
    direction === 'up' ? '+' : direction === 'down' ? '−' : null;

  if (reduceMotion) {
    return (
      <span className={className} aria-live="polite">
        {formatPriceInCurrency(amount, currency)}
      </span>
    );
  }

  return (
    <motion.span
      className={`relative inline-flex items-baseline gap-1.5 ${className}`}
      aria-live="polite"
      key={pulseKey}
      initial={false}
      animate={{ scale: [1, PULSE_SCALE_PEAK, 1] }}
      transition={{ duration: COUNT_DURATION_S, ease: EASE_SMOOTH }}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-x-3 -inset-y-1 rounded-2xl"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: direction === 'neutral' ? 0 : [0, 0.35, 0],
          scale: [0.92, 1.02, 1],
        }}
        transition={{ duration: HIGHLIGHT_DURATION_MS / 1000, ease: 'easeOut' }}
        style={{
          background:
            direction === 'up'
              ? 'linear-gradient(90deg, transparent, rgba(16,185,129,0.18), transparent)'
              : direction === 'down'
                ? 'linear-gradient(90deg, transparent, rgba(217,119,6,0.16), transparent)'
                : 'transparent',
        }}
      />

      {deltaLabel && direction !== 'neutral' ? (
        <motion.span
          key={`${pulseKey}-${direction}`}
          className={`text-lg font-bold leading-none ${toneClass}`}
          initial={{ opacity: 0, y: direction === 'up' ? 8 : -8, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], y: 0, scale: [0.6, 1.1, 0.9] }}
          transition={{ duration: COUNT_DURATION_S * 0.85, ease: EASE_SMOOTH }}
          aria-hidden
        >
          {deltaLabel}
        </motion.span>
      ) : null}

      <motion.span
        className={`relative inline-block whitespace-nowrap tabular-nums transition-colors duration-300 ${toneClass}`}
        layout
      >
        {formatted}
      </motion.span>
    </motion.span>
  );
}
