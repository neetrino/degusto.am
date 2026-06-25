import { useState, useEffect } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { useTranslation } from '../../../../lib/i18n-client';
import type { AnalyticsData } from '../types';

interface UseAnalyticsParams {
  period: string;
  startDate: string;
  endDate: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

interface UseAnalyticsReturn {
  analytics: AnalyticsData | null;
  totalUsers: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching analytics data
 */
export function useAnalytics({
  period,
  startDate,
  endDate,
  isLoggedIn,
  isAdmin,
}: UseAnalyticsParams): UseAnalyticsReturn {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, string> = {
          period,
        };

        if (period === 'custom' && startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        }

        const response = await apiClient.get<AnalyticsData>('/api/v1/admin/analytics', {
          params,
        });

        logger.info('Analytics data loaded', { period, hasData: !!response });
        setAnalytics(response);
      } catch (err: unknown) {
        logger.error('Error fetching analytics', { error: err });

        let errorMessage = t('admin.analytics.errorLoading');

        if (err instanceof Error) {
          if (err.message.includes('<!DOCTYPE') || err.message.includes('<html')) {
            errorMessage = t('admin.analytics.apiNotFound');
          } else if (err.message.includes('Expected JSON')) {
            errorMessage = t('admin.analytics.invalidResponse');
          } else {
            errorMessage = err.message;
          }
        } else if (err && typeof err === 'object' && 'data' in err) {
          const errorData = err as { data?: { detail?: string } };
          if (errorData.data?.detail) {
            errorMessage = errorData.data.detail;
          }
        }

        setError(errorMessage);
        alert(`${t('admin.common.error')}: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalytics();
  }, [isLoggedIn, isAdmin, period, startDate, endDate, t]);

  return {
    analytics,
    totalUsers: analytics?.users?.total ?? null,
    loading,
    error,
  };
}
