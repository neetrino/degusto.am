'use client';

import { useLayoutEffect } from 'react';

interface BodyBackgroundProps {
  color: string;
}

export function BodyBackground({ color }: BodyBackgroundProps) {
  useLayoutEffect(() => {
    const previousBodyColor = document.body.style.backgroundColor;
    const previousHtmlColor = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = color;
    document.documentElement.style.backgroundColor = color;

    return () => {
      document.body.style.backgroundColor = previousBodyColor;
      document.documentElement.style.backgroundColor = previousHtmlColor;
    };
  }, [color]);

  return null;
}
