import { apiClient } from '../../../services/http/apiClient'
import type { CollateralItem, CollateralItemListPage } from '../types'

type TenantAuth = {
  token?: string
  tenantCode?: string
}

function authOptions(auth: TenantAuth = {}) {
  return {
    tenantCode: auth.tenantCode,
    token: auth.token,
  }
}

export const collateralService = {
  listCollateral(params: { page?: number; perPage?: number; search?: string } = {}, auth?: TenantAuth) {
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

    return apiClient.get<CollateralItemListPage>(
      `/tenant/collateral-items${query ? `?${query}` : ''}`,
      authOptions(auth),
    )
  },

  getCollateral(itemCode: string, auth?: TenantAuth) {
    return apiClient.get<CollateralItem>(`/tenant/collateral-items/${encodeURIComponent(itemCode)}`, authOptions(auth))
  },

  deleteCollateral(itemCode: string, auth?: TenantAuth) {
    return apiClient.deleteMessage(`/tenant/collateral-items/${encodeURIComponent(itemCode)}`, authOptions(auth))
  },
}
