'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProfilePage = pathname?.startsWith('/profile');
  if (pathname === '/') {
    return null;
  }
  if (isProfilePage) {
    return (
      <div className="hidden lg:block">
        <Footer outerBackgroundClassName="bg-white" />
      </div>
    );
  }
  return <Footer outerBackgroundClassName={isAuthPage ? 'bg-[#F66812]' : 'bg-white'} />;
}
