import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { useTenantSession } from '../../contexts/useTenantSession'
import { UnauthorizedPage } from '../../pages/UnauthorizedPage'
import type { PermissionCode } from './permissionCodes'
import { usePermissions } from './usePermissions'

export function PermissionRoute({
  any,
  children,
  permission,
}: {
  any?: PermissionCode[]
  children: ReactNode
  permission?: PermissionCode
}) {
  const location = useLocation()
  const { authStatus, isAuthenticated } = useTenantSession()
  const permissions = usePermissions()

  if (authStatus !== 'checking' && !isAuthenticated) {
    return <Navigate to={routePaths.login} replace state={{ from: location }} />
  }

  const allowed = permission
    ? permissions.hasPermission(permission)
    : any
      ? permissions.hasAnyPermission(any)
      : false

  if (!allowed) {
    return <UnauthorizedPage />
  }

  return children
}
