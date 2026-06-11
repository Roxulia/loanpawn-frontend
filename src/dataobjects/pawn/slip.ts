import type { CollateralItem } from '../../modules/collateral/types'

export type InterestType = 'daily' | 'monthly' | 'yearly'
export type SlipStatus = 'active' | 'redeemed' | 'expired' | 'confiscated'

export type SlipItem = {
  id: number
  code?: string
  update_key?: number
  collateral_item_id?: number
  collateral?: CollateralItem | null
  estimated_value?: string
  minimum_retail_price?: string
  quantity?: number
}

export type LoanContractSlip = {
  id: number
  update_key?: number
  tenant_id: number
  slip_no: string
  customer_id: number
  customer?: unknown
  loan_amount: string
  interest_rate: string
  interest_type_id?: number | null
  interest_type_code?: InterestType | string | null
  interest_type_name?: string | null
  created_date: string
  expire_date: string
  last_interest_added_date?: string | null
  status: SlipStatus
  notes?: string | null
  created_by?: number | null
  expiry_quota: number
  expiry_quota_type: string
  items: SlipItem[]
  created_at?: string | null
  updated_at?: string | null
}

export type LoanContractSlipPayload = {
  customer: {
    name: string
    nrc_citizen?: string | null
    nrc_number?: string | null
    nrc_state?: string | null
    nrc_township?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    trust_score?: number
    note?: string | null
  }
  collateral_items: Array<import('../../modules/collateral/types').CollateralItemPayload>
  loan_amount: number
  interest_rate: number
  interest_type_id: number
  notes?: string | null
  expiry_quota: number
  expiry_quota_type: 'Day' | 'Week' | 'Month' | 'Year' | 'day' | 'week' | 'month' | 'year'
  created_by?: number | null
}
