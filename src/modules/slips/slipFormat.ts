import type { LoanContractSlip } from './services/slipService'
import { formatLocalDate } from '../../utils/localDateTime'

export function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0)

  if (!Number.isFinite(amount)) {
    return '-'
  }

  return amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })
}

export function formatDate(value: string | null | undefined) {
  return formatLocalDate(value)
}

export function getSlipCustomerName(slip: LoanContractSlip) {
  return slip.customer?.name ?? `Customer #${slip.customer_id ?? '-'}`
}

export function getStatusTone(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const normalized = status.toLowerCase()

  if (normalized === 'active') {
    return 'success'
  }

  if (normalized === 'redeemed') {
    return 'info'
  }

  if (normalized === 'expired') {
    return 'warning'
  }

  return 'danger'
}
