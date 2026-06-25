'use client';

import type { ReactNode } from 'react';
import { AdminDialogsProvider } from '../supersudo/context/AdminDialogsContext';
import { AdminNewOrderAlerts } from '../supersudo/components/AdminNewOrderAlerts';

type AdminMobileLayoutClientProps = {
  children: ReactNode;
};

/**
 * Mobile admin routes reuse supersudo hooks (e.g. useOrders) that need confirm dialogs.
 */
export function AdminMobileLayoutClient({ children }: AdminMobileLayoutClientProps) {
  return (
    <AdminDialogsProvider>
      <AdminNewOrderAlerts />
      {children}
    </AdminDialogsProvider>
  );
}
