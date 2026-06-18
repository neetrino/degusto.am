import localFont from 'next/font/local';

/** Figma "Montserrat arm" — Regular + Bold. See `Montserrat-arm-LICENSE.txt`. */
export const montserratArmFont = localFont({
  src: [
    { path: './Montserrat_am3-Regular.woff', weight: '400', style: 'normal' },
    { path: './Montserrat_am3-Bold.woff', weight: '700', style: 'normal' },
  ],
  display: 'swap',
});
