import type { PaginatedResult } from '../../../dataobjects/common/api'
import type { TenantRoleOption, TenantUserCreateResponse } from '../../../dataobjects/tenant/staff'
import type { TenantUser } from '../../../dataobjects/tenant/auth'
import { apiClient } from '../../../services/http/apiClient'
import type { PermissionCode } from '../../auth'

export type StaffPayload = {
  address?: string | null
  email: string
  name: string
  nrc_citizen: string
  nrc_number: string
  nrc_state: string
  nrc_township: string
  phone: string
  role_id?: number | null
  status?: string | null
  update_key?: number
}

export type StaffPermissionPayload = Partial<Record<PermissionCode, boolean>>

export const staffService = {
  listUsers() {
    return apiClient.get<PaginatedResult<TenantUser>>('/tenant/users')
  },

  listRoles(params: { excludeOwner?: boolean } = {}) {
    const searchParams = new URLSearchParams()

    if (params.excludeOwner) {
      searchParams.set('exclude_owner', '1')
    }

    const query = searchParams.toString()

    return apiClient.get<TenantRoleOption[]>(`/tenant/user-roles${query ? `?${query}` : ''}`)
  },

  createUser(payload: StaffPayload) {
    return apiClient.post<TenantUserCreateResponse>('/tenant/users', payload)
  },

  getUser(userCode: string) {
    return apiClient.get<TenantUser>(`/tenant/users/${encodeURIComponent(userCode)}`)
  },

  updateUser(userCode: string, payload: StaffPayload) {
    return apiClient.put<TenantUser>(`/tenant/users/${encodeURIComponent(userCode)}`, payload)
  },

  updatePermissions(userCode: string, payload: StaffPermissionPayload) {
    return apiClient.put<TenantUser>(`/tenant/users/${encodeURIComponent(userCode)}/permissions`, payload)
  },

  resetPasswordToDefault(userCode: string, payload: { logoutFromAll?: boolean } = {}) {
    return apiClient.putMessage(`/tenant/users/${encodeURIComponent(userCode)}/reset-to-defaultpassword`, payload)
  },

  deleteUser(userCode: string) {
    return apiClient.deleteMessage(`/tenant/users/${encodeURIComponent(userCode)}`)
  },
}
