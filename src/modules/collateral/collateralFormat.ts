import type { CollateralItem } from './types'
import { formatLocalDate } from '../../utils/localDateTime'

export function getItemType(item: CollateralItem) {
  return item.itemType ?? item.item_type ?? item.type
}

export function getItemStatus(item: CollateralItem) {
  return item.itemStatus ?? item.item_status ?? 'active'
}

export function getStatusTone(status: string) {
  const normalized = status.toLowerCase()

  if (['active', 'available', 'redeemed'].includes(normalized)) {
    return 'success'
  }

  if (['expired', 'inactive', 'pending'].includes(normalized)) {
    return 'warning'
  }

  if (['deleted', 'blocked', 'confiscated'].includes(normalized)) {
    return 'danger'
  }

  return 'info'
}

export function formatDate(value?: string | null) {
  return formatLocalDate(value)
}

export function formatMoney(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })
}
