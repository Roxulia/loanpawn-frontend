import { apiClient } from '../../services/http/apiClient'
import type { CurrencyPage } from '../currency/types'
import type { DefaultTypeListPage } from '../settings/services/settingsService'
import type { FinancialAccount, FinancialAccountCreatePayload, FinancialAccountPage, FinancialAccountTransactionFilters, FinancialAccountTransactionPage, FinancialAccountTransfer, FinancialAccountTransferPage, FinancialAccountTransferPayload, FinancialAccountUpdatePayload } from './types'

export const financialAccountService = {
  list: (params: { page?: number; perPage?: number; search?: string } = {}) => apiClient.get<FinancialAccountPage>('/tenant/financial-accounts', { params: { page: params.page, per_page: params.perPage ?? 15, search: params.search } }),
  get: (code: string) => apiClient.get<FinancialAccount>(`/tenant/financial-accounts/${encodeURIComponent(code)}`),
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
