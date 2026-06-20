import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { Button, Input } from '../../components/atoms'
import { Alert } from '../../components/feedback'
import { Card, FormField, FormGroup } from '../../components/molecules'
import { useTenantSession } from '../../contexts/useTenantSession'
import { tenantAuthService } from '../../services/tenant/authService'
import { tenantResolverService } from '../../services/tenant/tenantResolverService'

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { authStatus, isAuthenticated, setSession, tenantResolution,setTenantResolution } = useTenantSession()
  const resolvedTenant =
    tenantResolution.status === 'resolved' ? tenantResolution.tenant : null
  const [tenantCode, setTenantCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'object' &&
    location.state.from !== null &&
    'pathname' in location.state.from &&
    typeof location.state.from.pathname === 'string'
      ? location.state.from.pathname
      : routePaths.dashboard

  if (authStatus === 'checking') {
    return (
      <Card title="Checking session" description="Verifying your tenant access with the server.">
        <FormGroup columns={1}>
          <div className="status-pill">Please wait</div>
        </FormGroup>
      </Card>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = resolvedTenant
        ? await tenantAuthService.loginSubdomainSpa({ email, password }, resolvedTenant.code)
        : await tenantAuthService.loginPublicSpa({ tenant_code: tenantCode, email, password })
      const tenantResponse = await tenantResolverService.resolveByCode(response.tenant_code)
      setTenantResolution({
        status: 'resolved',
        subdomain: tenantResponse.subdomain ?? null,
        tenant: tenantResponse,
        error: null,
      })
      setSession(response)
      navigate(redirectTo)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-login-page">
      <Card
        title={resolvedTenant ? `Sign in to ${resolvedTenant.name}` : 'Sign in to LonePawn'}
        description={
          resolvedTenant
            ? `Subdomain ${tenantResolution.subdomain} is verified for this shop.`
            : 'Use your tenant code and staff credentials.'
        }
      >
        <form className="auth-form" onSubmit={handleSubmit}>
          <FormGroup columns={1}>
            {!resolvedTenant && (
              <FormField id="tenant-code" label="Tenant code">
                <Input
                  autoComplete="organization"
                  id="tenant-code"
                  onChange={(event) => setTenantCode(event.target.value)}
                  required
                  value={tenantCode}
                />
              </FormField>
            )}
            <FormField id="email" label="Email">
              <Input
                autoComplete="email"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </FormField>
            <FormField id="password" label="Password">
              <Input
                autoComplete="current-password"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </FormField>
          </FormGroup>

          {error && <Alert tone="danger" title="Login failed" message={error} />}

          <Button fullWidth isLoading={isSubmitting} type="submit" variant="primary">
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  )
}
