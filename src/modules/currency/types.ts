export type Currency = {
  id: number
  code: string
  name: string
  symbol: string | null
  decimal_precision: number
  rounding_mode: 'HALF_UP' | 'HALF_DOWN' | 'HALF_EVEN' | 'UP' | 'DOWN'
  adjustment_step: string | null
  is_default: boolean
  is_active: boolean
  source: 'PLATFORM' | 'TENANT'
  can_update: boolean
  can_delete: boolean
  update_key: number
}

export type ExchangeRatePair = {
  id: number
  code: string
  display_code: string
  base_currency: Currency
  quote_currency: Currency
  is_default: boolean
  is_active: boolean
  source: 'PLATFORM' | 'TENANT'
  can_update: boolean
  can_delete: boolean
  update_key: number
}

export type ExchangeRateEntry = {
  id: number
  code: string
  pair: ExchangeRatePair
  rate: string
  effective_date: string | null
  observed_at: string | null
  source: 'PLATFORM' | 'TENANT'
  is_void: boolean
  voided_at: string | null
  void_reason: string | null
  can_correct: boolean
  can_void: boolean
}

export type DailyExchangeRateSummary = {
  id: number
  rate_date: string | null
  open_rate: string
  high_rate: string
  low_rate: string
  close_rate: string
  entry_count: number
  pair: ExchangeRatePair
  calculated_at: string | null
  source: 'PLATFORM' | 'TENANT'
}

export type CurrencyListPage<TItem> = {
  items: TItem[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type CurrencyPage = CurrencyListPage<Currency>
export type ExchangePairPage = CurrencyListPage<ExchangeRatePair>
export type ExchangeRatePage = CurrencyListPage<ExchangeRateEntry>
export type DailyExchangeRatePage = CurrencyListPage<DailyExchangeRateSummary>
