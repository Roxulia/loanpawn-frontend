import { apiClient } from '../../services/http/apiClient'
import type { Currency, CurrencyPage, DailyExchangeRatePage, ExchangePairPage, ExchangeRateEntry, ExchangeRatePage, ExchangeRatePair, ExchangeRateState, ExchangeRateTrend } from './types'

export const currencyService = {
  listCurrencies: () => apiClient.get<CurrencyPage>('/tenant/currencies', { params: { per_page: 100 } }),
  createCurrency: (payload: unknown) => apiClient.post<Currency>('/tenant/currencies', payload),
  updateCurrency: (code: string, payload: unknown) => apiClient.put<Currency>(`/tenant/currencies/${encodeURIComponent(code)}`, payload),
  deleteCurrency: (code: string) => apiClient.deleteMessage(`/tenant/currencies/${encodeURIComponent(code)}`),
  listPairs: () => apiClient.get<ExchangePairPage>('/tenant/exchange-pairs', { params: { per_page: 100 } }),
  createPair: (payload: unknown) => apiClient.post<ExchangeRatePair>('/tenant/exchange-pairs', payload),
  updatePair: (code: string, payload: unknown) => apiClient.put<ExchangeRatePair>(`/tenant/exchange-pairs/${encodeURIComponent(code)}`, payload),
  deletePair: (code: string) => apiClient.deleteMessage(`/tenant/exchange-pairs/${encodeURIComponent(code)}`),
  listRates: (pairCode?: string) => apiClient.get<ExchangeRatePage>('/tenant/exchange-rates', { params: { per_page: 100, pair_code: pairCode } }),
  listDailyRates: () => apiClient.get<DailyExchangeRatePage>('/tenant/exchange-rates/daily', { params: { per_page: 100 } }),
  createRate: (payload: unknown) => apiClient.post<ExchangeRateEntry>('/tenant/exchange-rates', payload),
  getRateState: (pairCode: string) => apiClient.get<ExchangeRateState>('/tenant/exchange-rates/state', { params: { pair_code: pairCode } }),
  getRateTrend: (pairCode: string, days: 7 | 30 | 90) => apiClient.get<ExchangeRateTrend>('/tenant/exchange-rates/trend', { params: { pair_code: pairCode, days } }),
  correctRate: (code: string, payload: unknown) => apiClient.post<ExchangeRateEntry>(`/tenant/exchange-rates/${encodeURIComponent(code)}/correct`, payload),
  voidRate: (code: string, payload: unknown) => apiClient.postMessage(`/tenant/exchange-rates/${encodeURIComponent(code)}/void`, payload),
}
