'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { useAdminNewOrderAlerts } from '../hooks/useAdminNewOrderAlerts';

/**
 * Background polling + «Զակազ» audio when a new order is placed (admin / admin-mobile).
 */
export function AdminNewOrderAlerts() {
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const { t } = useTranslation();
  const enabled = isLoggedIn && isAdmin && !isLoading;

  useAdminNewOrderAlerts({
    enabled,
    alertMessage: (orderNumber) =>
      t('admin.orders.newOrderAlert').replace('{number}', orderNumber),
  });

  return null;
}
