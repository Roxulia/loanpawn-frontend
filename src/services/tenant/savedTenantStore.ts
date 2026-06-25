import type { TenantLicenseStatus } from '../../dataobjects/tenant/tenant'
import type { TenantDetail } from '../../dataobjects/tenant/tenant'

const savedTenantsKey = 'lonepawn.savedTenants.v1'
const activeTenantKey = 'lonepawn.activeTenantCode.v1'

export type SavedTenantProfile = {
  code: string
  name: string
  subdomain: string | null
  logoPath?: string | null
  primaryColor?: string | null
  licenseStatus: TenantLicenseStatus
  lastUsedAt: string
}

export const savedTenantStore = {
  listSavedTenants,
  getSavedTenant,
  saveTenantProfile,
  removeSavedTenant,
  getActiveTenantCode,
  setActiveTenantCode,
  clearActiveTenantCode,
}

function listSavedTenants(): SavedTenantProfile[] {
  if (!canUseLocalStorage()) {
    return []
  }

  const rawValue = window.localStorage.getItem(savedTenantsKey)

  if (!rawValue) {
    return []
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      window.localStorage.removeItem(savedTenantsKey)
      return []
    }

    const tenants = parsedValue
      .map(readSavedTenantProfile)
      .filter((tenant) => tenant !== null)

    if (tenants.length !== parsedValue.length) {
      writeSavedTenants(tenants)
    }

    return tenants.sort((first, second) => {
      return second.lastUsedAt.localeCompare(first.lastUsedAt)
    })
  } catch {
    window.localStorage.removeItem(savedTenantsKey)
    return []
  }
}

function getSavedTenant(code: string) {
  return listSavedTenants().find((tenant) => tenant.code === normalizeTenantCode(code)) ?? null
}

function saveTenantProfile(tenant: TenantDetail): SavedTenantProfile {
  const profile = tenantToProfile(tenant)
  const tenants = listSavedTenants().filter((savedTenant) => savedTenant.code !== profile.code)
  const nextTenants = [profile, ...tenants]

  writeSavedTenants(nextTenants)

  return profile
}

function removeSavedTenant(code: string) {
  const normalizedCode = normalizeTenantCode(code)
  const nextTenants = listSavedTenants().filter((tenant) => tenant.code !== normalizedCode)

  writeSavedTenants(nextTenants)

  if (getActiveTenantCode() === normalizedCode) {
    clearActiveTenantCode()
  }
}

function getActiveTenantCode() {
  if (!canUseLocalStorage()) {
    return null
  }

  return normalizeTenantCode(window.localStorage.getItem(activeTenantKey) ?? '') || null
}

function setActiveTenantCode(code: string) {
  if (!canUseLocalStorage()) {
    return
  }

  const normalizedCode = normalizeTenantCode(code)

  if (!normalizedCode) {
    clearActiveTenantCode()
    return
  }

  window.localStorage.setItem(activeTenantKey, normalizedCode)
}

function clearActiveTenantCode() {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.removeItem(activeTenantKey)
}

function tenantToProfile(tenant: TenantDetail): SavedTenantProfile {
  return {
    code: normalizeTenantCode(tenant.code),
    name: tenant.name,
    subdomain: tenant.subdomain ?? null,
    logoPath: tenant.tenant_branding?.logo_path ?? null,
    primaryColor: tenant.tenant_branding?.primary_color ?? null,
    licenseStatus: tenant.tenant_license.status,
    lastUsedAt: new Date().toISOString(),
  }
}

function writeSavedTenants(tenants: SavedTenantProfile[]) {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.setItem(savedTenantsKey, JSON.stringify(tenants))
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function normalizeTenantCode(code: string) {
  return code.trim()
}

function readSavedTenantProfile(value: unknown): SavedTenantProfile | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const tenant = value as Partial<SavedTenantProfile> & {
    tenant_branding?: {
      logo_path?: unknown
      primary_color?: unknown
    } | null
    tenant_license?: {
      status?: unknown
    } | null
  }

  if (typeof tenant.code !== 'string' || typeof tenant.name !== 'string') {
    return null
  }

  const licenseStatus = isLicenseStatus(tenant.licenseStatus)
    ? tenant.licenseStatus
    : isLicenseStatus(tenant.tenant_license?.status)
      ? tenant.tenant_license.status
      : 'trial'

  return {
    code: normalizeTenantCode(tenant.code),
    name: tenant.name,
    subdomain: typeof tenant.subdomain === 'string' ? tenant.subdomain : null,
    logoPath:
      typeof tenant.logoPath === 'string'
        ? tenant.logoPath
        : typeof tenant.tenant_branding?.logo_path === 'string'
          ? tenant.tenant_branding.logo_path
          : null,
    primaryColor:
      typeof tenant.primaryColor === 'string'
        ? tenant.primaryColor
        : typeof tenant.tenant_branding?.primary_color === 'string'
          ? tenant.tenant_branding.primary_color
          : null,
    licenseStatus,
    lastUsedAt: typeof tenant.lastUsedAt === 'string' ? tenant.lastUsedAt : new Date().toISOString(),
  }
}

function isLicenseStatus(value: unknown): value is TenantLicenseStatus {
  return value === 'trial' || value === 'paid' || value === 'expired' || value === 'suspended'
}
