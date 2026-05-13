import { Rubik } from 'next/font/google';

/**
 * Fat display for footer orange headings (requested “Big Fat Boii”; no bundled TTF).
 * Rubik Black (OFL): Latin + Cyrillic. Footer stacks Mirage Expanded after this for Armenian glyphs.
 */
export const bigFatBoiiFont = Rubik({
  weight: '900',
  subsets: ['latin', 'cyrillic', 'cyrillic-ext', 'latin-ext'],
  display: 'swap',
});
