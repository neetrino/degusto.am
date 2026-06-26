import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { fetchUserProfileCached } from '@/lib/users/user-profile-client';
import { useTranslation } from '../../../lib/i18n-client';
import type { UserProfile } from '../types';

export function useProfile() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, user: authUser } = useAuth();
  const { t } = useTranslation();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const hasLoadedProfileRef = useRef(false);

  useEffect(() => {
    if (profile) {
      hasLoadedProfileRef.current = true;
    }
  }, [profile]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      setLoading(false);
      router.push('/login?redirect=/profile');
    }
  }, [isLoggedIn, authLoading, router]);

  const loadProfile = useCallback(async (options?: { force?: boolean }) => {
    try {
      if (!hasLoadedProfileRef.current) {
        setLoading(true);
      }
      setError(null);
      const data = await fetchUserProfileCached<UserProfile>(options);
      setProfile(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error loading profile:', err);
      setError(errorMessage || t('profile.personal.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load profile data
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      return;
    }
    if (isLoggedIn && !authLoading) {
      void loadProfile();
    }
  }, [isLoggedIn, authLoading, loadProfile]);

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
    authUser,
  };
}




