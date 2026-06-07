import { createContext } from 'react'
import type { TenantUser, TenantUserAuthSession } from '../dataobjects/tenant/auth'
import type { TenantResolveState } from '../dataobjects/tenant/tenantResolver'
import type { UiLocale } from '../locales/UiLocale'

export type TenantAuthStatus = 'checking' | 'authenticated' | 'unauthenticated'

export type TenantSessionContextValue = {
  authStatus: TenantAuthStatus
  currentUser: TenantUser | null
  session: TenantUserAuthSession | null
  tenantResolution: TenantResolveState
  locale: UiLocale
  isAuthenticated: boolean
  setAuthStatus: (status: TenantAuthStatus) => void
  setCurrentUser: (user: TenantUser | null) => void
  setLocale: (locale: UiLocale) => void
  setSession: (session: TenantUserAuthSession | null) => void
  setTenantResolution: (state: TenantResolveState) => void
}

export const TenantSessionContext = createContext<TenantSessionContextValue | null>(null)
