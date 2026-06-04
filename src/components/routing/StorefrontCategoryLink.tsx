'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { useRoutePrefetch } from '../home/useRoutePrefetch';

type StorefrontCategoryLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'> & {
  href: string;
  children: ReactNode;
};

/** Category / shop links with RSC + shop menu JSON prefetch on pointer/focus. */
export function StorefrontCategoryLink({
  href,
  children,
  onClick,
  ...rest
}: StorefrontCategoryLinkProps) {
  const { getPrefetchHandlers } = useRoutePrefetch([href]);

  return (
    <Link href={href} prefetch onClick={onClick} {...getPrefetchHandlers(href)} {...rest}>
      {children}
    </Link>
  );
}
