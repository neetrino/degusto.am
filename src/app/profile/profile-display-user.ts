import type { UserProfile } from './types';

export type ProfileAuthShellUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

/**
 * Uses full profile when loaded; falls back to verified auth cookie user for header/shell only.
 */
export function resolveProfileDisplayUser(
  profile: UserProfile | null,
  authUser: ProfileAuthShellUser | null | undefined
): UserProfile | null {
  if (profile) {
    return profile;
  }

  if (!authUser?.id) {
    return null;
  }

  return {
    id: authUser.id,
    email: authUser.email ?? undefined,
    phone: authUser.phone ?? undefined,
    firstName: authUser.firstName ?? undefined,
    lastName: authUser.lastName ?? undefined,
  };
}
