import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { TenantResolveErrorPage } from '../../pages/auth/TenantResolveErrorPage'
import { TenantResolveLoadingPage } from '../../pages/auth/TenantResolveLoadingPage'
import { savedTenantStore } from '../../services/tenant/savedTenantStore'
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
      const activeTenantCode = savedTenantStore.getActiveTenantCode()

      setAuthStatus('unauthenticated')
      setCurrentUser(null)
      setSession(null)

      if (!activeTenantCode) {
        setTenantResolution({
          status: 'idle',
          subdomain: null,
          tenant: null,
          error: null,
        })
        return
      }

      setTenantResolution({
        status: 'loading',
        subdomain: null,
        tenant: null,
        error: null,
      })

      tenantResolverService
        .resolveByCode(activeTenantCode)
        .then((tenant) => {
          savedTenantStore.saveTenantProfile(tenant)
          savedTenantStore.setActiveTenantCode(tenant.code)
          setTenantResolution({
            status: 'resolved',
            subdomain: null,
            tenant,
            error: null,
          })
        })
        .catch(() => {
          savedTenantStore.clearActiveTenantCode()
          setTenantResolution({
            status: 'idle',
            subdomain: null,
            tenant: null,
            error: null,
          })
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
        savedTenantStore.saveTenantProfile(tenant)
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
