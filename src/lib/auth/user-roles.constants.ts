export const USER_ROLE_CUSTOMER = 'customer' as const;
export const USER_ROLE_ADMIN = 'admin' as const;

export const ALLOWED_USER_ROLES = [USER_ROLE_CUSTOMER, USER_ROLE_ADMIN] as const;

export type AllowedUserRole = (typeof ALLOWED_USER_ROLES)[number];

/** Returns true when the user has the admin role. */
export function userHasAdminRole(roles: string[] | null | undefined): boolean {
  return Array.isArray(roles) && roles.includes(USER_ROLE_ADMIN);
}

/** Normalizes and validates role strings against the allowlist. */
export function normalizeAllowedUserRoles(roles: string[]): AllowedUserRole[] {
  const unique = [...new Set(roles.map((role) => role.trim()).filter(Boolean))];
  const invalid = unique.filter(
    (role) => !ALLOWED_USER_ROLES.includes(role as AllowedUserRole),
  );
  if (invalid.length > 0) {
    throw new Error(`Invalid roles: ${invalid.join(', ')}`);
  }
  if (unique.length === 0) {
    throw new Error('At least one role is required');
  }
  return unique as AllowedUserRole[];
}
