import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { TenantResolveErrorPage } from '../../pages/auth/TenantResolveErrorPage'
import { TenantResolveLoadingPage } from '../../pages/auth/TenantResolveLoadingPage'
import { tenantAuthService } from '../../services/tenant/authService'
import { tenantResolverService } from '../../services/tenant/tenantResolverService'
import { useTenantSession } from '../../contexts/useTenantSession'
import { getTenantSubdomainFromHost } from '../routes/subdomain'
import { routePaths } from '../routes/paths'

export function TenantResolverGate({ children }: { children: ReactNode }) {
  const {
    tenantResolution,
    setAuthStatus,
    setCurrentUser,
    setSession,
    setTenantResolution,
  } = useTenantSession()
  const hasResolved = useRef(false)
  const [isClearingPublicAuthRoute, setIsClearingPublicAuthRoute] = useState(false)

  const host = window.location.host
  const routePath = window.location.pathname
  const subdomain = useMemo(() => getTenantSubdomainFromHost(host), [host])
  const isPublicAuthRoute =
    !subdomain && (routePath === routePaths.login || routePath === routePaths.sso)

  useEffect(() => {
    if (hasResolved.current) {
      return
    }

    hasResolved.current = true

    if (isPublicAuthRoute) {
      setIsClearingPublicAuthRoute(true)
      setAuthStatus('unauthenticated')
      setCurrentUser(null)
      setSession(null)
      setTenantResolution({
        status: 'idle',
        subdomain: null,
        tenant: null,
        error: null,
      })

      tenantAuthService.logout()
        .catch(() => {
          // Missing or stale auth cookies should not block a fresh login or SSO attempt.
        })
        .finally(() => {
          setIsClearingPublicAuthRoute(false)
        })
      return
    }

    setTenantResolution({
      status: 'loading',
      subdomain,
      tenant: null,
      error: null,
    })
    tenantResolverService
      .resolveTenant()
      .then((tenant) => {
        setTenantResolution({
          status: 'resolved',
          subdomain,
          tenant,
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (!subdomain) {
          setTenantResolution({
            status: 'idle',
            subdomain: null,
            tenant: null,
            error: null,
          })
          return
        }

        setTenantResolution({
          status: 'failed',
          subdomain,
          tenant: null,
          error: error instanceof Error ? error.message : 'Tenant could not be resolved.',
        })
      })
  }, [
    host,
    isPublicAuthRoute,
    routePath,
    setAuthStatus,
    setCurrentUser,
    setSession,
    setTenantResolution,
    subdomain,
    tenantResolution.status,
  ])

  if (isClearingPublicAuthRoute) {
    return <TenantResolveLoadingPage subdomain={null} />
  }

  if (!hasResolved.current && tenantResolution.status === 'idle') {
    return <TenantResolveLoadingPage subdomain={subdomain} />
  }

  if (subdomain && tenantResolution.status === 'idle') {
    return <TenantResolveLoadingPage subdomain={subdomain} />
  }

  if (tenantResolution.status === 'loading') {
    return <TenantResolveLoadingPage subdomain={tenantResolution.subdomain} />
  }

  if (tenantResolution.status === 'failed') {
    return (
      <TenantResolveErrorPage
        error={tenantResolution.error}
        subdomain={tenantResolution.subdomain}
      />
    )
  }

  return children
}
