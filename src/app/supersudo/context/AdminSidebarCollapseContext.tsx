'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'admin-sidebar-collapsed';

type AdminSidebarCollapseContextValue = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
};

const AdminSidebarCollapseContext = createContext<AdminSidebarCollapseContextValue | null>(
  null,
);

export function AdminSidebarCollapseProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') {
        setCollapsedState(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <AdminSidebarCollapseContext.Provider value={{ collapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </AdminSidebarCollapseContext.Provider>
  );
}

export function useAdminSidebarCollapse(): AdminSidebarCollapseContextValue {
  const ctx = useContext(AdminSidebarCollapseContext);
  if (!ctx) {
    throw new Error('useAdminSidebarCollapse must be used within AdminSidebarCollapseProvider');
  }
  return ctx;
}
