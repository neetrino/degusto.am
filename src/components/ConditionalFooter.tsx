'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === '/') {
    return null;
  }
  if (pathname?.startsWith('/profile')) {
    return null;
  }
  return <Footer outerBackgroundClassName={pathname === '/login' ? 'bg-[#F66812]' : 'bg-white'} />;
}
