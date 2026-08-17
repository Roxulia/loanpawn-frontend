import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { useUiLocale } from '../../locales/UiLocale'
import { usePermissions } from '../../modules/auth/usePermissions'
import { useNotifications } from '../../modules/notifications/useNotifications'
import type { ReportingCurrencyNotificationStatus, TenantNotification } from '../../modules/notifications/types'
import { BellIcon } from '../icons/icon'

const statusTitles: Record<ReportingCurrencyNotificationStatus, string> = {
  queued: 'Reporting currency recalculation queued',
  processing: 'Reporting currency recalculation started',
  waiting_for_rates: 'Historical exchange rates required',
  completed: 'Reporting currency recalculation completed',
  failed: 'Reporting currency recalculation failed',
  cancelled: 'Reporting currency change cancelled',
}

export function NotificationMenu() {
  const navigate = useNavigate()
  const { locale, t } = useUiLocale()
  const { hasPermission } = usePermissions()
  const { notifications, unreadCount, isLoading, error, refresh, markRead, markAllRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)
    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [])

  function toggleMenu() {
    setIsOpen((open) => {
      const next = !open
      if (next) void refresh()
      return next
    })
  }

  async function openNotification(notification: TenantNotification) {
    try {
      await markRead(notification.id)
    } finally {
      setIsOpen(false)
      const canProvideRates = hasPermission('update_currency') && hasPermission('create_exchange_rate')
      navigate(notification.status === 'waiting_for_rates' && canProvideRates
        ? routePaths.reportingCurrencyRates
        : routePaths.settings)
    }
  }

  return (
    <div className="topbar-notifications" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t('Notifications')}
        className="topbar-notification-button"
        onClick={toggleMenu}
        title={t('Notifications')}
        type="button"
      >
        <BellIcon />
        {unreadCount > 0 && <span className="topbar-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-dropdown" role="menu">
          <div className="notification-dropdown__header">
            <strong>{t('Notifications')}</strong>
            {unreadCount > 0 && <button onClick={() => void markAllRead()} type="button">{t('Mark all as read')}</button>}
          </div>
          <div className="notification-dropdown__body">
            {isLoading && notifications.length === 0 && <p className="notification-dropdown__state">{t('Loading notifications...')}</p>}
            {error && notifications.length === 0 && <p className="notification-dropdown__state notification-dropdown__state--error">{t('Unable to load notifications.')}</p>}
            {!isLoading && !error && notifications.length === 0 && <p className="notification-dropdown__state">{t('No notifications yet.')}</p>}
            {notifications.map((notification) => (
              <button
                className={notification.read_at ? 'notification-item' : 'notification-item is-unread'}
                key={notification.id}
                onClick={() => void openNotification(notification)}
                role="menuitem"
                type="button"
              >
                <span className={`notification-item__status notification-item__status--${notification.status}`} aria-hidden="true" />
                <span className="notification-item__content">
                  <strong>{t(statusTitles[notification.status])}</strong>
                  <span>{notification.data.previous_currency.code} &rarr; {notification.data.requested_currency.code}</span>
                  {notification.status === 'waiting_for_rates' && notification.data.missing_rate_count > 0 && (
                    <span>{notification.data.missing_rate_count} {t('missing rate dates')}</span>
                  )}
                  <time dateTime={notification.created_at}>{formatNotificationTime(notification.created_at, locale)}</time>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatNotificationTime(value: string, locale: 'en' | 'mm') {
  return new Intl.DateTimeFormat(locale === 'mm' ? 'my-MM' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
