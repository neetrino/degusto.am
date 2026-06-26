import { useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import {
  fetchUserProfileCached,
  getUserProfileInflight,
  peekUserProfileCached,
  type UserProfileWithAddressesPayload,
} from '../../../lib/users/user-profile-client';
import { useAuth } from '../../../lib/auth/AuthContext';
import type { CheckoutFormData } from '../types';

function applyProfileToCheckoutForm(
  profile: UserProfileWithAddressesPayload,
  userPhone: string | undefined,
  setValue: UseFormSetValue<CheckoutFormData>
): void {
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

  if (!profile.addresses || profile.addresses.length === 0) {
    return;
  }

  const defaultAddress =
    profile.addresses.find((addr) => addr.isDefault) ?? profile.addresses[0];

  if (!defaultAddress) {
    return;
  }

  if (!profile.phone && !userPhone && defaultAddress.phone) {
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

function isFullProfileForUser(
  profile: UserProfileWithAddressesPayload | null | undefined,
  userId: string | undefined
): profile is UserProfileWithAddressesPayload {
  return Boolean(userId) && profile?.id === userId && Array.isArray(profile?.addresses);
}

export function useUserProfile(
  isLoggedIn: boolean,
  isLoading: boolean,
  setValue: UseFormSetValue<CheckoutFormData>
) {
  const { user } = useAuth();

  useEffect(() => {
    async function loadUserProfile() {
      if (isLoading) {
        return;
      }

      if (!isLoggedIn) {
        return;
      }

      if (user) {
        applyProfileToCheckoutForm(
          {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          user.phone,
          setValue
        );
      }

      const cached = peekUserProfileCached<UserProfileWithAddressesPayload>();
      if (isFullProfileForUser(cached, user?.id)) {
        applyProfileToCheckoutForm(cached, user?.phone, setValue);
        return;
      }

      const inflight = getUserProfileInflight<UserProfileWithAddressesPayload>();
      if (inflight) {
        try {
          const profile = await inflight;
          if (isFullProfileForUser(profile, user?.id)) {
            applyProfileToCheckoutForm(profile, user?.phone, setValue);
            return;
          }
        } catch {
          // Fall through to cached fetch below.
        }
      }

      try {
        const profile = await fetchUserProfileCached<UserProfileWithAddressesPayload>();
        applyProfileToCheckoutForm(profile, user?.phone, setValue);
      } catch {
        // Silently fail - use auth context data instead
      }
    }

    void loadUserProfile();
  }, [isLoggedIn, isLoading, user?.id, user?.phone, setValue]);
}
