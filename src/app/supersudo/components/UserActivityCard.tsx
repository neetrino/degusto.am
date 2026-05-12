'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { formatCurrency, formatDate } from '../utils/dashboardUtils';
import { ADMIN_PANEL_CARD, ADMIN_PANEL_ITEM, ADMIN_PANEL_TITLE } from './dashboardStyles';

interface UserActivity {
  recentRegistrations: Array<{
    id: string;
    email?: string;
    phone?: string;
    name: string;
    registeredAt: string;
    lastLoginAt?: string;
  }>;
  activeUsers: Array<{
    id: string;
    email?: string;
    phone?: string;
    name: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: string;
    lastLoginAt?: string;
  }>;
}

interface UserActivityCardProps {
  userActivity: UserActivity | null;
  userActivityLoading: boolean;
}

export function UserActivityCard({ userActivity, userActivityLoading }: UserActivityCardProps) {
  const { t } = useTranslation();

  return (
    <Card className={`${ADMIN_PANEL_CARD} mb-8 p-6`}>
      <h2 className={`${ADMIN_PANEL_TITLE} mb-6`}>{t('admin.dashboard.userActivity')}</h2>
      {userActivityLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : userActivity ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="mb-4 text-lg font-medium text-[#203428]">{t('admin.dashboard.recentRegistrations')}</h3>
            <div className="space-y-3">
              {userActivity.recentRegistrations.length === 0 ? (
                <p className="text-sm text-gray-600">{t('admin.dashboard.noRecentRegistrations')}</p>
              ) : (
                userActivity.recentRegistrations.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className={`${ADMIN_PANEL_ITEM} flex items-center justify-between bg-gradient-to-br from-[#fff0e4] via-[#fff8f3] to-[#e6f7ed]`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.email || user.phone || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(user.registeredAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-medium text-[#203428]">{t('admin.dashboard.mostActiveUsers')}</h3>
            <div className="space-y-3">
              {userActivity.activeUsers.length === 0 ? (
                <p className="text-sm text-gray-600">{t('admin.dashboard.noActiveUsers')}</p>
              ) : (
                userActivity.activeUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className={`${ADMIN_PANEL_ITEM} flex items-center justify-between bg-gradient-to-br from-[#fff0e4] via-[#fff8f3] to-[#e6f7ed]`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.email || user.phone || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('admin.dashboard.ordersCount').replace('{count}', user.orderCount.toString())} • {formatCurrency(user.totalSpent, 'USD')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">{t('admin.dashboard.noUserActivityData')}</p>
      )}
    </Card>
  );
}

