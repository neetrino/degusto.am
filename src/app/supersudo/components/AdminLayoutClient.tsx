'use client';

import dynamic from 'next/dynamic';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AdminSidebarCollapseProvider } from '../context/AdminSidebarCollapseContext';
import { AdminDialogsProvider } from '../context/AdminDialogsContext';
import { AdminSidebar } from './AdminSidebar';
import {
  ADMIN_MAIN_COLUMN,
  ADMIN_MAIN_INNER,
  ADMIN_PAGE_SHELL,
} from '../admin-sidebar-classes';

type AdminLayoutClientProps = {
  children: ReactNode;
};

const AdminNewOrderAlerts = dynamic(
  () => import('./AdminNewOrderAlerts').then((module) => module.AdminNewOrderAlerts),
  { ssr: false }
);

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, isLoggedIn, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <AdminSidebarCollapseProvider>
      <AdminDialogsProvider>
        <AdminNewOrderAlerts />
        <div className={ADMIN_PAGE_SHELL}>
          <AdminSidebar />
          <div className={ADMIN_MAIN_COLUMN}>
            <div className={ADMIN_MAIN_INNER}>{children}</div>
          </div>
        </div>
      </AdminDialogsProvider>
    </AdminSidebarCollapseProvider>
  );
}
