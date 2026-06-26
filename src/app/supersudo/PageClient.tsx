'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { StatsGrid } from './components/StatsGrid';
import { RecentOrdersCard } from './components/RecentOrdersCard';
import { TopProductsCard } from './components/TopProductsCard';
import { DashboardAnalyticsSection } from './components/DashboardAnalyticsSection';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { logger } from "@/lib/utils/logger";

export default function AdminPanel() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  const {
    stats,
    recentOrders,
    topProducts,
    statsLoading,
    recentOrdersLoading,
    topProductsLoading,
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
      <section className="mb-7 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#e2e7e2] bg-[#f9fbf9] px-5 py-4 shadow-[0_6px_18px_rgba(22,46,32,0.04)]">
        <div>
          <h1 className="text-[2rem] font-semibold leading-none text-[#1f3c2c]">
            {t('admin.menu.dashboard')} <span className="text-[#2f8a57]">❦</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-[#607668]">Բարի գալուստ, Admin 👋</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-[#d7e0d8] bg-white px-4 py-2 text-sm font-semibold text-[#365744] shadow-sm"
        >
          Մայիսի 16, 2026
        </button>
      </section>

      <StatsGrid stats={stats} statsLoading={statsLoading} />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentOrdersCard recentOrders={recentOrders} recentOrdersLoading={recentOrdersLoading} />
        <TopProductsCard topProducts={topProducts} topProductsLoading={topProductsLoading} />
      </div>

      <DashboardAnalyticsSection
        stats={stats}
        recentOrders={recentOrders}
        loading={statsLoading || recentOrdersLoading || topProductsLoading}
      />
    </>
  );
}
