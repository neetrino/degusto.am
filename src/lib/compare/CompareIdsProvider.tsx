'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchCompareIds } from '../compare-api';

type CompareIdsContextValue = {
  isInCompare: (productId: string) => boolean;
  setProductInCompare: (productId: string, inCompare: boolean) => void;
  compareIds: string[];
  compareCount: number;
  refreshCompareIds: () => Promise<void>;
};

const CompareIdsContext = createContext<CompareIdsContextValue | null>(null);

export function CompareIdsProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [compareIdSet, setCompareIdSet] = useState<Set<string>>(() => new Set());
  const fetchGenerationRef = useRef(0);

  const refreshCompareIds = useCallback(async () => {
    if (!isLoggedIn) {
      setCompareIdSet(new Set());
      return;
    }

    const generation = ++fetchGenerationRef.current;
    const ids = await fetchCompareIds();
    if (generation !== fetchGenerationRef.current) {
      return;
    }
    setCompareIdSet(new Set(ids));
  }, [isLoggedIn]);

  useEffect(() => {
    void refreshCompareIds();

    const handleCompareUpdated = () => {
      void refreshCompareIds();
    };
    const handleAuthUpdated = () => {
      void refreshCompareIds();
    };

    window.addEventListener('compare-updated', handleCompareUpdated);
    window.addEventListener('auth-updated', handleAuthUpdated);

    return () => {
      window.removeEventListener('compare-updated', handleCompareUpdated);
      window.removeEventListener('auth-updated', handleAuthUpdated);
    };
  }, [refreshCompareIds]);

  const setProductInCompare = useCallback((productId: string, inCompare: boolean) => {
    setCompareIdSet((previous) => {
      const next = new Set(previous);
      if (inCompare) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  }, []);

  const value = useMemo<CompareIdsContextValue>(
    () => ({
      isInCompare: (productId: string) => compareIdSet.has(productId),
      setProductInCompare,
      compareIds: Array.from(compareIdSet),
      compareCount: compareIdSet.size,
      refreshCompareIds,
    }),
    [compareIdSet, refreshCompareIds, setProductInCompare]
  );

  return <CompareIdsContext.Provider value={value}>{children}</CompareIdsContext.Provider>;
}

export function useCompareIdsContext(): CompareIdsContextValue {
  const context = useContext(CompareIdsContext);
  if (!context) {
    throw new Error('useCompareIdsContext must be used within CompareIdsProvider');
  }
  return context;
}
