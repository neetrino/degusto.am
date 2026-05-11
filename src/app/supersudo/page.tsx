'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { StatsGrid } from './components/StatsGrid';
import { RecentOrdersCard } from './components/RecentOrdersCard';
import { TopProductsCard } from './components/TopProductsCard';
import { UserActivityCard } from './components/UserActivityCard';
import { QuickActionsCard } from './components/QuickActionsCard';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { logger } from "@/lib/utils/logger";

export default function AdminPanel() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading, user } = useAuth();
  const router = useRouter();

  const {
    stats,
    recentOrders,
    topProducts,
    userActivity,
    statsLoading,
    recentOrdersLoading,
    topProductsLoading,
    userActivityLoading,
  } = useAdminDashboard({
    isLoggedIn,
    isAdmin,
    isLoading,
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        logger.debug('❌ [ADMIN] User not logged in, redirecting to login...');
        router.push('/login');
        return;
      }
      if (!isAdmin) {
        logger.debug('❌ [ADMIN] User is not admin, redirecting to home...');
        router.push('/');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-gray-600">
          {t('admin.dashboard.welcome').replace('{name}', user?.firstName || t('admin.dashboard.title'))}
        </p>
      </div>

      <StatsGrid stats={stats} statsLoading={statsLoading} />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentOrdersCard recentOrders={recentOrders} recentOrdersLoading={recentOrdersLoading} />
        <TopProductsCard topProducts={topProducts} topProductsLoading={topProductsLoading} />
      </div>

      <UserActivityCard userActivity={userActivity} userActivityLoading={userActivityLoading} />

      <QuickActionsCard />
    </>
  );
}
