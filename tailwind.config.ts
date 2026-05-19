import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/constants/**/*.{js,ts,tsx}',
    './shared/ui/**/*.{ts,tsx}',
  ],
  safelist: ['bg-[#FFEACC]', 'hover:bg-[#FFEACC]', 'group-hover:bg-[#FFEACC]'],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        /** Shop accent — profile, cart, checkout, auth hero */
        brand: {
          DEFAULT: '#F66812',
          hover: '#e45f10',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        heading: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

