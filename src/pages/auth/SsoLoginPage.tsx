import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { Button } from '../../components/atoms'
import { Alert, LoadingState } from '../../components/feedback'
import { Card, FormGroup } from '../../components/molecules'
import { useTenantSession } from '../../contexts/useTenantSession'
import { tenantAuthService } from '../../services/tenant/authService'
import { tenantResolverService } from '../../services/tenant/tenantResolverService'

export function SsoLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setSession, setTenantResolution } = useTenantSession()
  const [error, setError] = useState<string | null>(null)
  const hasConsumed = useRef(false)
  const tenantCode = searchParams.get('tenantCode')?.trim() ?? ''
  const token = searchParams.get('token')?.trim() ?? ''

  useEffect(() => {
    if (hasConsumed.current) {
      return
    }

    hasConsumed.current = true

    if (!tenantCode || !token) {
      setError('SSO link is missing tenant code or token.')
      return
    }

    tenantAuthService.consumeSso({
      tenant_code: tenantCode,
      token,
    })
      .then(async (session) => {
        const tenantResponse = await tenantResolverService.resolveByCode(session.tenant_code)

        setTenantResolution({
          status: 'resolved',
          subdomain: tenantResponse.subdomain ?? null,
          tenant: tenantResponse,
          error: null,
        })

        setSession(session)
        navigate(routePaths.dashboard, { replace: true })
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
