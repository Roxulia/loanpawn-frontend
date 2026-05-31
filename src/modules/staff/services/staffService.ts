import type { PaginatedResult } from '../../../dataobjects/common/api'
import type { TenantUser } from '../../../dataobjects/tenant/auth'
import { apiClient } from '../../../services/http/apiClient'
import type { PermissionCode } from '../../auth'

type DataResponse<TData> = {
  data: TData
  message?: string
}

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
    return apiClient.get<DataResponse<PaginatedResult<TenantUser>>>('/tenant/users')
  },

  createUser(payload: StaffPayload) {
    return apiClient.post<DataResponse<TenantUser>>('/tenant/users', payload)
  },

  getUser(userCode: string) {
    return apiClient.get<DataResponse<TenantUser>>(`/tenant/users/${encodeURIComponent(userCode)}`)
  },

  updateUser(userCode: string, payload: StaffPayload) {
    return apiClient.put<DataResponse<TenantUser>>(`/tenant/users/${encodeURIComponent(userCode)}`, payload)
  },

  updatePermissions(userCode: string, payload: StaffPermissionPayload) {
    return apiClient.put<DataResponse<TenantUser>>(`/tenant/users/${encodeURIComponent(userCode)}/permissions`, payload)
  },

  resetPasswordToDefault(userCode: string, payload: { logoutFromAll?: boolean } = {}) {
    return apiClient.put<MessageResponse>(`/tenant/users/${encodeURIComponent(userCode)}/reset-to-defaultpassword`, payload)
  },

  deleteUser(userCode: string) {
    return apiClient.delete<MessageResponse>(`/tenant/users/${encodeURIComponent(userCode)}`)
  },
}
