'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface PdpChromeContextValue {
  /** Reserved for future PDP desktop chrome sync (footer/side rails). */
  isDesktopChromeReady: boolean;
  setDesktopChromeReady: (ready: boolean) => void;
}

const PdpChromeContext = createContext<PdpChromeContextValue | null>(null);

export function PdpChromeProvider({ children }: { children: ReactNode }) {
  const [isDesktopChromeReady, setReady] = useState(false);
  const setDesktopChromeReady = useCallback((ready: boolean) => {
    setReady(ready);
  }, []);

  const value = useMemo(
    () => ({ isDesktopChromeReady, setDesktopChromeReady }),
    [isDesktopChromeReady, setDesktopChromeReady]
  );

  return <PdpChromeContext.Provider value={value}>{children}</PdpChromeContext.Provider>;
}

export function usePdpChrome(): PdpChromeContextValue {
  const ctx = useContext(PdpChromeContext);
  if (!ctx) {
    throw new Error('usePdpChrome must be used within PdpChromeProvider');
  }
  return ctx;
}
