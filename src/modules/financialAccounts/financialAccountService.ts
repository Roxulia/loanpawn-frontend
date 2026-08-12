import { apiClient } from '../../services/http/apiClient'
import type { CurrencyPage } from '../currency/types'
import type { DefaultTypeListPage } from '../settings/services/settingsService'
import type { FinancialAccount, FinancialAccountCreatePayload, FinancialAccountPage, FinancialAccountUpdatePayload } from './types'

export const financialAccountService = {
  list: (params: { page?: number; perPage?: number; search?: string } = {}) => apiClient.get<FinancialAccountPage>('/tenant/financial-accounts', { params: { page: params.page, per_page: params.perPage ?? 15, search: params.search } }),
  get: (code: string) => apiClient.get<FinancialAccount>(`/tenant/financial-accounts/${encodeURIComponent(code)}`),
  create: (payload: FinancialAccountCreatePayload) => apiClient.post<FinancialAccount>('/tenant/financial-accounts', payload),
  update: (code: string, payload: FinancialAccountUpdatePayload) => apiClient.put<FinancialAccount>(`/tenant/financial-accounts/${encodeURIComponent(code)}`, payload),
  delete: (code: string) => apiClient.deleteMessage(`/tenant/financial-accounts/${encodeURIComponent(code)}`),
  accountTypes: () => apiClient.get<DefaultTypeListPage>('/tenant/financial-account-types', { params: { per_page: 100 } }),
  currencies: () => apiClient.get<CurrencyPage>('/tenant/currencies', { params: { per_page: 100 } }),
}
