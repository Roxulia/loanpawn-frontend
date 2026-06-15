import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { Button } from '../../components'
import { useTenantSession } from '../../contexts/useTenantSession'

const platformBillingUrl = import.meta.env.VITE_PLATFORM_BILLING_URL ?? 'http://loanpawntest.1morebit.tech:8000/billing'

type FeatureRouteProps = {
  children: ReactNode
  featureCode: string
  label: string
}

export function FeatureRoute({ children, featureCode, label }: FeatureRouteProps) {
  const location = useLocation()
  const { authStatus, currentUser, isAuthenticated, tenantResolution } = useTenantSession()

  if (authStatus !== 'checking' && !isAuthenticated) {
    return <Navigate to={routePaths.login} replace state={{ from: location }} />
  }

  const feature = tenantResolution.status === 'resolved'
    ? tenantResolution.tenant.tenant_features?.[featureCode]
    : null

  if (!feature?.is_active) {
    return <FeatureAccessPage featureLabel={label} variant="comingSoon" />
  }

  if (!feature.is_enabled) {
    const roleName = currentUser?.roleName ?? currentUser?.role_name ?? ''
    const isOwner = roleName.toLowerCase() === 'owner'

    return (
      <FeatureAccessPage
        featureLabel={label}
        isOwner={isOwner}
        unlockPlanName={feature.unlock_in?.name ?? 'a higher plan'}
        variant="upgrade"
      />
    )
  }

  return children
}

function FeatureAccessPage({
  featureLabel,
  isOwner = false,
  unlockPlanName,
  variant,
}: {
  featureLabel: string
  isOwner?: boolean
  unlockPlanName?: string
  variant: 'comingSoon' | 'upgrade'
}) {
  const isUpgrade = variant === 'upgrade'
  const title = isUpgrade
    ? `Upgrade to ${unlockPlanName} to unlock this feature`
    : 'This feature is coming soon'
  const description = isUpgrade
    ? `${featureLabel} is active, but it is not included in your current plan.`
    : `${featureLabel} is not active yet. It will become available after release.`

  return (
    <section className="page feature-access-page">
      <div className={`feature-access feature-access--${variant}`}>
        <div className="feature-access__mark" aria-hidden="true">
          {isUpgrade ? 'UP' : 'SOON'}
        </div>
        <div className="feature-access__content">
          <div className="feature-access__eyebrow">{featureLabel}</div>
          <h1>{title}</h1>
          <p>{description}</p>
          {isUpgrade && (
            <div className="feature-access__action">
              {isOwner ? (
                <Button variant="primary" onClick={() => { window.location.href = platformBillingUrl }}>
                  Open Billing Portal
                </Button>
              ) : (
                <span className="feature-access__note">Contact the shop owner to request a plan upgrade.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
