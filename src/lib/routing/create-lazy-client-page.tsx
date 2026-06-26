import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

type LazyPageLoaderProps = {
  ariaLabel?: string;
};

/**
 * Lazy-loads a client page chunk with a themed loading UI (next/dynamic + Suspense-style fallback).
 * Use in server `page.tsx` wrappers; pair with matching `loading.tsx` from the same loader component.
 */
export function createLazyClientPage(
  importFn: () => Promise<{ default: ComponentType }>,
  Loading: ComponentType<LazyPageLoaderProps>
): ComponentType {
  return dynamic(importFn, {
    loading: () => <Loading />,
  });
}
