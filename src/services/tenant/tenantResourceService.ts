import type { PaginatedResult } from '../../dataobjects/common/api'
import type {
  AccountingLedger,
  AccountingTransaction,
  ExpenseTypeOption,
  TenantDebt,
  TenantExpense,
} from '../../dataobjects/tenant/finance'
import type { TenantUser } from '../../dataobjects/tenant/auth'
import { apiClient } from '../http/apiClient'

type TenantAuth = {
  idempotencyKey?: string
  token?: string
  tenantCode?: string
}

type DataResponse<TData> = {
  data: TData
  message?: string
}

type MessageResponse = {
  message: string
}

type ListParams = {
  page?: number
  perPage?: number
}

type LedgerParams = ListParams & {
  startDate: string
  endDate: string
}

type TenantBrandingSlipLayouts = {
  data: unknown
}

function authOptions(auth: TenantAuth = {}) {
  return {
    idempotencyKey: auth.idempotencyKey,
    tenantCode: auth.tenantCode,
    token: auth.token,
  }
}

function listOptions(params: ListParams = {}, auth?: TenantAuth) {
  return {
    ...authOptions(auth),
    params: {
      page: params.page,
      per_page: params.perPage,
    },
  }
}

export const tenantResourceService = {
  listUsers(auth?: TenantAuth) {
    return apiClient.get<DataResponse<PaginatedResult<TenantUser>>>('/tenant/users', authOptions(auth))
  },

  createUser(payload: unknown, auth?: TenantAuth) {
    return apiClient.post<DataResponse<TenantUser>>('/tenant/users', payload, authOptions(auth))
  },

  updateUser(tenantUserCode: string, payload: unknown, auth?: TenantAuth) {
    return apiClient.put<DataResponse<TenantUser>>(`/tenant/users/${encodeURIComponent(tenantUserCode)}`, payload, authOptions(auth))
  },

  deleteUser(tenantUserCode: string, auth?: TenantAuth) {
    return apiClient.delete<MessageResponse>(`/tenant/users/${encodeURIComponent(tenantUserCode)}`, authOptions(auth))
  },

  listAccounting(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<DataResponse<PaginatedResult<AccountingTransaction>>>('/tenant/accounting', listOptions(params, auth))
  },

  listIncomingAccounting(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<DataResponse<PaginatedResult<AccountingTransaction>>>('/tenant/accounting/incoming', listOptions(params, auth))
  },

  listOutgoingAccounting(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<DataResponse<PaginatedResult<AccountingTransaction>>>('/tenant/accounting/outgoing', listOptions(params, auth))
  },

  generateAccountingLedger(params: LedgerParams, auth?: TenantAuth) {
    return apiClient.get<DataResponse<AccountingLedger>>('/tenant/accounting/ledger', {
      ...authOptions(auth),
      params: {
        end_date: params.endDate,
        page: params.page,
        per_page: params.perPage,
        start_date: params.startDate,
      },
    })
  },

  downloadAccountingLedger(params: Pick<LedgerParams, 'startDate' | 'endDate'>, auth?: TenantAuth) {
    return apiClient.download('/tenant/accounting/ledger/download', {
      ...authOptions(auth),
      params: {
        end_date: params.endDate,
        start_date: params.startDate,
      },
    })
  },

  listExpenses(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<DataResponse<PaginatedResult<TenantExpense>>>('/tenant/expenses', listOptions(params, auth))
  },

  createExpense(payload: unknown, auth?: TenantAuth) {
    return apiClient.post<DataResponse<TenantExpense>>('/tenant/expenses', payload, authOptions(auth))
  },

  updateExpense(expenseCode: string, payload: unknown, auth?: TenantAuth) {
    return apiClient.put<DataResponse<TenantExpense>>(`/tenant/expenses/${encodeURIComponent(expenseCode)}`, payload, authOptions(auth))
  },

  deleteExpense(expenseCode: string, auth?: TenantAuth) {
    return apiClient.delete<MessageResponse>(`/tenant/expenses/${encodeURIComponent(expenseCode)}`, authOptions(auth))
  },

  listExpenseTypes(auth?: TenantAuth) {
    return apiClient.get<DataResponse<ExpenseTypeOption[]>>('/tenant/expense-types', authOptions(auth))
  },

  listDebts(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<DataResponse<PaginatedResult<TenantDebt>>>('/tenant/debts', listOptions(params, auth))
  },

  createDebt(payload: unknown, auth?: TenantAuth) {
    return apiClient.post<DataResponse<TenantDebt>>('/tenant/debts', payload, authOptions(auth))
  },

  updateDebt(debtCode: string, payload: unknown, auth?: TenantAuth) {
    return apiClient.put<DataResponse<TenantDebt>>(`/tenant/debts/${encodeURIComponent(debtCode)}`, payload, authOptions(auth))
  },

  deleteDebt(debtCode: string, auth?: TenantAuth) {
    return apiClient.delete<MessageResponse>(`/tenant/debts/${encodeURIComponent(debtCode)}`, authOptions(auth))
  },

  payDebt(debtCode: string, payload: unknown, auth?: TenantAuth) {
    return apiClient.post<DataResponse<TenantDebt>>(`/tenant/debts/${encodeURIComponent(debtCode)}/paid`, payload, authOptions(auth))
  },

  showBrandingSlipLayouts(auth?: TenantAuth) {
    return apiClient.get<TenantBrandingSlipLayouts>('/tenant/branding/slip-layouts', authOptions(auth))
  },

  updateBrandingSlipLayouts(payload: unknown, auth?: TenantAuth) {
    return apiClient.put<TenantBrandingSlipLayouts>('/tenant/branding/slip-layouts', payload, authOptions(auth))
  },
}
