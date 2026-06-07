import type { TenantDetail } from '../../dataobjects/tenant/tenant'
import { apiClient } from '../http/apiClient'

export const tenantResolverService = {
  resolveByHost(host: string) {
    return apiClient.get<TenantDetail>('/tenant/resolve-tenant', {
      headers: {
        'X-Tenant-Host': host,
      },
    })
  },
  resolveByCode(code: string) {
    return apiClient.get<TenantDetail>('/tenant/resolve-tenant', {
      headers: {
        'X-Tenant-Code': code,
      },
    })
  },
  resolveTenant(){
    return apiClient.get<TenantDetail>('/tenant/resolve-tenant', {
      
    })
  }
}
