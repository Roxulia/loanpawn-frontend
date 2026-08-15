import type { UiLocale } from '../../locales/UiLocale'
import type { FinancialAccountSummary } from '../../modules/financialAccounts/types'

export type TenantUser = {
  id: number
  code: string
  tenant_id: number
  update_key?: number
  updateKey?: number
  role_id?: number | null
  roleId?: number | null
  username: string
  name: string
  nrc: string
  nrc_citizen?: string | null
  nrc_number?: string | null
  nrc_state?: string | null
  nrc_township?: string | null
  email?: string | null
  phone: string
  address?: string | null
  status: string
  is_deleted: boolean
  last_login_at?: string | null
  created_by?: number | null
  role_name?: string | null
  roleName?: string | null
  preferLang?: UiLocale | null
  prefer_lang?: UiLocale | null
  permissions?: string[]
  financial_accounts?: FinancialAccountSummary[]
}

export type TenantUserAuthSession = {
  guard: string
  token_name: string
  token_value: string
  tenant_code: string
  tenant_header_name: string
  tenant_header_value: string
  user: TenantUser
}

export type TenantPublicLoginRequest = {
  tenant_code: string
  email: string
  password: string
}

export type TenantSubdomainLoginRequest = {
  email: string
  password: string
}

export type TenantLoginRequest = TenantPublicLoginRequest | TenantSubdomainLoginRequest

export type TenantSsoConsumeRequest = {
  tenant_code: string
  token: string
}
