'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { ToastContainer } from './Toast';
import { LanguageHtmlUpdater } from './LanguageHtmlUpdater';

/**
 * ClientProviders component
 * Wraps the app with all client-side providers (Auth, Theme, etc.)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LanguageHtmlUpdater />
      {children}
      <ToastContainer />
    </AuthProvider>
  );
}
