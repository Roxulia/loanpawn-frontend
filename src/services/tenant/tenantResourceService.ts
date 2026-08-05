import type { PaginatedResult } from '../../dataobjects/common/api'
import type {
  AccountingLedger,
  AccountingOverview,
  AccountingTransaction,
  DashboardTimeFilter,
  TenantDashboardSummary,
  ExpenseTypeOption,
  TenantCapital,
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

type ListParams = {
  page?: number
  perPage?: number
  search?: string
}

type LedgerParams = ListParams & {
  startDate: string
  endDate: string
}

type DashboardSummaryParams = {
  endDate?: string
  startDate?: string
  timeFilter?: DashboardTimeFilter
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
        search: params.search,
      },
  }
}

export const tenantResourceService = {
  getDashboardSummary(params: DashboardSummaryParams = {}, auth?: TenantAuth) {
    return apiClient.get<TenantDashboardSummary>('/tenant/dashboard/summary', {
      ...authOptions(auth),
      params: {
        end_at: params.endDate,
        start_at: params.startDate,
        time_filter: params.timeFilter,
      },
    })
  },

  listUsers(auth?: TenantAuth) {
    return apiClient.get<PaginatedResult<TenantUser>>('/tenant/users', authOptions(auth))
  },

  createUser(payload: unknown, auth?: TenantAuth) {
    return apiClient.post<TenantUser>('/tenant/users', payload, authOptions(auth))
  },

  updateUser(tenantUserCode: string, payload: unknown, auth?: TenantAuth) {
    return apiClient.put<TenantUser>(`/tenant/users/${encodeURIComponent(tenantUserCode)}`, payload, authOptions(auth))
  },

  deleteUser(tenantUserCode: string, auth?: TenantAuth) {
    return apiClient.deleteMessage(`/tenant/users/${encodeURIComponent(tenantUserCode)}`, authOptions(auth))
  },

  listAccounting(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<PaginatedResult<AccountingTransaction>>('/tenant/accounting', listOptions(params, auth))
  },

  getAccountingOverview(auth?: TenantAuth) {
    return apiClient.get<AccountingOverview>('/tenant/accounting/overview', authOptions(auth))
  },

  listIncomingAccounting(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<PaginatedResult<AccountingTransaction>>('/tenant/accounting/incoming', listOptions(params, auth))
  },

  listOutgoingAccounting(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<PaginatedResult<AccountingTransaction>>('/tenant/accounting/outgoing', listOptions(params, auth))
  },

  generateAccountingLedger(params: LedgerParams, auth?: TenantAuth) {
    return apiClient.get<AccountingLedger>('/tenant/accounting/ledger', {
      ...authOptions(auth),
      params: {
        end_at: params.endDate,
        page: params.page,
        per_page: params.perPage,
        start_at: params.startDate,
      },
    })
  },

  downloadAccountingLedger(params: Pick<LedgerParams, 'startDate' | 'endDate'>, auth?: TenantAuth) {
    return apiClient.download('/tenant/accounting/ledger/download', {
      ...authOptions(auth),
      params: {
        end_at: params.endDate,
        start_at: params.startDate,
      },
    })
  },

  listExpenses(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<PaginatedResult<TenantExpense>>('/tenant/expenses', listOptions(params, auth))
  },

  createExpense(payload: unknown, auth?: TenantAuth) {
    return apiClient.post<TenantExpense>('/tenant/expenses', payload, authOptions(auth))
  },

  updateExpense(expenseCode: string, payload: unknown, auth?: TenantAuth) {
    return apiClient.put<TenantExpense>(`/tenant/expenses/${encodeURIComponent(expenseCode)}`, payload, authOptions(auth))
  },

  deleteExpense(expenseCode: string, auth?: TenantAuth) {
    return apiClient.deleteMessage(`/tenant/expenses/${encodeURIComponent(expenseCode)}`, authOptions(auth))
  },

  listCapitals(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<PaginatedResult<TenantCapital>>('/tenant/capitals', listOptions(params, auth))
  },

  createCapital(payload: unknown, auth?: TenantAuth) {
    return apiClient.post<TenantCapital>('/tenant/capitals', payload, authOptions(auth))
  },

  updateCapital(capitalCode: string, payload: unknown, auth?: TenantAuth) {
    return apiClient.put<TenantCapital>(`/tenant/capitals/${encodeURIComponent(capitalCode)}`, payload, authOptions(auth))
  },

  deleteCapital(capitalCode: string, auth?: TenantAuth) {
    return apiClient.deleteMessage(`/tenant/capitals/${encodeURIComponent(capitalCode)}`, authOptions(auth))
  },

  listExpenseTypes(auth?: TenantAuth) {
    return apiClient.get<ExpenseTypeOption[]>('/tenant/expense-types', authOptions(auth))
  },

  listDebts(params?: ListParams, auth?: TenantAuth) {
    return apiClient.get<PaginatedResult<TenantDebt>>('/tenant/debts', listOptions(params, auth))
  },

  createDebt(payload: unknown, auth?: TenantAuth) {
    return apiClient.post<TenantDebt>('/tenant/debts', payload, authOptions(auth))
  },

  updateDebt(debtCode: string, payload: unknown, auth?: TenantAuth) {
    return apiClient.put<TenantDebt>(`/tenant/debts/${encodeURIComponent(debtCode)}`, payload, authOptions(auth))
  },

  deleteDebt(debtCode: string, auth?: TenantAuth) {
    return apiClient.deleteMessage(`/tenant/debts/${encodeURIComponent(debtCode)}`, authOptions(auth))
  },

  payDebt(debtCode: string, payload: unknown, auth?: TenantAuth) {
    return apiClient.post<TenantDebt>(`/tenant/debts/${encodeURIComponent(debtCode)}/paid`, payload, authOptions(auth))
  },

  showBrandingSlipLayouts(auth?: TenantAuth) {
    return apiClient.get<TenantBrandingSlipLayouts>('/tenant/branding/slip-layouts', authOptions(auth))
  },

  updateBrandingSlipLayouts(payload: unknown, auth?: TenantAuth) {
    return apiClient.put<TenantBrandingSlipLayouts>('/tenant/branding/slip-layouts', payload, authOptions(auth))
  },
}
