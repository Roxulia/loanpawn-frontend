export type FinancialAccountOption = { id: number; code: string; name: string }

export type FinancialAccount = {
  id: number
  account_code: string
  account_name: string
  account_number: string | null
  balance: string
  is_active: boolean
  is_default: boolean
  is_deleted: boolean
  allow_negative_balance: boolean
  update_key: number
  account_type: FinancialAccountOption
  currency: FinancialAccountOption & { symbol?: string | null }
}

export type FinancialAccountPage = {
  items: FinancialAccount[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type FinancialAccountCreatePayload = {
  account_type: string
  currency_type: string
  account_name: string
  balance?: number
  allow_negative_balance?: boolean
  account_number?: string | null
}

export type FinancialAccountUpdatePayload = {
  name: string
  is_active: boolean
  is_default: boolean
  account_number: string | null
  update_key: number
}
