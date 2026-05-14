'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdminPage = pathname?.startsWith('/supersudo');
  if (pathname === '/') {
    return null;
  }
  if (isAdminPage) {
    return null;
  }
  return (
    <div className="hidden lg:block">
      <Footer outerBackgroundClassName={isAuthPage ? 'bg-[#F66812]' : 'bg-white'} />
    </div>
  );
}
