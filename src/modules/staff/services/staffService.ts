import type { PaginatedResult } from '../../../dataobjects/common/api'
import type { TenantUser } from '../../../dataobjects/tenant/auth'
import { apiClient } from '../../../services/http/apiClient'
import type { PermissionCode } from '../../auth'

type MessageResponse = {
  message: string
}

export type StaffPayload = {
  address?: string | null
  email: string
  name: string
  nrc: string
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

  createUser(payload: StaffPayload) {
    return apiClient.post<TenantUser>('/tenant/users', payload)
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
    return apiClient.put<MessageResponse>(`/tenant/users/${encodeURIComponent(userCode)}/reset-to-defaultpassword`, payload)
  },

  deleteUser(userCode: string) {
    return apiClient.delete<MessageResponse>(`/tenant/users/${encodeURIComponent(userCode)}`)
  },
}
