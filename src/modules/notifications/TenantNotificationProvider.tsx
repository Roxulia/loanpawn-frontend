import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTenantSession } from '../../contexts/useTenantSession'
import { createTenantEcho } from './createTenantEcho'
import { NotificationContext } from './notificationContext'
import { notificationService } from './notificationService'
import type { TenantNotification, TenantNotificationBroadcast } from './types'

export function TenantNotificationProvider({ children }: { children: ReactNode }) {
  const { currentUser, session, tenantResolution } = useTenantSession()
  const [notifications, setNotifications] = useState<TenantNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tenantCode = session?.tenant_code
    ?? (tenantResolution.status === 'resolved' ? tenantResolution.tenant.code : undefined)
  const token = session?.token_value
  const tenantId = currentUser?.tenant_id
  const tenantUserId = currentUser?.id

  const refresh = useCallback(async () => {
    if (!tenantCode || !tenantUserId) return

    setIsLoading(true)
    try {
      const response = await notificationService.list({ token, tenantCode })
      setNotifications(response.items)
      setUnreadCount(response.unread_count)
      setError(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load notifications.')
    } finally {
      setIsLoading(false)
    }
  }, [tenantCode, tenantUserId, token])

  useEffect(() => {
    if (!tenantCode || !tenantUserId) {
      const timeout = window.setTimeout(() => {
        setNotifications([])
        setUnreadCount(0)
      }, 0)

      return () => window.clearTimeout(timeout)
    }

    const timeout = window.setTimeout(() => void refresh(), 0)

    return () => window.clearTimeout(timeout)
  }, [refresh, tenantCode, tenantUserId])

  useEffect(() => {
    if (!tenantCode || !tenantId || !tenantUserId) return

    const echo = createTenantEcho({ tenantCode, token })
    if (!echo) return

    const channelName = `tenant.${tenantId}.user.${tenantUserId}.notifications`
    echo.private(channelName).listen(
      '.tenant.notification.created',
      (event: TenantNotificationBroadcast) => {
        setNotifications((current) => [
          event.notification,
          ...current.filter((item) => item.id !== event.notification.id),
        ].slice(0, 5))
        if (event.notification.read_at === null) {
          setUnreadCount((count) => count + 1)
        }
      },
    )

    return () => {
      echo.leave(channelName)
      echo.disconnect()
    }
  }, [tenantCode, tenantId, tenantUserId, token])

  const markRead = useCallback(async (id: string) => {
    if (!tenantCode) return

    const current = notifications.find((item) => item.id === id)
    if (!current || current.read_at !== null) return

    const updated = await notificationService.markRead(id, { token, tenantCode })
    setNotifications((items) => items.map((item) => item.id === id ? updated : item))
    setUnreadCount((count) => Math.max(0, count - 1))
  }, [notifications, tenantCode, token])

  const markAllRead = useCallback(async () => {
    if (!tenantCode || unreadCount === 0) return

    await notificationService.markAllRead({ token, tenantCode })
    const readAt = new Date().toISOString()
    setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at ?? readAt })))
    setUnreadCount(0)
  }, [tenantCode, token, unreadCount])

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markRead,
    markAllRead,
  }), [error, isLoading, markAllRead, markRead, notifications, refresh, unreadCount])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
