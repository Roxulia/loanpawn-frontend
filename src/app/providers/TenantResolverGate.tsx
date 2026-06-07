import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { TenantResolveErrorPage } from '../../pages/auth/TenantResolveErrorPage'
import { TenantResolveLoadingPage } from '../../pages/auth/TenantResolveLoadingPage'
import { tenantResolverService } from '../../services/tenant/tenantResolverService'
import { useTenantSession } from '../../contexts/useTenantSession'
import { getTenantSubdomainFromHost } from '../routes/subdomain'

const publicAppAuthPaths = new Set(['/login', '/sso'])

export function TenantResolverGate({ children }: { children: ReactNode }) {
  const { tenantResolution, setTenantResolution } = useTenantSession()
  const hasResolved = useRef(false)

  const host = window.location.host
  const routePath = window.location.pathname
  const subdomain = useMemo(() => getTenantSubdomainFromHost(host), [host])

  useEffect(() => {
    if (hasResolved.current) {
      return
    }

    hasResolved.current = true

    if (!subdomain && publicAppAuthPaths.has(routePath)) {
      if (tenantResolution.status !== 'resolved') {
        setTenantResolution({
          status: 'idle',
          subdomain: null,
          tenant: null,
          error: null,
        })
      }
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
        setTenantResolution({
          status: 'failed',
          subdomain,
          tenant: null,
          error: error instanceof Error ? error.message : 'Tenant could not be resolved.',
        })
      })
  }, [host, routePath, setTenantResolution, subdomain, tenantResolution.status])

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
