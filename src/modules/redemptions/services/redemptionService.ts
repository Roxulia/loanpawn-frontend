import { apiClient } from '../../../services/http/apiClient'
import type { LoanContractSlip, SlipCollateralItem, SlipCustomer } from '../../slips/services/slipService'

type TenantAuth = {
  token?: string
  tenantCode?: string
}

type IdempotentRequestOptions = {
  idempotencyKey?: string
}

export type RedemptionDetail = {
  id: number
  update_key?: number
  slip_id: number
  slip_number: string
  gross_amount: number
  net_amount: number
  interest_amount: number
  received_amount: number
  change_amount: number
  redemption_at?: string | null
  notes?: string | null
  created_by?: number | null
}

export type RedemptionListPage = {
  items: RedemptionDetail[]
  page?: number
  current_page?: number
  per_page?: number
  total: number
}

export type RedemptionInterestPayment = {
  id: number
  update_key?: number
  slip_no?: string | null
  start_period_at?: string | null
  end_period_at?: string | null
  interest_amount?: number
  payment_amount?: number
  change_amount?: number
  payment_at?: string | null
  is_paid?: boolean
  notes?: string | null
}

export type RedemptionDebt = {
  id: number
  update_key?: number
  code?: string
  slip_id?: number | null
  slip_no?: string | null
  amount: string | number
  description?: string
  tag?: string | null
  is_paid?: boolean
  created_account_id?: number | null
  createdAccountId?: number | null
}

export type RedemptionCalculationResult = {
  slip: LoanContractSlip
  customer?: SlipCustomer | null
  loan_amount: number
  calculated_interest: number
  total_debt: number
  excluded_debt_total?: number
  excludedDebtTotal?: number
  total_amount_to_pay: number
  interest_payments?: RedemptionInterestPayment[]
  debts?: RedemptionDebt[]
  excluded_debts?: RedemptionDebt[]
  excludedDebts?: RedemptionDebt[]
  collateral_items?: SlipCollateralItem[]
}

export type RedemptionCreatePayload = {
  account_id?: number
  slip_no: string
  calculated_total: number
  payment_amount: number
  interests: Array<{
    id: number
    update_key: number
    interest_amount: number
    start_period_at?: string | null
    end_period_at?: string | null
  }>
  debts: Array<{
    id: number
    update_key: number
    amount: number
  }>
  redemption_at?: string
  notes?: string
}

function authOptions(auth: TenantAuth = {}) {
  return {
    tenantCode: auth.tenantCode,
    token: auth.token,
  }
}

export const redemptionService = {
  listRedemptions(params: { endDate?: string; page?: number; perPage?: number; startDate?: string } = {}, auth?: TenantAuth) {
    const searchParams = new URLSearchParams()

    if (params.page !== undefined) {
      searchParams.set('page', String(params.page))
    }

    if (params.perPage !== undefined) {
      searchParams.set('per_page', String(params.perPage))
    }

    if (params.startDate) {
      searchParams.set('start_at', params.startDate)
    }

    if (params.endDate) {
      searchParams.set('end_at', params.endDate)
    }

    const query = searchParams.toString()

    return apiClient.get<RedemptionListPage>(
      `/tenant/redemptions${query ? `?${query}` : ''}`,
      authOptions(auth),
    )
  },

  calculate(slipNo: string, auth?: TenantAuth) {
    return apiClient.get<RedemptionCalculationResult>(
      `/tenant/redemptions/${encodeURIComponent(slipNo)}/calculate`,
      authOptions(auth),
    )
  },

  create(payload: RedemptionCreatePayload, auth?: TenantAuth, options: IdempotentRequestOptions = {}) {
    return apiClient.post<RedemptionDetail>('/tenant/redemptions', payload, {
      ...authOptions(auth),
      idempotencyKey: options.idempotencyKey,
    })
  },

  getRecord(slipNumber: string, auth?: TenantAuth) {
    return apiClient.get<RedemptionDetail>(`/tenant/redemption-records/${encodeURIComponent(slipNumber)}`, authOptions(auth))
  },
}
