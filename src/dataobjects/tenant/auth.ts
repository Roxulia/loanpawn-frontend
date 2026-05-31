export type TenantUser = {
  id: number
  code: string
  tenant_id: number
  update_key?: number
  updateKey?: number
  role_id?: number | null
  username: string
  name: string
  nrc: string
  email?: string | null
  phone: string
  address?: string | null
  status: string
  is_deleted: boolean
  last_login_at?: string | null
  created_by?: number | null
  role_name?: string | null
  roleName?: string | null
  permissions?: string[]
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
