import localFont from 'next/font/local';

/** Figma "Montserrat arm" — Regular + Bold. See `Montserrat-arm-LICENSE.txt`. */
export const montserratArmFont = localFont({
  src: [
    { path: './Montserrat_am3-Regular.woff', weight: '400', style: 'normal' },
    { path: './Montserrat_am3-Bold.woff', weight: '700', style: 'normal' },
  ],
  display: 'swap',
});

/** Bold subset alias for price (node 10:1888). */
export const montserratArmBoldFont = montserratArmFont;
