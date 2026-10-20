/** Paths of the Identity service (login and register live in core/auth). The /api prefix is added by ApiService. */
export const IDENTITY_API = {
  users: '/users',
  roles: '/roles',
  rolePermissions: '/roles/permissions',
  audit: '/audit/identity',
  auditUsers: '/audit/identity/users'
} as const;
