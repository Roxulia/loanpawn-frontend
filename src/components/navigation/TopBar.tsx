import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { useTenantSession } from '../../contexts/useTenantSession'
import { useUiLocale } from '../../locales/UiLocale'
import { tenantAuthService } from '../../services/tenant/authService'
import { NotificationMenu } from './NotificationMenu'

type TopBarProps = {
  onOpenSidebar?: () => void
}

export function TopBar({ onOpenSidebar }: TopBarProps) {
  const navigate = useNavigate()
  const { currentUser, session, setSession, tenantResolution } = useTenantSession()
  const { t } = useUiLocale()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const displayName = currentUser?.name ?? session?.user.name ?? t('Guest')
  const currentUserId = currentUser?.id ?? session?.user.id
  const userRole = currentUser?.role_name ?? currentUser?.roleName ?? session?.user.role_name ?? session?.user.roleName ?? null
  const userStatus = currentUser?.status ?? session?.user.status ?? null
  const userInitials = getInitials(displayName)
  const resolvedTenant = tenantResolution.status === 'resolved' ? tenantResolution.tenant : null
  const tenantLabel = session?.tenant_code ?? resolvedTenant?.code ?? t('Tenant session')

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)

    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [])

  function handleProfileSetting() {
    setIsUserMenuOpen(false)

    navigate(routePaths.profile)
  }

  async function handleLogout() {
    setIsUserMenuOpen(false)

    try {
      await tenantAuthService.logout(session?.token_value)
    } finally {
      window.localStorage.clear()
      setSession(null)
      navigate(routePaths.login, { replace: true })
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-main">
        <button
          type="button"
          className="topbar-menu-button"
          onClick={onOpenSidebar}
          aria-label={t('Open navigation')}
          title={t('Open navigation')}
        >
          <span />
          <span />
          <span />
        </button>
        <div>
          <span className="eyebrow">{t('Tenant workspace')}</span>
          <strong>{tenantLabel}</strong>
        </div>
      </div>
      <div className="topbar-actions">
        <NotificationMenu />
        <div className="topbar-user-menu" ref={userMenuRef}>
          <button
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            className="topbar-user"
            onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span className="topbar-user__avatar" aria-hidden="true">{userInitials}</span>
            <span className="topbar-user__identity">
              <strong>{displayName}</strong>
              <span>{userRole ?? userStatus ?? t('User')}</span>
            </span>
            <span className="topbar-user__chevron" aria-hidden="true">v</span>
          </button>
          {isUserMenuOpen && (
            <div className="topbar-user-dropdown" role="menu">
              <button disabled={!currentUserId} onClick={handleProfileSetting} role="menuitem" type="button">
                {t('Profile Setting')}
              </button>
              <button onClick={() => void handleLogout()} role="menuitem" type="button">
                {t('Logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}
