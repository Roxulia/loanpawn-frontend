import { Alert } from '../../components/feedback'
import { Card } from '../../components/molecules'
import { platformBillingUrl } from '../../config'
import { useTenantSession } from '../../contexts/useTenantSession'
import type { TenantUser } from '../../dataobjects/tenant/auth'

export function TenantLicenseExpiredPage() {
  const { currentUser, tenantResolution } = useTenantSession()
  const tenant = tenantResolution.status === 'resolved' ? tenantResolution.tenant : null
  const isOwner = isTenantOwner(currentUser)
  const expireDate = formatLicenseDate(tenant?.tenant_license.expire_date)

  return (
    <main className="auth-shell">
      <Card
        title="License expired"
        description={`${tenant?.name ?? 'This tenant'} cannot be opened because the tenant license expired${
          expireDate ? ` on ${expireDate}` : ''
        }.`}
        footer={
          isOwner ? (
            <a className="ui-button ui-button--primary" href={platformBillingUrl}>
              Open Billing
            </a>
          ) : null
        }
      >
        <Alert
          tone="danger"
          title="Tenant license"
          message={
            isOwner
              ? 'Renew the tenant license from the billing page to restore access.'
              : 'Please contact the tenant Owner to renew the license.'
          }
        />
      </Card>
    </main>
  )
}

function isTenantOwner(user: TenantUser | null) {
  return (user?.role_name ?? user?.roleName ?? '').toLowerCase() === 'owner'
}

function formatLicenseDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
