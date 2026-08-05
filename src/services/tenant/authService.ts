import type {
  TenantPublicLoginRequest,
  TenantSubdomainLoginRequest,
  TenantSsoConsumeRequest,
  TenantUser,
  TenantUserAuthSession,
} from '../../dataobjects/tenant/auth'
import { apiClient } from '../http/apiClient'

type TenantChangePasswordPayload = {
  current_password: string
  password: string
  password_confirmation: string
}

export const tenantAuthService = {
  loginPublicSpa(payload: TenantPublicLoginRequest) {
    return apiClient.post<TenantUserAuthSession>('/tenant/login/public-spa', payload)
  },

  loginSubdomainSpa(payload: TenantSubdomainLoginRequest, tenantCode?: string) {
    return apiClient.post<TenantUserAuthSession>('/tenant/login/subdomain-spa', payload, { tenantCode })
  },

  consumeSso(payload: TenantSsoConsumeRequest) {
    return apiClient.post<TenantUserAuthSession>('/tenant/sso/consume', payload, {
      tenantCode: payload.tenant_code,
    })
  },

  me(token?: string) {
    return apiClient.get<TenantUser>('/tenant/me', { token })
  },

  logout(token?: string) {
    return apiClient.postMessage('/tenant/logout', undefined, { token })
  },

  changePassword(payload: TenantChangePasswordPayload) {
    return apiClient.putMessage('/tenant/me/change-password', payload)
  },
}
