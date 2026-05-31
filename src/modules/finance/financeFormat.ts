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
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString()
}

export function normalizeTransactionType(value: string | null | undefined) {
  if (value === 'income') {
    return 'incoming'
  }

  if (value === 'expense') {
    return 'outgoing'
  }

  return value ?? ''
}

export function transactionTypeLabel(value: string | null | undefined) {
  const normalized = normalizeTransactionType(value)

  if (normalized === 'incoming') {
    return 'Incoming'
  }

  if (normalized === 'outgoing') {
    return 'Outgoing'
  }

  return normalized || '-'
}

export function getStringField<TObject extends object>(item: TObject, snakeKey: string, camelKey: string) {
  const record = item as Record<string, unknown>
  const value = record[snakeKey] ?? record[camelKey]

  return typeof value === 'string' ? value : ''
}

export function getNumberField<TObject extends object>(item: TObject, snakeKey: string, camelKey: string) {
  const record = item as Record<string, unknown>
  const value = record[snakeKey] ?? record[camelKey]

  return typeof value === 'number' ? value : null
}

export function required(value: string) {
  return value.trim().length > 0
}

export function positiveAmount(value: string) {
  const amount = Number(value)

  return Number.isFinite(amount) && amount > 0
}

export function optionalInteger(value: string) {
  if (!value.trim()) {
    return true
  }

  return Number.isInteger(Number(value))
}

export function nullableNumber(value: string) {
  return value.trim() ? Number(value) : null
}
