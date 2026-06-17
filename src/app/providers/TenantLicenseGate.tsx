import type { ReactNode } from 'react'
import { LoadingState } from '../../components/feedback'
import { Card } from '../../components/molecules'
import { useTenantSession } from '../../contexts/useTenantSession'
import { TenantLicenseExpiredPage } from '../../pages/auth/TenantLicenseExpiredPage'

export function TenantLicenseGate({ children }: { children: ReactNode }) {
  const { authStatus, tenantResolution } = useTenantSession()
  const isExpired =
    tenantResolution.status === 'resolved' &&
    tenantResolution.tenant.tenant_license.status === 'expired'

  if (!isExpired) {
    return children
  }

  if (authStatus === 'checking') {
    return (
      <main className="auth-shell">
        <Card title="Checking session" description="Verifying your tenant access with the server.">
          <LoadingState rows={3} />
        </Card>
      </main>
    )
  }

  return <TenantLicenseExpiredPage />
}
