'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '../api-client';
import { clearAuthSession } from '../api-client/auth-utils';
import {
  clearLegacyAuthLocalStorage,
  getAuthUserFromClientCookie,
  setAuthUserClientCookie,
  type AuthCookieUser,
} from '@/lib/auth/auth-cookies';
import { fetchUserProfileCached } from '@/lib/users/fetch-user-profile';
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
  roles: string[];
  login: (_identifier: string, _password: string) => Promise<User>;
  register: (_data: RegisterData) => Promise<void>;
  logout: () => void;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const MISSING_AUTH_PROVIDER_ERROR = 'useAuth must be used within an AuthProvider';

const AUTH_CONTEXT_FALLBACK: AuthContextType = {
  user: null,
  token: null,
  isLoggedIn: false,
  isLoading: false,
  isAdmin: false,
  roles: [],
  login: async () => {
    throw new Error(MISSING_AUTH_PROVIDER_ERROR);
  },
  register: async () => {
    throw new Error(MISSING_AUTH_PROVIDER_ERROR);
  },
  logout: () => {},
};

/**
 * Auth Provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const hydrateRolesIfMissing = async (candidate: User): Promise<User> => {
    const hasRoles = Array.isArray(candidate.roles) && candidate.roles.length > 0;
    if (hasRoles) {
      return candidate;
    }

    logger.debug('⚠️ [AUTH] User missing roles, fetching from API...');
    try {
      const profileData = await fetchUserProfileCached();
      const roles = (profileData as User & { roles?: string[] }).roles;
      if (Array.isArray(roles)) {
        const updatedUser: User = { ...candidate, roles };
        setAuthUserClientCookie(updatedUser as AuthCookieUser);
        logger.debug('✅ [AUTH] Roles updated from API:', roles);
        return updatedUser;
      }
    } catch (fetchError) {
      console.error('❌ [AUTH] Failed to fetch user roles:', fetchError);
    }

    return candidate;
  };

  useEffect(() => {
    logger.debug('🔐 [AUTH] Loading auth state from cookies...');

    const loadAuthState = async () => {
      try {
        clearLegacyAuthLocalStorage();
        const storedUser = getAuthUserFromClientCookie();

        if (storedUser) {
          logger.debug('✅ [AUTH] Found stored auth data');
          const parsedUser = storedUser as User;
          const hydratedUser = await hydrateRolesIfMissing(parsedUser);
          setUser(hydratedUser);
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

  const login = async (identifier: string, password: string): Promise<User> => {
    logger.debug('🔐 [AUTH] Login attempt:', { identifier: identifier ? 'provided' : 'not provided', password: password ? 'provided' : 'not provided' });

    try {
      setIsLoading(true);

      const requestData = { identifier, password };

      logger.debug('📤 [AUTH] Sending login request to API...');
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', requestData, {
        skipAuth: true,
      });

      logger.debug('✅ [AUTH] Login successful:', {
        userId: response.user.id,
        roles: response.user.roles,
        isAdmin: response.user.roles?.includes('admin'),
      });

      setAuthUserClientCookie(response.user as AuthCookieUser);
      setUser(response.user);

      window.dispatchEvent(new Event('auth-updated'));

      return response.user;
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
              errorMessage = 'Password must be at least 6 characters';
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

  const logout = () => {
    logger.debug('🔐 [AUTH] Logging out...');

    void clearAuthSession();

    setUser(null);

    window.dispatchEvent(new Event('auth-updated'));

    router.push('/');
  };

  const roles = user && Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = roles.includes('admin');

  useEffect(() => {
    if (!user) {
      return;
    }
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const userIsAdmin = userRoles.includes('admin');

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
    roles,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  const hasWarnedMissingAuthProviderRef = useRef(false);
  useEffect(() => {
    if (context !== undefined || hasWarnedMissingAuthProviderRef.current) {
      return;
    }
    hasWarnedMissingAuthProviderRef.current = true;
    logger.warn('⚠️ [AUTH] AuthProvider is missing in render tree; using guest auth fallback state');
  }, [context]);

  if (context === undefined) {
    return AUTH_CONTEXT_FALLBACK;
  }
  return context;
}
