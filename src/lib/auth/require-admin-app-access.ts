import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth/auth-cookies';
import { authenticateTokenValue } from '@/lib/auth/authenticate-token-value';
import { userHasAdminRole } from '@/lib/auth/user-roles.constants';

/**
 * Server-side guard for `/supersudo` and `/admin-mobile` layouts.
 * Redirects unauthenticated users to login and non-admins to home.
 */
export async function requireAdminAppAccess(pathname: string): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? null;
  const user = await authenticateTokenValue(token);

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  if (!userHasAdminRole(user.roles)) {
    redirect('/');
  }
}
