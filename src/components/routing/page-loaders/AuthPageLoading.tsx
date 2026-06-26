'use client';

import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthFormWrapper } from '@/components/auth/auth-form-ui';

const AUTH_SKELETON_CLASS = 'animate-pulse bg-[#f2dec7]';

type AuthPageLoadingProps = {
  ariaLabel?: string;
};

/** Login / register / password recovery — orange auth shell skeleton. */
export function AuthPageLoading({ ariaLabel = 'Loading' }: AuthPageLoadingProps) {
  return (
    <AuthPageShell contentMaxWidthClass="max-w-[520px]">
      <AuthFormWrapper>
        <div aria-busy="true" aria-label={ariaLabel}>
          <div className="animate-pulse">
            <div className={`mx-auto mb-4 h-16 w-16 rounded-full ${AUTH_SKELETON_CLASS}`} />
            <div className={`mx-auto mb-3 h-8 w-3/4 rounded ${AUTH_SKELETON_CLASS}`} />
            <div className={`mx-auto mb-8 h-4 w-1/2 rounded ${AUTH_SKELETON_CLASS}`} />
            <div className="space-y-5">
              <div className={`h-12 rounded-2xl ${AUTH_SKELETON_CLASS}`} />
              <div className={`h-12 rounded-2xl ${AUTH_SKELETON_CLASS}`} />
              <div className={`h-12 rounded-2xl ${AUTH_SKELETON_CLASS}`} />
            </div>
          </div>
        </div>
      </AuthFormWrapper>
    </AuthPageShell>
  );
}
