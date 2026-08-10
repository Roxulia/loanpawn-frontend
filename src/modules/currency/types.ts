import type { PaginatedResult } from '../../dataobjects/common/api'

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
  effective_date: string
  observed_at: string
  source: 'PLATFORM' | 'TENANT'
  is_void: boolean
  void_reason: string | null
  can_correct: boolean
  can_void: boolean
}

export type DailyExchangeRateSummary = {
  id: number
  rate_date: string
  open_rate: string
  high_rate: string
  low_rate: string
  close_rate: string
  entry_count: number
  pair: ExchangeRatePair
}

export type CurrencyPage = PaginatedResult<Currency>
export type ExchangePairPage = PaginatedResult<ExchangeRatePair>
export type ExchangeRatePage = PaginatedResult<ExchangeRateEntry>
export type DailyExchangeRatePage = PaginatedResult<DailyExchangeRateSummary>
