import { useEffect, useRef, type ReactNode } from 'react'
import { tenantAuthService } from '../../services/tenant/authService'
import { useTenantSession } from '../../contexts/useTenantSession'

export function AuthenticationGate({ children }: { children: ReactNode }) {
  const {
    setAuthStatus,
    setCurrentUser,
    setSession,
    tenantResolution,
  } = useTenantSession()
  const checkedKey = useRef<string | null>(null)

  useEffect(() => {
    const tenantKey =
      tenantResolution.status === 'resolved'
        ? `tenant:${tenantResolution.tenant.code}`
        : 'public-app'

    if (checkedKey.current === tenantKey) {
      return
    }

    checkedKey.current = tenantKey
    setAuthStatus('checking')

    tenantAuthService
      .me()
      .then((user) => {
        setCurrentUser(user)
        setAuthStatus('authenticated')
      })
      .catch(() => {
        setSession(null)
      })
  }, [setAuthStatus, setCurrentUser, setSession, tenantResolution])

  return children
}
