import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { Button } from '../../components/atoms'
import { Alert, LoadingState } from '../../components/feedback'
import { Card, FormGroup } from '../../components/molecules'
import { useTenantSession } from '../../contexts/useTenantSession'
import { tenantAuthService } from '../../services/tenant/authService'
import { tenantResolverService } from '../../services/tenant/tenantResolverService'
import { savedTenantStore } from '../../services/tenant/savedTenantStore'
import type { TenantDetail } from '../../dataobjects/tenant/tenant'

export function SsoLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setSession, setTenantResolution } = useTenantSession()
  const tenantCode = searchParams.get('tenantCode')?.trim() ?? ''
  const token = searchParams.get('token')?.trim() ?? ''
  const [error, setError] = useState<string | null>(() => (
    !tenantCode || !token ? 'SSO link is missing tenant code or token.' : null
  ))
  const hasConsumed = useRef(false)

  useEffect(() => {
    if (hasConsumed.current) {
      return
    }

    hasConsumed.current = true

    if (!tenantCode || !token) {
      return
    }

    tenantAuthService.consumeSso({
      tenant_code: tenantCode,
      token,
    })
      .then(async (session) => {
        const tenantResponse = await tenantResolverService.resolveByCode(session.tenant_code)

        savedTenantStore.saveTenantProfile(tenantResponse)
        savedTenantStore.setActiveTenantCode(tenantResponse.code)

        setTenantResolution({
          status: 'resolved',
          subdomain: tenantResponse.subdomain ?? null,
          tenant: tenantResponse,
          error: null,
        })

        setSession(session)
        navigate(resolveLandingPath(tenantResponse), { replace: true })
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : 'Unable to complete SSO login.')
      })
  }, [navigate, setSession, setTenantResolution, tenantCode, token])

  return (
    <Card title="Opening tenant workspace" description="Verifying your platform sign-in link.">
      <FormGroup columns={1}>
        {error ? (
          <>
            <Alert message={error} title="SSO login failed" tone="danger" />
            <Button onClick={() => navigate(routePaths.login, { replace: true })} variant="primary">
              Back to login
            </Button>
          </>
        ) : (
          <LoadingState rows={3} />
        )}
      </FormGroup>
    </Card>
  )
}

function resolveLandingPath(tenant: TenantDetail) {
  const candidates = [
    ['dashboard', routePaths.dashboard],
    ['accounting_management', routePaths.accounting],
    ['expense_management', routePaths.expenses],
    ['capital_management', routePaths.capitals],
    ['debt_management', routePaths.debts],
    ['customer_management', routePaths.customers],
    ['collateral_management', routePaths.collateral],
    ['loan_contract_management', routePaths.slips],
    ['tenant_user_management', routePaths.staff],
  ] as const

  return candidates.find(([featureCode]) => {
    const feature = tenant.tenant_features[featureCode]
    return feature?.is_active && feature.is_enabled
  })?.[1] ?? routePaths.profile
}
