import { apiClient } from '../../../services/http/apiClient'

type TenantAuth = {
  token?: string
  tenantCode?: string
}

type IdempotentRequestOptions = {
  idempotencyKey?: string
}

export type InterestBreakdownRow = {
  id: number
  updateKey?: number
  update_key?: number
  startDate?: string | null
  start_date?: string | null
  endDate?: string | null
  end_date?: string | null
  interestAmount?: number
  interest_amount: number
}

export type InterestPaymentPayload = {
  slip_update_key: number
  payment_amount: number
  record_debt: boolean
  interest_breakdown: Array<{
    id: number
    update_key: number
    interest_amount: number
    start_date?: string | null
    end_date?: string | null
  }>
}

export type InterestCalculationResult = {
  slipNo?: string
  slip_no?: string
  slipUpdateKey?: number
  slip_update_key?: number
  currentDate?: string
  current_date?: string
  interestBreakdown?: InterestBreakdownRow[]
  interest_breakdown?: InterestBreakdownRow[]
  totalInterestAmount?: number
  total_interest_amount?: number
}

export type InterestPaymentResult = {
  status: string
  debtAmount?: number
  debt_amount?: number
  changeAmount?: number
  change_amount?: number
  paidAmount?: number
  paid_amount?: number
}

export type InterestPaymentHistoryItem = {
  id: number
  slip_no?: string | null
  start_date?: string | null
  end_date?: string | null
  interest_amount: number
  payment_amount: number
  change_amount: number
  payment_date?: string | null
  is_paid: boolean
  notes?: string | null
}

export type InterestPaymentHistoryPage = {
  items?: InterestPaymentHistoryItem[]
  currentPage?: number
  current_page?: number
  lastPage?: number
  last_page?: number
  perPage?: number
  per_page?: number
  total?: number
}

function authOptions(auth: TenantAuth = {}) {
  return {
    tenantCode: auth.tenantCode,
    token: auth.token,
  }
}

export const interestService = {
  listHistory(params: { page?: number; perPage?: number } = {}, auth?: TenantAuth) {
    return apiClient.get<InterestPaymentHistoryPage>(
      '/tenant/interest-payments',
      {
        ...authOptions(auth),
        params: {
          page: params.page,
          per_page: params.perPage,
        },
      },
    )
  },

  calculate(slipNo: string, auth?: TenantAuth) {
    return apiClient.get<InterestCalculationResult>(
      `/tenant/interest-payments/${encodeURIComponent(slipNo)}/calculate`,
      authOptions(auth),
    )
  },

  pay(slipNo: string, payload: InterestPaymentPayload, auth?: TenantAuth, options: IdempotentRequestOptions = {}) {
    return apiClient.post<InterestPaymentResult>(
      `/tenant/interest-payments/${encodeURIComponent(slipNo)}/pay`,
      payload,
      {
        ...authOptions(auth),
        idempotencyKey: options.idempotencyKey,
      },
    )
  },
}
