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

export type AccountingOverview = {
  liquid_capital?: number
  liquidCapital?: number
  month_incoming?: number
  monthIncoming?: number
  month_outgoing?: number
  monthOutgoing?: number
  incoming_progress?: number
  incomingProgress?: number
  outgoing_progress?: number
  outgoingProgress?: number
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

export type TenantCapital = {
  id: number
  code: string
  update_key?: number
  updateKey?: number
  tenant_id: number
  amount: string
  description: string
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

export type DashboardTimeFilter = 'this_day' | 'this_week' | 'this_month' | 'custom'

export type DashboardFinancialChartPoint = {
  date: string
  loanAmount: number
  returnedAmount: number
  interest: number
  expenses: number
}

export type DashboardLoanAttention = {
  customerName: string
  loanCode: string
  dueDate: string | null
  loanAmount: number
  overdueDays: number
  riskLevel: 'Low' | 'Medium' | 'High'
  trustPercent: number
}

export type DashboardCollateralCategory = {
  category: string
  value: number
  count: number
}

export type DashboardCollateralReviewItem = {
  code: string
  itemName: string
  category: string
  estimatedMarketValue: number
  loanAmount: number
  ltvRatio: number
  status: 'Safe' | 'Low Margin' | 'Expired'
  isJewellery: boolean
  materialTypeId: number | null
  materialTypeName: string | null
  kyat: number
  pal: number
  yway: number
}

export type TenantDashboardSummary = {
  filters: {
    timeFilter: DashboardTimeFilter
    startDate: string
    endDate: string
  }
  financial: {
    cashAvailable: number
    activeLoanAmount: number
    activeLoanCount: number
    interestCollected: number
    totalIncome: number
    totalExpenses: number
    netProfit: number
    previousIncome: number
    previousExpenses: number
    previousInterestCollected: number
    previousNetProfit: number
    chart: DashboardFinancialChartPoint[]
  }
  risk: {
    dueToday: number
    dueThisWeek: number
    overdueLoans: number
    overdueAmount: number
    highRiskCustomers: number
    badRepaymentHistoryCount: number
    loansRequiringAttention: DashboardLoanAttention[]
  }
  collateral: {
    totalCollateralValue: number
    averageLtvRatio: number
    goldJewelryValue: number
    expiredCollateralCount: number
    lowMarginCollateralItems: number
    categoryBreakdown: DashboardCollateralCategory[]
    items: DashboardCollateralReviewItem[]
    itemsNeedingReview: DashboardCollateralReviewItem[]
  }
}
