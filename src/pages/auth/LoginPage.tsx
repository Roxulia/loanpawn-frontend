import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { Badge, Button, Input } from '../../components/atoms'
import { Alert } from '../../components/feedback'
import { Card, FormField, FormGroup } from '../../components/molecules'
import { useTenantSession } from '../../contexts/useTenantSession'
import { savedTenantStore, type SavedTenantProfile } from '../../services/tenant/savedTenantStore'
import { tenantAuthService } from '../../services/tenant/authService'
import { tenantResolverService } from '../../services/tenant/tenantResolverService'

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { authStatus, isAuthenticated, setSession, tenantResolution, setTenantResolution } = useTenantSession()
  const resolvedTenant =
    tenantResolution.status === 'resolved' ? tenantResolution.tenant : null
  const isSubdomainLogin = tenantResolution.status === 'resolved' && Boolean(tenantResolution.subdomain)
  const [savedTenants, setSavedTenants] = useState(() => savedTenantStore.listSavedTenants())
  const [isAddingTenant, setIsAddingTenant] = useState(savedTenants.length === 0)
  const [tenantCode, setTenantCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tenantError, setTenantError] = useState('')
  const [isResolvingTenant, setIsResolvingTenant] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isTenantBlocked =
    resolvedTenant?.tenant_license.status === 'expired' ||
    resolvedTenant?.tenant_license.status === 'suspended'

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

    if (!resolvedTenant) {
      setError('Select or add a tenant before signing in.')
      return
    }

    if (isTenantBlocked) {
      setError('This tenant cannot be opened because the license is not active.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = isSubdomainLogin
        ? await tenantAuthService.loginSubdomainSpa({ email, password }, resolvedTenant.code)
        : await tenantAuthService.loginPublicSpa({ tenant_code: resolvedTenant.code, email, password })
      const tenantResponse = await tenantResolverService.resolveByCode(response.tenant_code)
      savedTenantStore.saveTenantProfile(tenantResponse)
      savedTenantStore.setActiveTenantCode(tenantResponse.code)
      setSavedTenants(savedTenantStore.listSavedTenants())
      setTenantResolution({
        status: 'resolved',
        subdomain: isSubdomainLogin ? tenantResponse.subdomain ?? null : null,
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

  async function handleAddTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await resolveTenantCode(tenantCode)
  }

  async function handleSelectTenant(profile: SavedTenantProfile) {
    await resolveTenantCode(profile.code)
  }

  function handleRemoveTenant(code: string) {
    savedTenantStore.removeSavedTenant(code)
    const nextTenants = savedTenantStore.listSavedTenants()

    setSavedTenants(nextTenants)

    if (resolvedTenant?.code === code) {
      setTenantResolution({
        status: 'idle',
        subdomain: null,
        tenant: null,
        error: null,
      })
      setIsAddingTenant(nextTenants.length === 0)
    }
  }

  function handleSwitchTenant() {
    const nextTenants = savedTenantStore.listSavedTenants()

    savedTenantStore.clearActiveTenantCode()
    setSavedTenants(nextTenants)
    setTenantResolution({
      status: 'idle',
      subdomain: null,
      tenant: null,
      error: null,
    })
    setIsAddingTenant(nextTenants.length === 0)
    setEmail('')
    setPassword('')
    setError('')
  }

  async function resolveTenantCode(code: string) {
    const normalizedCode = code.trim()

    if (!normalizedCode) {
      setTenantError('Enter a tenant code.')
      return
    }

    setTenantError('')
    setError('')
    setIsResolvingTenant(true)
    setTenantResolution({
      status: 'loading',
      subdomain: null,
      tenant: null,
      error: null,
    })

    try {
      const tenant = await tenantResolverService.resolveByCode(normalizedCode)

      savedTenantStore.saveTenantProfile(tenant)
      savedTenantStore.setActiveTenantCode(tenant.code)
      setSavedTenants(savedTenantStore.listSavedTenants())
      setTenantResolution({
        status: 'resolved',
        subdomain: null,
        tenant,
        error: null,
      })
      setTenantCode('')
      setIsAddingTenant(false)
    } catch (caught) {
      savedTenantStore.clearActiveTenantCode()
      setTenantResolution({
        status: 'idle',
        subdomain: null,
        tenant: null,
        error: null,
      })
      setTenantError(caught instanceof Error ? caught.message : 'Tenant could not be resolved.')
    } finally {
      setIsResolvingTenant(false)
    }
  }

  if (!isSubdomainLogin && !resolvedTenant) {
    return (
      <div className="auth-login-page">
        <Card
          title="Open LonePawn"
          description="Select a saved shop or add a tenant code to continue."
          action={
            savedTenants.length > 0 && !isAddingTenant ? (
              <Button onClick={() => setIsAddingTenant(true)} variant="ghost">
                Add tenant
              </Button>
            ) : null
          }
        >
          <div className="tenant-access">
            {!isAddingTenant && savedTenants.length > 0 ? (
              <div className="tenant-list">
                {savedTenants.map((tenant) => (
                  <div className="tenant-list-item" key={tenant.code}>
                    <button
                      className="tenant-list-item__select"
                      onClick={() => handleSelectTenant(tenant)}
                      type="button"
                    >
                      <span className="tenant-list-item__mark" style={tenant.primaryColor ? { backgroundColor: tenant.primaryColor } : undefined}>
                        {tenant.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="tenant-list-item__content">
                        <strong>{tenant.name}</strong>
                        <small>{tenant.code}</small>
                      </span>
                      <LicenseBadge status={tenant.licenseStatus} />
                    </button>
                    <Button onClick={() => handleRemoveTenant(tenant.code)} variant="ghost">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleAddTenant}>
                <FormGroup columns={1}>
                  <FormField id="tenant-code" label="Tenant code">
                    <Input
                      autoComplete="organization"
                      id="tenant-code"
                      onChange={(event) => setTenantCode(event.target.value)}
                      required
                      value={tenantCode}
                    />
                  </FormField>
                </FormGroup>
                {tenantError && <Alert tone="danger" title="Tenant not found" message={tenantError} />}
                <div className="tenant-access__actions">
                  {savedTenants.length > 0 && (
                    <Button onClick={() => setIsAddingTenant(false)} variant="ghost">
                      Back
                    </Button>
                  )}
                  <Button fullWidth={savedTenants.length === 0} isLoading={isResolvingTenant} type="submit" variant="primary">
                    Add tenant
                  </Button>
                </div>
              </form>
            )}
            {tenantError && !isAddingTenant && <Alert tone="danger" title="Tenant not found" message={tenantError} />}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="auth-login-page">
      <Card
        title={resolvedTenant ? `Sign in to ${resolvedTenant.name}` : 'Sign in to LonePawn'}
        description={
          isSubdomainLogin
            ? `Subdomain ${tenantResolution.subdomain} is verified for this shop.`
            : 'Use your saved tenant and staff credentials.'
        }
        action={!isSubdomainLogin ? <Button onClick={handleSwitchTenant} variant="ghost">Switch tenant</Button> : null}
      >
        {isTenantBlocked && (
          <Alert
            tone="danger"
            title="Tenant license"
            message={
              resolvedTenant?.tenant_license.status === 'expired'
                ? 'This tenant license has expired. Contact the shop owner or administrator.'
                : 'This tenant is suspended. Contact the shop owner or administrator.'
            }
          />
        )}
        <form className="auth-form" onSubmit={handleSubmit}>
          <FormGroup columns={1}>
            <FormField id="email" label="Email">
              <Input
                autoComplete="email"
                disabled={isTenantBlocked}
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
                disabled={isTenantBlocked}
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </FormField>
          </FormGroup>

          {error && <Alert tone="danger" title="Login failed" message={error} />}

          <Button fullWidth disabled={isTenantBlocked} isLoading={isSubmitting} type="submit" variant="primary">
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  )
}

function LicenseBadge({ status }: { status: SavedTenantProfile['licenseStatus'] }) {
  const tone = status === 'paid' || status === 'trial' ? 'success' : 'danger'

  return <Badge tone={tone}>{status}</Badge>
}
