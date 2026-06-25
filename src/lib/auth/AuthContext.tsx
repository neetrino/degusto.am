'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '../api-client';
import { invalidateAdminReadCache } from '@/lib/admin/admin-read-cache';
import { fetchUserProfileCached, invalidateUserProfileCache } from '@/lib/users/user-profile-client';
import { clearAuthSession } from '../api-client/auth-utils';
import {
  clearLegacyAuthLocalStorage,
  getAuthUserFromClientCookie,
  setAuthUserClientCookie,
  type AuthCookieUser,
} from '@/lib/auth/auth-cookies';
import { userHasAdminRole } from '@/lib/auth/user-roles.constants';
import { logger } from "@/lib/utils/logger";

/**
 * User interface
 */
interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export type LoginResult =
  | { kind: 'authenticated'; user: User }
  | { kind: 'mfa_required' };

/**
 * Auth Context interface
 */
interface AuthContextType {
  user: User | null;
  /** Always null on client — JWT is HttpOnly in cookies */
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  mfaEnabled: boolean;
  roles: string[];
  login: (_identifier: string, _password: string) => Promise<LoginResult>;
  verifyMfaLogin: (_mfaToken: string, _code: string) => Promise<User>;
  completePasswordReset: (_password: string) => Promise<LoginResult>;
  register: (_data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

/**
 * Register data interface
 */
interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Auth response from API (token is set via HttpOnly cookie)
 */
interface AuthResponse {
  user: User;
}

interface MfaRequiredResponse {
  requiresMfa: true;
  mfaToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const verifyUserFromApi = async (candidate: User): Promise<User | null> => {
    try {
      const profileData = await fetchUserProfileCached();

      if (!profileData?.id || profileData.id !== candidate.id) {
        return null;
      }

      const verifiedUser: User = {
        id: profileData.id,
        email: profileData.email ?? candidate.email,
        phone: profileData.phone ?? candidate.phone,
        firstName: profileData.firstName ?? candidate.firstName,
        lastName: profileData.lastName ?? candidate.lastName,
        roles: Array.isArray(profileData.roles) ? profileData.roles : [],
      };
      setMfaEnabled(Boolean(profileData.mfaEnabled));
      setAuthUserClientCookie(verifiedUser as AuthCookieUser);
      logger.debug('✅ [AUTH] Session verified from API:', {
        userId: verifiedUser.id,
        roles: verifiedUser.roles,
      });
      return verifiedUser;
    } catch (fetchError) {
      logger.warn('⚠️ [AUTH] Failed to verify session from API', { fetchError });
      return null;
    }
  };

  useEffect(() => {
    logger.debug('🔐 [AUTH] Loading auth state from cookies...');

    const loadAuthState = async () => {
      try {
        clearLegacyAuthLocalStorage();
        const storedUser = getAuthUserFromClientCookie();

        if (storedUser) {
          logger.debug('✅ [AUTH] Found stored auth data — verifying with API...');
          const parsedUser = storedUser as User;
          const verifiedUser = await verifyUserFromApi(parsedUser);
          if (verifiedUser) {
            setUser(verifiedUser);
          } else {
            await clearAuthSession();
          }
        } else {
          logger.debug('ℹ️ [AUTH] No stored auth data found');
        }
      } catch (error) {
        console.error('❌ [AUTH] Error loading auth state:', error);
        void clearAuthSession();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (identifier: string, password: string): Promise<LoginResult> => {
    logger.debug('🔐 [AUTH] Login attempt:', { identifier: identifier ? 'provided' : 'not provided', password: password ? 'provided' : 'not provided' });

    try {
      setIsLoading(true);

      const requestData = { identifier, password };

      logger.debug('📤 [AUTH] Sending login request to API...');
      const response = await apiClient.post<AuthResponse | MfaRequiredResponse>(
        '/api/v1/auth/login',
        requestData,
        { skipAuth: true },
      );

      if ('requiresMfa' in response && response.requiresMfa) {
        sessionStorage.setItem('degusto_mfa_challenge_token', response.mfaToken);
        return { kind: 'mfa_required' };
      }

      const authResponse = response as AuthResponse;

      logger.debug('✅ [AUTH] Login successful:', {
        userId: authResponse.user.id,
        roles: authResponse.user.roles,
        isAdmin: authResponse.user.roles?.includes('admin'),
      });

      setAuthUserClientCookie(authResponse.user as AuthCookieUser);
      setUser(authResponse.user);

      window.dispatchEvent(new Event('auth-updated'));

      return { kind: 'authenticated', user: authResponse.user };
    } catch (error: unknown) {
      console.error('❌ [AUTH] Login error:', error);

      let errorMessage = 'Login failed. Please try again.';

      if (error instanceof ApiError) {
        if (error.status === 401) {
          errorMessage = error.message || 'Invalid email/phone or password';
        } else if (error.status === 403) {
          errorMessage = error.message || 'Your account has been blocked';
        } else if (error.status === 400) {
          errorMessage = error.message || 'Please provide email/phone and password';
        } else {
          errorMessage = error.message || errorMessage;
        }
      } else if (error && typeof error === 'object' && 'status' in error) {
        const apiErr = error as { status?: number; message?: string };
        if (apiErr.status === 401) {
          errorMessage = apiErr.message || 'Invalid email/phone or password';
        } else if (apiErr.status === 403) {
          errorMessage = apiErr.message || 'Your account has been blocked';
        } else if (apiErr.status === 400) {
          errorMessage = apiErr.message || 'Please provide email/phone and password';
        } else if (apiErr.message) {
          errorMessage = apiErr.message;
        }
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfaLogin = async (mfaToken: string, code: string): Promise<User> => {
    const response = await apiClient.post<AuthResponse>(
      '/api/v1/auth/mfa/verify',
      { mfaToken, code },
      { skipAuth: true },
    );
    setAuthUserClientCookie(response.user as AuthCookieUser);
    setUser(response.user);
    window.dispatchEvent(new Event('auth-updated'));
    return response.user;
  };

  const completePasswordReset = async (password: string): Promise<LoginResult> => {
    const response = await apiClient.post<AuthResponse | MfaRequiredResponse>(
      '/api/v1/auth/reset-password',
      { password },
      { skipAuth: true },
    );

    if ('requiresMfa' in response && response.requiresMfa) {
      sessionStorage.setItem('degusto_mfa_challenge_token', response.mfaToken);
      return { kind: 'mfa_required' };
    }

    const authResponse = response as AuthResponse;
    setAuthUserClientCookie(authResponse.user as AuthCookieUser);
    setUser(authResponse.user);
    window.dispatchEvent(new Event('auth-updated'));
    return { kind: 'authenticated', user: authResponse.user };
  };

  const register = async (data: RegisterData) => {
    logger.debug('🔐 [AUTH] Registration attempt:', {
      email: data.email || 'not provided',
      phone: data.phone || 'not provided',
      hasFirstName: !!data.firstName,
      hasLastName: !!data.lastName,
    });

    try {
      setIsLoading(true);

      logger.debug('📤 [AUTH] Sending registration request to API...', { data });
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', data, {
        skipAuth: true,
      });

      logger.debug('✅ [AUTH] Registration response received:', response);

      if (!response?.user) {
        console.error('❌ [AUTH] Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      logger.debug('✅ [AUTH] Registration successful:', { userId: response.user.id });

      setAuthUserClientCookie(response.user as AuthCookieUser);
      setUser(response.user);

      window.dispatchEvent(new Event('auth-updated'));

      logger.debug('🔄 [AUTH] Redirecting to home page...');
      router.push('/');
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        logger.debug('ℹ️ [AUTH] Registration conflict: user already exists');
      } else {
        logger.warn('⚠️ [AUTH] Registration request failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      let errorMessage = 'Registration failed. Please try again.';

      if (error instanceof Error && error.message) {
        const errWithData = error as Error & { data?: { detail?: string; message?: string } };
        if (errWithData.data?.detail) {
          errorMessage = errWithData.data.detail;
        } else if (errWithData.data?.message) {
          errorMessage = errWithData.data.message;
        } else {
          const errorText = error.message;
          if (errorText.includes('409') || errorText.includes('already exists') || errorText.includes('User already exists')) {
            errorMessage = 'User with this email or phone already exists';
          } else if (errorText.includes('400') || errorText.includes('Validation failed')) {
            if (errorText.includes('password') || errorText.includes('Password')) {
              errorMessage = `Password must be at least 8 characters`;
            } else if (errorText.includes('email') || errorText.includes('phone')) {
              errorMessage = 'Please provide email or phone and password';
            } else {
              errorMessage = 'Invalid registration data. Please check your input.';
            }
          } else if (errorText.includes('500') || errorText.includes('Internal Server Error')) {
            errorMessage = 'Server error. Please try again later.';
          } else if (errorText.includes('Failed to parse')) {
            errorMessage = 'Invalid response from server. Please try again.';
          } else {
            const match = errorText.match(/detail[:\s]+([^,\n]+)/i);
            if (match) {
              errorMessage = match[1].trim();
            }
          }
        }
      }

      logger.debug('ℹ️ [AUTH] Registration error message resolved', { errorMessage });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const profileData = await fetchUserProfileCached({ force: true });
      setMfaEnabled(Boolean(profileData.mfaEnabled));
      setUser((currentUser) => {
        if (!currentUser || profileData.id !== currentUser.id) {
          return currentUser;
        }
        const updatedUser: User = {
          ...currentUser,
          email: profileData.email ?? currentUser.email,
          phone: profileData.phone ?? currentUser.phone,
          firstName: profileData.firstName ?? currentUser.firstName,
          lastName: profileData.lastName ?? currentUser.lastName,
          roles: Array.isArray(profileData.roles) ? profileData.roles : currentUser.roles,
        };
        setAuthUserClientCookie(updatedUser as AuthCookieUser);
        return updatedUser;
      });
    } catch (fetchError) {
      logger.warn('⚠️ [AUTH] Failed to refresh profile', { fetchError });
      setMfaEnabled(false);
    }
  }, []);

  const logout = () => {
    logger.debug('🔐 [AUTH] Logging out...');

    void clearAuthSession();
    invalidateUserProfileCache();
    invalidateAdminReadCache();

    setUser(null);
    setMfaEnabled(false);

    window.dispatchEvent(new Event('auth-updated'));

    router.push('/');
  };

  const roles = user && Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = userHasAdminRole(roles);

  useEffect(() => {
    if (!user) {
      return;
    }
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const userIsAdmin = userHasAdminRole(userRoles);

    logger.debug('🔍 [AUTH] User state updated:', {
      userId: user.id,
      roles: user.roles,
      rolesArray: userRoles,
      isAdmin: userIsAdmin,
      rolesType: typeof user.roles,
      rolesIsArray: Array.isArray(user.roles),
    });
  }, [user]);

  const value: AuthContextType = {
    user,
    token: null,
    isLoggedIn: !!user,
    isLoading,
    isAdmin,
    mfaEnabled,
    roles,
    login,
    verifyMfaLogin,
    completePasswordReset,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
