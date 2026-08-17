import { apiClient } from '../../services/http/apiClient'
import type { TenantNotification, TenantNotificationList } from './types'

type AuthOptions = { token?: string; tenantCode?: string }

export const notificationService = {
  list(options: AuthOptions) {
    return apiClient.get<TenantNotificationList>('/tenant/notifications?per_page=5', options)
  },

  markRead(id: string, options: AuthOptions) {
    return apiClient.post<TenantNotification>(`/tenant/notifications/${encodeURIComponent(id)}/read`, undefined, options)
  },

  markAllRead(options: AuthOptions) {
    return apiClient.post<{ unread_count: number }>('/tenant/notifications/read-all', undefined, options)
  },
}
