import { AdminRole } from './mongodb';

// Check if user has required role
export function hasRole(
  userRole: AdminRole,
  requiredRoles: AdminRole[]
): boolean {
  return requiredRoles.includes(userRole);
}

// Role hierarchy check for feature access
export function canAccess(userRole: AdminRole, feature: string): boolean {
  const permissions: Record<string, AdminRole[]> = {
    dashboard: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
    clients: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
    services: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
    domains: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
    support: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'],
    billing: ['SUPER_ADMIN', 'ADMIN'],
    settings: ['SUPER_ADMIN'],
    staff: ['SUPER_ADMIN'],
  };

  return permissions[feature]?.includes(userRole) ?? false;
}
