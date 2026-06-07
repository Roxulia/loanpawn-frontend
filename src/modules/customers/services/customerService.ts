import { apiClient } from '../../../services/http/apiClient'

type TenantAuth = {
  token?: string
  tenantCode?: string
}

type MessageResponse = {
  message: string
}

export type TenantCustomer = {
  id: number
  code: string
  update_key?: number
  updateKey?: number
  tenantId?: number
  tenant_id?: number
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  trustScore?: number
  trust_score?: number
  note?: string | null
  created_by?: number | null
  createdBy?: number | null
  is_deleted: boolean
  isDeleted?: boolean
  deleted_at?: string | null
  deletedAt?: string | null
}

export type TenantCustomerListPage = {
  items: TenantCustomer[]
  currentPage?: number
  current_page?: number
  lastPage?: number
  last_page?: number
  perPage?: number
  per_page?: number
  total: number
}

export type TenantCustomerUpsertResult = {
  created?: boolean
  customer: TenantCustomer
}

function authOptions(auth: TenantAuth = {}) {
  return {
    tenantCode: auth.tenantCode,
    token: auth.token,
  }
}

export const customerService = {
  listCustomers(params: { page?: number; perPage?: number; search?: string } = {}, auth?: TenantAuth) {
    const searchParams = new URLSearchParams()

    if (params.page !== undefined) {
      searchParams.set('page', String(params.page))
    }

    if (params.perPage !== undefined) {
      searchParams.set('per_page', String(params.perPage))
    }

    if (params.search?.trim()) {
      searchParams.set('search', params.search.trim())
    }

    const query = searchParams.toString()

    return apiClient.get<TenantCustomerListPage>(
      `/tenant/customers${query ? `?${query}` : ''}`,
      authOptions(auth),
    )
  },

  createCustomer(payload: unknown, auth?: TenantAuth) {
    return apiClient.post<TenantCustomerUpsertResult>('/tenant/customers', payload, authOptions(auth))
  },

  getCustomer(tenantCustomerCode: string, auth?: TenantAuth) {
    return apiClient.get<TenantCustomer>(`/tenant/customers/${encodeURIComponent(tenantCustomerCode)}`, authOptions(auth))
  },

  updateCustomer(tenantCustomerCode: string, payload: unknown, auth?: TenantAuth) {
    return apiClient.put<TenantCustomer>(`/tenant/customers/${encodeURIComponent(tenantCustomerCode)}`, payload, authOptions(auth))
  },

  deleteCustomer(tenantCustomerCode: string, auth?: TenantAuth) {
    return apiClient.delete<MessageResponse>(`/tenant/customers/${encodeURIComponent(tenantCustomerCode)}`, authOptions(auth))
  },
}
