'use client';

import { useEffect } from 'react';

interface BodyBackgroundProps {
  color: string;
}

export function BodyBackground({ color }: BodyBackgroundProps) {
  useEffect(() => {
    const previousColor = document.body.style.backgroundColor;
    document.body.style.backgroundColor = color;

    return () => {
      document.body.style.backgroundColor = previousColor;
    };
  }, [color]);

  return null;
}
