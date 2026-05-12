import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../../../lib/api-client";
import type { CouponHistoryItem, ProfileTab, UserCoupon } from "../types";

interface UseCouponsProps {
  isLoggedIn: boolean;
  authLoading: boolean;
  activeTab: ProfileTab;
  onError: (error: string) => void;
}

interface CouponsResponse {
  availableCoupons: UserCoupon[];
  history: CouponHistoryItem[];
}

export function useCoupons({
  isLoggedIn,
  authLoading,
  activeTab,
  onError,
}: UseCouponsProps) {
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<UserCoupon[]>([]);
  const [couponHistory, setCouponHistory] = useState<CouponHistoryItem[]>([]);

  const loadCoupons = useCallback(async () => {
    try {
      setCouponsLoading(true);
      onError("");
      const response = await apiClient.get<CouponsResponse>("/api/v1/users/coupons");
      setAvailableCoupons(response.availableCoupons ?? []);
      setCouponHistory(response.history ?? []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      onError(errorMessage || "Failed to load coupons");
    } finally {
      setCouponsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    if (isLoggedIn && !authLoading && activeTab === "coupons") {
      loadCoupons();
    }
  }, [activeTab, authLoading, isLoggedIn, loadCoupons]);

  return {
    couponsLoading,
    availableCoupons,
    couponHistory,
    reloadCoupons: loadCoupons,
  };
}
