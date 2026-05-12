'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { UniversalHeader } from './UniversalHeader';

export function ConditionalHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith('/supersudo')) {
    return null;
  }

  if (pathname === '/') {
    return null;
  }

  return (
    <>
      <div className="hidden lg:block">
        <UniversalHeader spacerBackgroundClassName={pathname === '/login' ? 'bg-[#F66812]' : 'bg-white'} />
      </div>
      <div className="lg:hidden">
        <Header />
      </div>
    </>
  );
}
