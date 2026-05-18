'use client';

import type { ReactNode } from 'react';
import { AdminDialogsProvider } from '../supersudo/context/AdminDialogsContext';

/**
 * Mobile admin routes reuse supersudo hooks (e.g. useOrders) that need confirm dialogs.
 */
export default function AdminMobileLayout({ children }: { children: ReactNode }) {
  return <AdminDialogsProvider>{children}</AdminDialogsProvider>;
}
