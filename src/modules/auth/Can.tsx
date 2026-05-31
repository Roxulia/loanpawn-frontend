import type { ReactNode } from 'react'
import type { PermissionCode } from './permissionCodes'
import { usePermissions } from './usePermissions'

export function Can({
  all,
  any,
  children,
  fallback = null,
  permission,
}: {
  all?: PermissionCode[]
  any?: PermissionCode[]
  children: ReactNode
  fallback?: ReactNode
  permission?: PermissionCode
}) {
  const permissions = usePermissions()
  const allowed = permission
    ? permissions.hasPermission(permission)
    : any
      ? permissions.hasAnyPermission(any)
      : all
        ? permissions.hasAllPermissions(all)
        : false

  return allowed ? children : fallback
}
