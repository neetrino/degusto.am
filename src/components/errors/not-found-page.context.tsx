'use client';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type NotFoundPageContextValue = {
  isNotFoundPage: boolean;
  setIsNotFoundPage: (active: boolean) => void;
};

const NotFoundPageContext = createContext<NotFoundPageContextValue | null>(null);

export function NotFoundPageProvider({ children }: { children: ReactNode }) {
  const [isNotFoundPage, setIsNotFoundPage] = useState(false);
  const value = useMemo(
    () => ({ isNotFoundPage, setIsNotFoundPage }),
    [isNotFoundPage],
  );

  return (
    <NotFoundPageContext.Provider value={value}>{children}</NotFoundPageContext.Provider>
  );
}

export function useNotFoundPage(): boolean {
  return useContext(NotFoundPageContext)?.isNotFoundPage ?? false;
}

/** Marks the current route as 404 while the not-found page is mounted. */
export function useNotFoundPageMarker(): void {
  const context = useContext(NotFoundPageContext);

  useLayoutEffect(() => {
    if (!context) {
      return;
    }
    context.setIsNotFoundPage(true);
    return () => {
      context.setIsNotFoundPage(false);
    };
  }, [context]);
}
