"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";

type CatalogNavContextValue = {
  isPending: boolean;
  startCatalogTransition: (callback: () => void) => void;
};

const CatalogNavContext = createContext<CatalogNavContextValue | null>(null);

type CatalogNavProviderProps = {
  children: ReactNode;
};

/** Shared pending flag for shop search / filter navigations. */
export function CatalogNavProvider({ children }: CatalogNavProviderProps) {
  const [isPending, startTransition] = useTransition();
  const startCatalogTransition = useCallback((callback: () => void) => {
    startTransition(callback);
  }, []);
  const value = useMemo(
    () => ({ isPending, startCatalogTransition }),
    [isPending, startCatalogTransition],
  );

  return (
    <CatalogNavContext.Provider value={value}>
      {children}
    </CatalogNavContext.Provider>
  );
}

/** Optional — returns null outside the shop catalog provider. */
export function useCatalogNav(): CatalogNavContextValue | null {
  return useContext(CatalogNavContext);
}

/** Prefer catalog transition when available; otherwise local transition. */
export function useCatalogNavigation(): CatalogNavContextValue {
  const catalog = useCatalogNav();
  const [localPending, startLocalTransition] = useTransition();

  const startCatalogTransition = useCallback(
    (callback: () => void) => {
      if (catalog) {
        catalog.startCatalogTransition(callback);
        return;
      }
      startLocalTransition(callback);
    },
    [catalog, startLocalTransition],
  );

  return {
    isPending: catalog?.isPending ?? localPending,
    startCatalogTransition,
  };
}
