import { useTenantSession } from '../../contexts/useTenantSession'
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  type PermissionCode,
} from './permissionCodes'

export function usePermissions() {
  const { currentUser } = useTenantSession()

  return {
    currentUser,
    hasPermission: (permission: PermissionCode) => hasPermission(currentUser, permission),
    hasAnyPermission: (permissions: PermissionCode[]) => hasAnyPermission(currentUser, permissions),
    hasAllPermissions: (permissions: PermissionCode[]) => hasAllPermissions(currentUser, permissions),
  }
}
