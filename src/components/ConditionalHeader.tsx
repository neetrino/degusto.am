'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

export function ConditionalHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith('/supersudo')) {
    return null;
  }
  if (pathname?.startsWith('/profile')) {
    return <div className="hidden md:block"><Header /></div>;
  }
  return <Header />;
}
