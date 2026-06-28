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
  updateKey?: number
  update_key?: number
  slip_id: number
  slipId?: number
  slip_number: string
  slipNumber?: string
  gross_amount: number
  grossAmount?: number
  net_amount: number
  netAmount?: number
  interest_amount: number
  interestAmount?: number
  received_amount: number
  receivedAmount?: number
  change_amount: number
  changeAmount?: number
  redemption_date?: string | null
  redemptionDate?: string | null
  notes?: string | null
  created_by?: number | null
  createdBy?: number | null
}

export type RedemptionListPage = {
  items: RedemptionDetail[]
  page?: number
  current_page?: number
  per_page?: number
  perPage?: number
  total: number
}

export type RedemptionInterestPayment = {
  id: number
  updateKey?: number
  update_key?: number
  slipNo?: string | null
  slip_no?: string | null
  startDate?: string | null
  start_date?: string | null
  endDate?: string | null
  end_date?: string | null
  interestAmount?: number
  interest_amount?: number
  paymentAmount?: number
  payment_amount?: number
  changeAmount?: number
  change_amount?: number
  paymentDate?: string | null
  payment_date?: string | null
  isPaid?: boolean
  is_paid?: boolean
  notes?: string | null
}

export type RedemptionDebt = {
  id: number
  updateKey?: number
  update_key?: number
  code?: string
  slipId?: number | null
  slip_id?: number | null
  slipNo?: string | null
  slip_no?: string | null
  amount: string | number
  description?: string
  tag?: string | null
  isPaid?: boolean
  is_paid?: boolean
}

export type RedemptionCalculationResult = {
  slip: LoanContractSlip
  customer?: SlipCustomer | null
  loan_amount: number
  calculated_interest: number
  total_debt: number
  total_amount_to_pay: number
  interest_payments?: RedemptionInterestPayment[]
  debts?: RedemptionDebt[]
  collateral_items?: SlipCollateralItem[]
}

export type RedemptionCreatePayload = {
  slip_no: string
  calculated_total: number
  payment_amount: number
  interests: Array<{
    id: number
    update_key: number
    interest_amount: number
    start_date?: string | null
    end_date?: string | null
  }>
  debts: Array<{
    id: number
    update_key: number
    amount: number
  }>
  redemption_date?: string
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
      searchParams.set('start_date', params.startDate)
    }

    if (params.endDate) {
      searchParams.set('end_date', params.endDate)
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
