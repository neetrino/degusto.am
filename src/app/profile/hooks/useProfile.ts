import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useTranslation } from '../../../lib/i18n-client';
import type { UserProfile } from '../types';
import {
  fetchUserProfileCached,
  getCachedUserProfileSync,
} from '@/lib/users/fetch-user-profile';
import { logger } from '@/lib/utils/logger';

function authUserToProfile(user: {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}): UserProfile {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

export function useProfile() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, user: authUser } = useAuth();
  const { t } = useTranslation();

  const initialProfile = getCachedUserProfileSync() ?? (authUser ? authUserToProfile(authUser) : null);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [loading, setLoading] = useState(initialProfile === null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/profile');
    }
  }, [isLoggedIn, authLoading, router]);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchUserProfileCached();
      setProfile(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error loading profile', { error: err });
      setError(errorMessage || t('profile.personal.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isLoggedIn && !authLoading) {
      void loadProfile();
    }
  }, [isLoggedIn, authLoading, loadProfile]);

  useEffect(() => {
    if (!authUser || profile?.id === authUser.id) {
      return;
    }
    setProfile((current) => current ?? authUserToProfile(authUser));
  }, [authUser, profile?.id]);

  return {
    profile,
    setProfile,
    loading,
    error,
    success,
    setError,
    setSuccess,
    loadProfile,
    isLoggedIn,
    authLoading,
  };
}
