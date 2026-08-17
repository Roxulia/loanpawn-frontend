export type ReportingCurrencyNotificationStatus =
  | 'queued'
  | 'processing'
  | 'waiting_for_rates'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type TenantNotification = {
  id: string
  type: 'reporting_currency_recalculation'
  status: ReportingCurrencyNotificationStatus
  recalculation_id: number | null
  data: {
    previous_currency: { id: number; code: string }
    requested_currency: { id: number; code: string }
    missing_rate_count: number
  }
  read_at: string | null
  created_at: string
}

export type TenantNotificationList = {
  items: TenantNotification[]
  unread_count: number
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type TenantNotificationBroadcast = {
  notification: TenantNotification
}
