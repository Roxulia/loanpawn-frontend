import { useContext } from 'react'
import { TenantSessionContext } from './tenantSession'

export function useTenantSession() {
  const context = useContext(TenantSessionContext)

  if (!context) {
    throw new Error('useTenantSession must be used inside TenantSessionProvider')
  }

  return context
}
