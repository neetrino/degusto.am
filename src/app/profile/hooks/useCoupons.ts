import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n-client';
import type { CouponHistoryItem, ProfileTab, UserCoupon } from '../types';
import {
  fetchCouponsCached,
  getCachedCouponsSync,
} from '@/lib/users/profile-data-cache';

interface UseCouponsProps {
  isLoggedIn: boolean;
  authLoading: boolean;
  activeTab: ProfileTab;
  onError: (error: string) => void;
}

export function useCoupons({
  isLoggedIn,
  authLoading,
  activeTab,
  onError,
}: UseCouponsProps) {
  const { t } = useTranslation();
  const initialCoupons = getCachedCouponsSync();

  const [couponsLoading, setCouponsLoading] = useState(
    activeTab === 'coupons' && initialCoupons === null,
  );
  const [availableCoupons, setAvailableCoupons] = useState<UserCoupon[]>(
    initialCoupons?.availableCoupons ?? [],
  );
  const [couponHistory, setCouponHistory] = useState<CouponHistoryItem[]>(
    initialCoupons?.history ?? [],
  );

  const loadCoupons = useCallback(async () => {
    const cached = getCachedCouponsSync();
    if (cached) {
      setAvailableCoupons(cached.availableCoupons);
      setCouponHistory(cached.history);
      setCouponsLoading(false);
      return;
    }

    try {
      setCouponsLoading(true);
      onError('');
      const response = await fetchCouponsCached();
      setAvailableCoupons(response.availableCoupons);
      setCouponHistory(response.history);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      onError(errorMessage || t('profile.coupons.failedToLoad'));
    } finally {
      setCouponsLoading(false);
    }
  }, [onError, t]);

  useEffect(() => {
    if (isLoggedIn && !authLoading && activeTab === 'coupons') {
      void loadCoupons();
    }
  }, [activeTab, authLoading, isLoggedIn, loadCoupons]);

  return {
    couponsLoading,
    availableCoupons,
    couponHistory,
  };
}
