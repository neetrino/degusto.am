'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useNotFoundPage } from './errors/not-found-page.context';
import { NOT_FOUND_SURFACE_CLASS } from './errors/not-found-page.constants';

const AUTH_FOOTER_BACKGROUND_CLASS = 'bg-[#102313]';
const DESKTOP_FOOTER_PLACEHOLDER_CLASS = 'h-[576px] w-full';
const LazyFooter = dynamic(() => import('./Footer').then((module) => module.Footer), {
  ssr: false,
  loading: () => <div className={DESKTOP_FOOTER_PLACEHOLDER_CLASS} aria-hidden />,
});

export function ConditionalFooter() {
  const pathname = usePathname();
  const isNotFoundPage = useNotFoundPage();

  if (pathname === '/' || pathname?.startsWith('/supersudo') || pathname?.startsWith('/admin-mobile')) {
    return null;
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProfilePage = pathname?.startsWith('/profile');
  const isAboutPage = pathname?.startsWith('/about');

  if (isProfilePage) {
    return (
      <div className="hidden lg:block">
        <LazyFooter outerBackgroundClassName="bg-white" />
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div className={`hidden lg:block ${AUTH_FOOTER_BACKGROUND_CLASS}`}>
        <LazyFooter outerBackgroundClassName="bg-transparent" />
      </div>
    );
  }

  if (isNotFoundPage) {
    return (
      <div className={`relative z-10 hidden lg:block ${NOT_FOUND_SURFACE_CLASS}`}>
        <LazyFooter outerBackgroundClassName="bg-transparent" />
      </div>
    );
  }

  const backgroundClassName = isAboutPage ? 'bg-[#F2EBDD]' : 'bg-white';

  return (
    <div className={`hidden lg:block ${backgroundClassName}`}>
      <LazyFooter outerBackgroundClassName={backgroundClassName} />
    </div>
  );
}
