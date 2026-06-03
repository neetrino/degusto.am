'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

const AUTH_FOOTER_BACKGROUND_CLASS = 'bg-[#102313]';

export function ConditionalFooter() {
  const pathname = usePathname();

  if (pathname === '/' || pathname?.startsWith('/supersudo') || pathname?.startsWith('/admin-mobile')) {
    return null;
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProfilePage = pathname?.startsWith('/profile');
  const isAboutPage = pathname?.startsWith('/about');

  if (isProfilePage) {
    return (
      <div className="hidden lg:block">
        <Footer outerBackgroundClassName="bg-white" />
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div className={`hidden lg:block ${AUTH_FOOTER_BACKGROUND_CLASS}`}>
        <Footer outerBackgroundClassName="bg-transparent" />
      </div>
    );
  }

  const backgroundClassName = isAboutPage ? 'bg-[#F2EBDD]' : 'bg-white';

  return (
    <div className={`hidden lg:block ${backgroundClassName}`}>
      <Footer outerBackgroundClassName={backgroundClassName} />
    </div>
  );
}
