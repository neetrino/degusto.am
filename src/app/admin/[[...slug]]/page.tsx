'use client';

import { useEffect } from 'react';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';

function supersudoPathFromSlug(slug: string | string[] | undefined): string {
  if (slug == null) {
    return '/supersudo';
  }
  const segments = Array.isArray(slug) ? slug : [slug];
  if (segments.length === 0) {
    return '/supersudo';
  }
  return `/supersudo/${segments.join('/')}`;
}

export default function LegacyAdminUrlPage() {
  const { isAdmin, isLoading, isLoggedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string | string[] | undefined;
  const query = searchParams.toString();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isLoggedIn || !isAdmin) {
      return;
    }
    const base = supersudoPathFromSlug(slug);
    router.replace(query ? `${base}?${query}` : base);
  }, [isAdmin, isLoading, isLoggedIn, query, router, slug]);

  if (!isLoading && (!isLoggedIn || !isAdmin)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center text-sm text-gray-500">
      {isLoading ? '…' : null}
    </div>
  );
}
