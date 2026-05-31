import type { TenantCustomer } from './services/customerService'

export function getTrustScore(customer: TenantCustomer) {
  return customer.trustScore ?? customer.trust_score ?? 0
}

export function getTrustTone(score: number) {
  if (score >= 180) {
    return 'success'
  }

  if (score >= 80) {
    return 'info'
  }

  return 'warning'
}

export function formatCustomerDeletedState(customer: TenantCustomer) {
  return customer.isDeleted ?? customer.is_deleted ? 'Deleted' : 'Active'
}

export function formatValue(value?: string | number | null) {
  return value === undefined || value === null || value === '' ? '-' : value
}
