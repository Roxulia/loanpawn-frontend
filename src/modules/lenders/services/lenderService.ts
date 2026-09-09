import { apiClient } from '../../../services/http/apiClient'

export type TenantLender = {
  id: number
  code: string
  update_key?: number
  updateKey?: number
  name: string
  nrc?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  note?: string | null
  total_loans?: number
  totalLoans?: number
  active_loans?: number
  activeLoans?: number
  outstanding_principal?: string
  outstandingPrincipal?: string
  created_at?: string | null
  updated_at?: string | null
}

export type LenderListPage = {
  data: TenantLender[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export const lenderService = {
  list(params: { page?: number; perPage?: number; search?: string } = {}) {
    return apiClient.get<LenderListPage>('/tenant/lenders', { params: { page: params.page, per_page: params.perPage, search: params.search } })
  },
  create(payload: unknown) { return apiClient.post<TenantLender>('/tenant/lenders', payload) },
  get(code: string) { return apiClient.get<TenantLender>(`/tenant/lenders/${encodeURIComponent(code)}`) },
  update(code: string, payload: unknown) { return apiClient.put<TenantLender>(`/tenant/lenders/${encodeURIComponent(code)}`, payload) },
  delete(code: string) { return apiClient.deleteMessage(`/tenant/lenders/${encodeURIComponent(code)}`) },
}
