'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (pathname === '/') {
    return null;
  }
  if (pathname?.startsWith('/profile')) {
    return null;
  }
  return <Footer outerBackgroundClassName={isAuthPage ? 'bg-[#F66812]' : 'bg-white'} />;
}
