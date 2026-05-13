'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { UniversalHeader } from './UniversalHeader';

export function ConditionalHeader() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (pathname?.startsWith('/supersudo')) {
    return null;
  }

  if (pathname === '/') {
    return null;
  }

  return (
    <>
      <div className="hidden lg:block">
        <UniversalHeader spacerBackgroundClassName={isAuthPage ? 'bg-[#F66812]' : 'bg-[var(--project-color)]'} />
      </div>
      <div className="lg:hidden">
        <Header />
      </div>
    </>
  );
}
