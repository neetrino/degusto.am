import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../lib/i18n-client';
import type { DashboardData } from '../types';
import {
  fetchDashboardCached,
  getCachedDashboardSync,
} from '@/lib/users/profile-data-cache';
import { logger } from '@/lib/utils/logger';

interface UseDashboardProps {
  isLoggedIn: boolean;
  authLoading: boolean;
  activeTab: string;
  onError: (error: string) => void;
}

export function useDashboard({
  isLoggedIn,
  authLoading,
  activeTab,
  onError,
}: UseDashboardProps) {
  const { t } = useTranslation();
  const initialDashboard = getCachedDashboardSync();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(initialDashboard);
  const [dashboardLoading, setDashboardLoading] = useState(
    activeTab === 'dashboard' && initialDashboard === null,
  );

  const loadDashboard = useCallback(async () => {
    const cached = getCachedDashboardSync();
    if (cached) {
      setDashboardData(cached);
      setDashboardLoading(false);
      return;
    }

    try {
      setDashboardLoading(true);
      onError('');
      const data = await fetchDashboardCached();
      setDashboardData(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error loading dashboard', { error: err });
      onError(errorMessage || t('profile.dashboard.failedToLoad'));
    } finally {
      setDashboardLoading(false);
    }
  }, [onError, t]);

  useEffect(() => {
    if (isLoggedIn && !authLoading && activeTab === 'dashboard') {
      void loadDashboard();
    }
  }, [isLoggedIn, authLoading, activeTab, loadDashboard]);

  return {
    dashboardData,
    dashboardLoading,
  };
}
