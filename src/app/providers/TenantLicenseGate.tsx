import type { ReactNode } from 'react'
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

  if (authStatus !== 'authenticated') {
    return children
  }

  return <TenantLicenseExpiredPage />
}
