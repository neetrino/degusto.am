'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'admin-products-nested-nav-expanded';

const SUBNAV_CHANGE_EVENT = 'admin-products-subnav-change';

function dispatchSubnavChange(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(SUBNAV_CHANGE_EVENT));
}

function readStoredExpanded(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'false') return false;
    if (v === 'true') return true;
  } catch {
    // ignore
  }
  return true;
}

function persistExpanded(next: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // ignore
  }
}

function isUnderProductsSubnav(pathname: string): boolean {
  return (
    pathname.startsWith('/supersudo/categories') ||
    pathname.startsWith('/supersudo/brands') ||
    pathname.startsWith('/supersudo/attributes')
  );
}

/**
 * Expand/collapse state for Categories, Brands, Attributes under Products in admin nav.
 * Persists to localStorage; auto-expands when route is under those sections.
 */
export function useAdminProductsSubnavExpanded(pathname: string): readonly [boolean, () => void] {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setExpanded(readStoredExpanded());
  }, []);

  useEffect(() => {
    const onExternalChange = () => {
      setExpanded(readStoredExpanded());
    };
    window.addEventListener(SUBNAV_CHANGE_EVENT, onExternalChange);
    return () => window.removeEventListener(SUBNAV_CHANGE_EVENT, onExternalChange);
  }, []);

  useEffect(() => {
    if (isUnderProductsSubnav(pathname)) {
      setExpanded(true);
      persistExpanded(true);
      dispatchSubnavChange();
    }
  }, [pathname]);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      // Avoid sync dispatch inside updater (cross-component setState during reconcile).
      queueMicrotask(() => {
        persistExpanded(next);
        dispatchSubnavChange();
      });
      return next;
    });
  }, []);

  return [expanded, toggle] as const;
}
