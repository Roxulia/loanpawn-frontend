import { Badge } from '../../components/atoms'
import { useTenantSession } from '../../contexts/useTenantSession'

type ResourceUsageKey = 'slips' | 'staff' | 'accounts' | 'currencies' | 'exchangePairs'

const fields = {
  slips: ['current_month_slip_count', 'max_slip_per_month'],
  staff: ['current_staff_count', 'max_staff_count'],
  accounts: ['current_account_count', 'max_account_count'],
  currencies: ['current_currency_type_count', 'max_currency_type_count'],
  exchangePairs: ['current_exchange_pair_count', 'max_exchange_pair_count'],
} as const

export function ResourceUsageBadge({ resource }: { resource: ResourceUsageKey }) {
  const { tenantResolution } = useTenantSession()
  if (tenantResolution.status !== 'resolved') return null

  const license = tenantResolution.tenant.tenant_license
  const [currentField, limitField] = fields[resource]
  const current = license[currentField]
  const limit = license[limitField]
  const tone = limit !== null && current >= limit ? 'danger' : limit !== null && current / Math.max(limit, 1) >= 0.8 ? 'warning' : 'info'

  return <Badge tone={tone}>{current} / {limit ?? 'Unlimited'}</Badge>
}
