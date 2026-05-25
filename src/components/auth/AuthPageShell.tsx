'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import { FaCarrot, FaFish, FaHamburger, FaPepperHot, FaPizzaSlice } from 'react-icons/fa';
import { Card } from '@shop/ui';
import { AUTH_SIDE_ACCENT_IMAGE_PATH } from '@/constants/auth-page-assets';
import {
  AUTH_PAGE_BRAND_ORANGE_CLASS,
  AUTH_PAGE_CARD_CLASS,
  AUTH_PAGE_DESKTOP_HEADER_OFFSET_CLASS,
  AUTH_PAGE_GLOW_PRIMARY_CLASS,
  AUTH_PAGE_GLOW_SECONDARY_CLASS,
} from '@/constants/auth-page-layout';

const floatingFoodIcons: ReadonlyArray<{
  icon: IconType;
  className: string;
  size: number;
  duration: number;
  delay: number;
}> = [
  { icon: FaPizzaSlice, className: 'left-[7%] top-[20%]', size: 36, duration: 6.2, delay: 0.2 },
  { icon: FaHamburger, className: 'left-[12%] top-[50%]', size: 44, duration: 7.1, delay: 0.8 },
  { icon: FaFish, className: 'left-[9%] top-[78%]', size: 34, duration: 6.6, delay: 0.5 },
  { icon: FaCarrot, className: 'left-[30%] top-[14%]', size: 30, duration: 6.4, delay: 1.1 },
  { icon: FaPepperHot, className: 'left-[34%] top-[82%]', size: 28, duration: 5.9, delay: 1.3 },
  { icon: FaFish, className: 'left-[69%] top-[16%]', size: 34, duration: 6.5, delay: 0.1 },
  { icon: FaCarrot, className: 'left-[86%] top-[28%]', size: 32, duration: 6.8, delay: 0.6 },
  { icon: FaPizzaSlice, className: 'left-[90%] top-[52%]', size: 36, duration: 6.1, delay: 1.0 },
  { icon: FaHamburger, className: 'left-[83%] top-[73%]', size: 42, duration: 7.0, delay: 0.4 },
  { icon: FaPepperHot, className: 'left-[58%] top-[88%]', size: 28, duration: 5.7, delay: 1.5 },
];

type AuthPageShellProps = {
  children: ReactNode;
};

/**
 * Login/register layout: mobile white sheet via MobileStorefrontChrome; desktop orange hero + card.
 */
export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div
      className={`relative z-20 flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent lg:min-h-dvh ${AUTH_PAGE_BRAND_ORANGE_CLASS} ${AUTH_PAGE_DESKTOP_HEADER_OFFSET_CLASS}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 800"
        className="pointer-events-none absolute left-[-280px] top-[-380px] z-0 hidden h-[700px] w-[1080px] -rotate-[10deg] opacity-95 lg:block"
      >
        <circle cx="260" cy="100" r="620" stroke="#3E573D" strokeWidth="170" fill="none" />
      </svg>
      <img
        src={AUTH_SIDE_ACCENT_IMAGE_PATH}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[-190px] top-[-10px] z-0 hidden h-[1160px] w-[460px] -rotate-[8deg] object-contain opacity-100 lg:block"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] hidden lg:block">
        {floatingFoodIcons.map((foodIcon) => {
          const Icon = foodIcon.icon;
          return (
            <motion.div
              key={`${foodIcon.className}-${foodIcon.size}`}
              className={`absolute ${foodIcon.className} text-[#1F2E1F]/52 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]`}
              initial={{ opacity: 0.4, y: 0, rotate: -4, scale: 1 }}
              animate={{
                opacity: [0.4, 0.58, 0.4],
                y: [0, -12, 0],
                rotate: [-4, 4, -4],
                scale: [1, 1.04, 1],
              }}
              transition={{
                duration: foodIcon.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: foodIcon.delay,
              }}
            >
              <Icon size={foodIcon.size} />
            </motion.div>
          );
        })}
      </div>
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col lg:min-h-0 lg:flex-none lg:translate-x-3 lg:px-8 lg:py-12">
        <div className="relative flex flex-1 flex-col justify-center lg:block lg:flex-none">
          <div aria-hidden="true" className={AUTH_PAGE_GLOW_PRIMARY_CLASS} />
          <div aria-hidden="true" className={AUTH_PAGE_GLOW_SECONDARY_CLASS} />
          <Card className={AUTH_PAGE_CARD_CLASS}>{children}</Card>
        </div>
      </div>
    </div>
  );
}
