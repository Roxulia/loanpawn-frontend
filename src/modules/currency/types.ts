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
  buying_rate: string
  selling_rate: string
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
  buying_open: string
  buying_high: string
  buying_low: string
  buying_close: string
  selling_open: string
  selling_high: string
  selling_low: string
  selling_close: string
  entry_count: number
  pair: ExchangeRatePair
  calculated_at: string | null
  source: 'PLATFORM' | 'TENANT'
}

export type ExchangeRateState = { business_date: string; timezone: string; opening_required: boolean; latest_entry: ExchangeRateEntry | null }
export type ExchangeRateTrendPoint = { date: string; buying_close: string; selling_close: string }
export type ExchangeRateTrend = { pair_code: string; from_date: string; to_date: string; tenant_points: ExchangeRateTrendPoint[]; platform_points: ExchangeRateTrendPoint[] }

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

export type HistoricalRateRequirement = {
  requirement_key: string
  date: string
  from_currency: Pick<Currency, 'id' | 'code' | 'name'>
  to_currency: Pick<Currency, 'id' | 'code' | 'name'>
  pair: { code: string; display_code: string; direction: 'direct' | 'reverse' } | null
}

export type HistoricalRateRequirements = {
  recalculation_id: number
  status: string
  previous_currency: Pick<Currency, 'id' | 'code' | 'name'>
  requested_currency: Pick<Currency, 'id' | 'code' | 'name'>
  requirements: HistoricalRateRequirement[]
  currency_setting_update_key: number
}

export type HistoricalRateValues = {
  requirement_key: string
  buying_open: string
  buying_close: string
  selling_open: string
  selling_close: string
}
