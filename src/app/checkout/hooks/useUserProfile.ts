import { useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { useAuth } from '../../../lib/auth/AuthContext';
import { fetchUserProfileCached } from '@/lib/users/fetch-user-profile';
import type { CheckoutFormData } from '../types';

export function useUserProfile(
  isLoggedIn: boolean,
  isLoading: boolean,
  setValue: UseFormSetValue<CheckoutFormData>
) {
  const { user } = useAuth();

  useEffect(() => {
    const applyProfileToForm = (profile: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      addresses?: Array<{
        isDefault?: boolean;
        phone?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
      }>;
    }) => {
      if (profile.firstName) {
        setValue('firstName', profile.firstName);
      }
      if (profile.lastName) {
        setValue('lastName', profile.lastName);
      }
      if (profile.email) {
        setValue('email', profile.email);
      }
      if (profile.phone) {
        setValue('phone', profile.phone);
      }

      if (profile.addresses && profile.addresses.length > 0) {
        const defaultAddress = profile.addresses.find((addr) => addr.isDefault) || profile.addresses[0];

        if (defaultAddress) {
          if (!profile.phone && !user?.phone && defaultAddress.phone) {
            setValue('phone', defaultAddress.phone);
          }

          if (defaultAddress.addressLine1) {
            const fullAddress = defaultAddress.addressLine2
              ? `${defaultAddress.addressLine1}, ${defaultAddress.addressLine2}`
              : defaultAddress.addressLine1;
            setValue('shippingAddress', fullAddress);
          }

          if (defaultAddress.city) {
            setValue('shippingCity', defaultAddress.city);
          }
        }
      }
    };

    const scheduleIdleProfileHydration = (work: () => void) => {
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        const idleId = window.requestIdleCallback(work, { timeout: 1500 });
        return () => window.cancelIdleCallback?.(idleId);
      }
      const timer = setTimeout(work, 250);
      return () => clearTimeout(timer);
    };

    let cleanup: (() => void) | null = null;

    async function loadUserProfile() {
      if (isLoading) {
        return;
      }

      if (isLoggedIn) {
        if (user) {
          applyProfileToForm(user);
        }

        cleanup = scheduleIdleProfileHydration(() => {
          void (async () => {
            try {
              const profile = await fetchUserProfileCached();
              applyProfileToForm(profile);
            } catch {
              // Silently fail - use auth context data instead
            }
          })();
        });
      }
    }

    void loadUserProfile();
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [isLoggedIn, isLoading, user?.id, setValue]);
}

