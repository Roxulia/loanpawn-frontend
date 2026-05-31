import { Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { routePaths } from './paths'
import { LoadingState } from '../../components/feedback'
import { Card } from '../../components/molecules'
import { useTenantSession } from '../../contexts/useTenantSession'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { authStatus, isAuthenticated } = useTenantSession()

  if (authStatus === 'checking') {
    return (
      <main className="auth-shell">
        <Card title="Checking session" description="Verifying your tenant access with the server.">
          <LoadingState rows={3} />
        </Card>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={routePaths.login} replace state={{ from: location }} />
  }

  return children
}
