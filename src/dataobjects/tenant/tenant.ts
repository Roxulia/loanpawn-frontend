export type TenantLicenseStatus = 'trial' | 'paid' | 'expired' | 'suspended'
export type TenantPlanType = 'trial' | 'basic' | 'premium'

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
    plan_type: TenantPlanType
    expire_date : string,
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
}
