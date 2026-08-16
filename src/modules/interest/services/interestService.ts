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
  update_key?: number
  start_period_at?: string | null
  end_period_at?: string | null
  interest_amount: number
}

export type InterestPaymentPayload = {
  reporting_exchange_rate?: number
  reporting_exchange_rate_inversed?: boolean
  accept_account_id?: number
  slip_update_key: number
  payment_amount: number
  payment_amount_unit?: import('../../finance/financialUnits').FinancialUnitCode
  record_debt: boolean
  interest_breakdown: Array<{
    id: number
    update_key: number
    interest_amount: number
    start_period_at?: string | null
    end_period_at?: string | null
  }>
}

export type InterestCalculationResult = {
  account_id?: number
  accountId?: number
  slip_no?: string
  slip_update_key?: number
  current_date?: string
  interest_breakdown?: InterestBreakdownRow[]
  total_interest_amount?: number
}

export type InterestPaymentResult = {
  status: string
  debtAmount?: number
  changeAmount?: number
  paidAmount?: number
}

export type InterestPaymentHistoryItem = {
  id: number
  slip_no?: string | null
  start_period_at?: string | null
  end_period_at?: string | null
  interest_amount: number
  payment_amount: number
  change_amount: number
  payment_at?: string | null
  is_paid: boolean
  notes?: string | null
  created_account_id?: number | null
  createdAccountId?: number | null
  accept_account_id?: number | null
  acceptAccountId?: number | null
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
