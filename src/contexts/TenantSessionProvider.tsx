import { useMemo, useState, type ReactNode } from 'react'
import type { TenantUser, TenantUserAuthSession } from '../dataobjects/tenant/auth'
import type { TenantResolveState } from '../dataobjects/tenant/tenantResolver'
import type { UiLocale } from '../locales/UiLocale'
import {
  TenantSessionContext,
  type TenantAuthStatus,
  type TenantSessionContextValue,
} from './tenantSession'

const initialTenantResolution: TenantResolveState = {
  status: 'idle',
  subdomain: null,
  tenant: null,
  error: null,
}

export function TenantSessionProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<TenantAuthStatus>('checking')
  const [currentUser, setCurrentUser] = useState<TenantUser | null>(null)
  const [locale, setLocale] = useState<UiLocale>('en')
  const [session, setSession] = useState<TenantUserAuthSession | null>(null)
  const [tenantResolution, setTenantResolution] = useState<TenantResolveState>(
    initialTenantResolution,
  )

  function handleSetSession(nextSession: TenantUserAuthSession | null) {
    setSession(nextSession)
    setCurrentUser(nextSession?.user ?? null)
    setLocale(nextSession?.user?.prefer_lang && nextSession.user.prefer_lang === 'mm' ? 'mm' : 'en')
    setAuthStatus(nextSession ? 'authenticated' : 'unauthenticated')
  }

  const value = useMemo<TenantSessionContextValue>(
    () => ({
      authStatus,
      currentUser,
      locale,
      session,
      tenantResolution,
      isAuthenticated: authStatus === 'authenticated' || session !== null || currentUser !== null,
      setAuthStatus,
      setCurrentUser,
      setLocale,
      setSession: handleSetSession,
      setTenantResolution,
    }),
    [authStatus, currentUser, locale, session, tenantResolution],
  )

  return (
    <TenantSessionContext.Provider value={value}>
      {children}
    </TenantSessionContext.Provider>
  )
}
