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
    async function loadUserProfile() {
      if (isLoading) {
        return;
      }

      if (isLoggedIn) {
        if (user) {
          if (user.firstName) {
            setValue('firstName', user.firstName);
          }
          if (user.lastName) {
            setValue('lastName', user.lastName);
          }
          if (user.email) {
            setValue('email', user.email);
          }
          if (user.phone) {
            setValue('phone', user.phone);
          }
        }
        
        try {
          const profile = await fetchUserProfileCached();
          
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
            const defaultAddress = profile.addresses.find(addr => addr.isDefault) || profile.addresses[0];
            
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
        } catch {
          // Silently fail - use auth context data instead
        }
      }
    }
    
    loadUserProfile();
  }, [isLoggedIn, isLoading, user?.id, setValue]);
}

