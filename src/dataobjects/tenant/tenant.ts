export type TenantLicenseStatus = 'trial' | 'paid' | 'expired' | 'suspended'
export type TenantPlanType = string

export type TenantFeatureAccess = {
  code: string
  is_active: boolean
  is_enabled: boolean
  unlock_in: {
    code: TenantPlanType
    name: string
  } | null
}

export type TenantDetail = {
  code: string
  name: string
  subdomain?: string | null
  tenant_contact: {
    address?: string | null
    city?: string | null
    country?: string | null
    phone?: string | null
  }
  tenant_license: {
    plan_id?: number | null
    plan_code?: string | null
    plan_name?: string | null
    plan_rank?: number | null
    plan_type: TenantPlanType
    expires_at: string | null
    status: TenantLicenseStatus
  }
  tenant_branding?: {
    logo_path?: string | null
    favicon_path?: string | null
    primary_color?: string | null
    secondary_color?: string | null
    accent_color?: string | null
    slip_header_layout?: unknown[] | null
    slip_footer_layout?: unknown[] | null
  } | null
  tenant_setting?: unknown
  tenant_category?: {
    id: number
    code: string
    name: string
  } | null
  tenant_features: Record<string, TenantFeatureAccess>
}
