export type AccountingType = 'incoming' | 'outgoing'

export type AccountingTransaction = {
  id: number
  update_key?: number
  tenant_id: number
  tenantId?: number
  description: string
  transaction_type: AccountingType | string
  transactionType?: AccountingType | string
  amount: string
  created_by?: number | null
  createdBy?: number | null
  reference_type?: string | null
  referenceType?: string | null
  reference_label?: string | null
  referenceLabel?: string | null
  reference_id?: number | null
  referenceId?: number | null
  created_at?: string | null
  createdAt?: string | null
  updated_at?: string | null
  updatedAt?: string | null
}

export type AccountingLedgerEntry = {
  id: number
  update_key?: number
  created_at?: string | null
  createdAt?: string | null
  description: string
  debit: number
  credit: number
  balance: number
  reference_type?: string | null
  referenceType?: string | null
  reference_label?: string | null
  referenceLabel?: string | null
  reference_id?: number | null
  referenceId?: number | null
}

export type AccountingLedger = {
  entries: AccountingLedgerEntry[]
  start_date?: string
  startDate?: string
  end_date?: string
  endDate?: string
  tenant_name?: string | null
  tenantName?: string | null
  opening_balance?: number
  openingBalance?: number
  total_debit?: number
  totalDebit?: number
  total_credit?: number
  totalCredit?: number
  final_balance?: number
  finalBalance?: number
  current_page?: number
  currentPage?: number
  last_page?: number
  lastPage?: number
  per_page?: number
  perPage?: number
  total: number
}

export type TenantExpense = {
  id: number
  code: string
  update_key?: number
  updateKey?: number
  tenant_id: number
  amount: string
  description: string
  expense_type_id?: number | null
  expense_type_code?: string | null
  expense_type_name?: string | null
  created_by?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export type ExpenseTypeOption = {
  id: number
  tenant_id?: number | null
  tenantId?: number | null
  code?: string | null
  name: string
  is_default?: boolean
  isDefault?: boolean
}

export type TenantDebt = {
  id: number
  code: string
  update_key?: number
  updateKey?: number
  change_amount?: number
  changeAmount?: number
  tenant_id: number
  slip_id?: number | null
  slip_no?: string | null
  amount: string
  description: string
  tag?: string | null
  is_paid: boolean
  accepted_by?: number | null
  created_by?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export type DashboardNearlyExpiredSlip = {
  slipNo: string
  customerName: string
  loanAmount: number
  expireDate: string | null
  daysRemaining: number
}

export type DashboardTrustedCustomer = {
  code: string
  name: string
  trustScore: number | null
  activeLoanAmount: number
  activeSlipCount: number
}

export type DashboardCustomerLoanUsage = {
  code: string
  name: string
  totalLoanAmount: number
  activeLoanAmount: number
  slipCount: number
  lastLoanDate: string | null
}

export type DashboardRecentExpense = {
  code: string
  description: string
  amount: number
  expenseTypeName: string | null
  createdAt: string | null
}

export type DashboardExpenseTypeTotal = {
  name: string
  total: number
}

export type TenantDashboardSummary = {
  financial: {
    todayIncome: number
    todayExpense: number
    netToday: number
    activeLoanPrincipal: number
    outstandingDebt: number
  }
  collateral: {
    totalItems: number
    jewelleryItems: number
    normalItems: number
    activeItems: number
    redeemedItems: number
    confiscatedItems: number
    estimatedValue: number
  }
  loans: {
    activeSlips: number
    expiredSlips: number
    redeemedSlips: number
    nearlyExpiredSlips: DashboardNearlyExpiredSlip[]
  }
  customers: {
    totalCustomers: number
    trustedCustomers: DashboardTrustedCustomer[]
    topLoanUsage: DashboardCustomerLoanUsage[]
  }
  expenses: {
    todayTotal: number
    monthTotal: number
    recent: DashboardRecentExpense[]
    byType: DashboardExpenseTypeTotal[]
  }
}
