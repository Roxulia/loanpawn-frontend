import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { Card } from '../../components/molecules'
import { useTenantSession } from '../../contexts/useTenantSession'
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
    return (
      <section className="page">
        <Card title="Access denied" description="Your account does not have permission to open this workspace.">
          <div className="status-pill">Permission required</div>
        </Card>
      </section>
    )
  }

  return children
}
