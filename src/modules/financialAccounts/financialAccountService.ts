import { apiClient } from '../../services/http/apiClient'
import type { CurrencyPage } from '../currency/types'
import type { DefaultTypeListPage } from '../settings/services/settingsService'
import type { FinancialAccount, FinancialAccountCreatePayload, FinancialAccountDetail, FinancialAccountPage, FinancialAccountTransactionFilters, FinancialAccountTransactionPage, FinancialAccountTransfer, FinancialAccountTransferPage, FinancialAccountTransferPayload, FinancialAccountUpdatePayload } from './types'

export const financialAccountService = {
  reportingExchangeRateQuote: (fromCurrencyId: number, toCurrencyId?: number) => apiClient.get<ReportingExchangeRateQuote>('/tenant/accounting/reporting-exchange-rate-quote', { params: { from_currency_id: fromCurrencyId, to_currency_id: toCurrencyId } }),
  list: (params: { page?: number; perPage?: number; search?: string; assignedOnly?: boolean } = {}) => apiClient.get<FinancialAccountPage>('/tenant/financial-accounts', { params: { page: params.page, per_page: params.perPage ?? 15, search: params.search, assigned_only: params.assignedOnly ? 1 : undefined } }),
  get: (code: string) => apiClient.get<FinancialAccountDetail>(`/tenant/financial-accounts/${encodeURIComponent(code)}`),
  transactions: (code: string, filters: FinancialAccountTransactionFilters = {}) => apiClient.get<FinancialAccountTransactionPage>(`/tenant/financial-accounts/${encodeURIComponent(code)}/transactions`, { params: {
    page: filters.page,
    per_page: filters.perPage ?? 15,
    search: filters.search,
    direction: filters.direction,
    transaction_type: filters.transactionType,
    start_at: filters.startAt,
    end_at: filters.endAt,
  } }),
  create: (payload: FinancialAccountCreatePayload) => apiClient.post<FinancialAccount>('/tenant/financial-accounts', payload),
  update: (code: string, payload: FinancialAccountUpdatePayload) => apiClient.put<FinancialAccount>(`/tenant/financial-accounts/${encodeURIComponent(code)}`, payload),
  delete: (code: string) => apiClient.deleteMessage(`/tenant/financial-accounts/${encodeURIComponent(code)}`),
  accountTypes: () => apiClient.get<DefaultTypeListPage>('/tenant/financial-account-types', { params: { per_page: 100 } }),
  currencies: () => apiClient.get<CurrencyPage>('/tenant/currencies', { params: { per_page: 100 } }),
  listTransfers: (params: { page?: number; perPage?: number } = {}) => apiClient.get<FinancialAccountTransferPage>('/tenant/financial-accounts/transfers', { params: { page: params.page, per_page: params.perPage ?? 15 } }),
  transfer: (payload: FinancialAccountTransferPayload, idempotencyKey: string) => apiClient.post<FinancialAccountTransfer>('/tenant/financial-accounts/transfers', payload, { idempotencyKey }),
}

export type ReportingExchangeRateQuote = {
  from_currency_id: number
  to_currency_id: number
  from_currency_code: string
  to_currency_code: string
  business_date: string
  multiplier: number | null
  source: 'tenant' | 'platform' | null
  requires_manual: boolean
}
