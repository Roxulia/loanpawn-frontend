import type { FinancialUnitCode } from '../../modules/finance/financialUnits'

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
    current_month_slip_count: number
    current_staff_count: number
    current_account_count: number
    current_currency_type_count: number
    current_exchange_pair_count: number
    max_slip_per_month: number | null
    max_staff_count: number | null
    max_account_count: number | null
    max_currency_type_count: number | null
    max_exchange_pair_count: number | null
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
  tenant_setting?: {
    items?: Array<{
      updateKey: number
      key: string
      value: string | null
      category: string | null
    }>
    default_currency_id?: number | null
    reporting_currency_id?: number | null
    effective_reporting_currency_id?: number | null
    default_currency_symbol?: string | null
    reporting_currency_symbol?: string | null
    effective_reporting_currency_symbol?: string | null
    default_financial_unit?: FinancialUnitCode | null
    reporting_currency_recalculation?: {
      id: number
      status: 'queued' | 'processing' | 'waiting_for_rates' | 'failed'
      window_start: string
      window_end: string
      missing_rates: Array<{
        date: string
        from_currency_id: number
        to_currency_id: number
      }>
    } | null
  } | null
  tenant_category?: {
    id: number
    code: string
    name: string
  } | null
  tenant_features: Record<string, TenantFeatureAccess>
}
