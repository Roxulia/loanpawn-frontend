import { createContext } from 'react'
import type { TenantNotification } from './types'

export type NotificationContextValue = {
  notifications: TenantNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)
