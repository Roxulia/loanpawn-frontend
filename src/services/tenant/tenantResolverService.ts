import type { TenantResolveResponse } from '../../dataobjects/tenant/tenantResolver'
import { apiClient } from '../http/apiClient'

export const tenantResolverService = {
  resolveByHost(host: string) {
    return apiClient.get<TenantResolveResponse>('/tenant/resolve-tenant', {
      headers: {
        'X-Tenant-Host': host,
      },
    })
  },
  resolveByCode(code: string) {
    return apiClient.get<TenantResolveResponse>('/tenant/resolve-tenant', {
      headers: {
        'X-Tenant-Code': code,
      },
    })
  },
  resolveTenant(){
    return apiClient.get<TenantResolveResponse>('/tenant/resolve-tenant', {
      
    })
  }
}
