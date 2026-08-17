export type AccountingType = 'incoming' | 'outgoing'

export type AccountingTransaction = {
  id: number
  update_key?: number
  tenant_id: number
  tenantId?: number
  description: string
  transaction_type: AccountingType | string
  transactionType?: AccountingType | string
  transaction_direction?: AccountingType | 'internal' | string
  transactionDirection?: AccountingType | 'internal' | string
  accounting_category?: string | null
  accountingCategory?: string | null
  amount: string
  accounting_day_id?: number | null
  accountingDayId?: number | null
  business_date?: string | null
  businessDate?: string | null
  currency_id?: number | null
  currencyId?: number | null
  reporting_amount?: string | null
  reportingAmount?: string | null
  exchange_rate?: string | null
  exchangeRate?: string | null
  occurred_at?: string | null
  occurredAt?: string | null
  legacy_accounting_id?: number | null
  legacyAccountingId?: number | null
  is_deleted?: boolean
  isDeleted?: boolean
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

export type AccountingDayStatus = 'NOT_OPENED' | 'OPEN' | 'CLOSING' | 'CLOSED'

export type AccountingDay = {
  id: number
  tenant_id: number
  business_date: string
  timezone: string
  status: AccountingDayStatus
  opened_at?: string | null
  opened_by?: number | null
  opening_source?: string | null
  closed_at?: string | null
  closing_source?: string | null
}

export type AccountingDayScheduleDay = {
  weekday: number
  is_enabled: boolean
  open_time: string
  close_time: string
  update_key?: number
}

export type AccountingDaySchedule = {
  timezone: string
  days: AccountingDayScheduleDay[]
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
  start_at?: string
  end_at?: string
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
  account_id?: number | null
  accountId?: number | null
  description: string
  expense_type_id?: number | null
  expense_type_code?: string | null
  expense_type_name?: string | null
  expenseTypeId?: number | null
  expenseTypeCode?: string | null
  expenseTypeName?: string | null
  creator_name?: string | null
  creatorName?: string | null
  has_image_reference?: boolean
  hasImageReference?: boolean
  image_reference_url?: string | null
  imageReferenceUrl?: string | null
  image_reference_url_expires_at?: string | null
  imageReferenceUrlExpiresAt?: string | null
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
  account_id?: number | null
  accountId?: number | null
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
  slipId?: number | null
  slipNo?: string | null
  customer_id?: number | null
  customer_code?: string | null
  customer_name?: string | null
  customerId?: number | null
  customerCode?: string | null
  customerName?: string | null
  amount: string
  description: string
  tag?: string | null
  is_paid: boolean
  created_account_id?: number | null
  createdAccountId?: number | null
  accept_account_id?: number | null
  acceptAccountId?: number | null
  accepted_by?: number | null
  created_by?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export type DashboardTimeFilter = 'this_day' | 'this_week' | 'this_month' | 'custom'

export type DashboardCurrency = {
  id: number | null
  code: string
  symbol: string
}

export type DashboardCurrencyAmount = {
  amount: number
  currency: DashboardCurrency
}

export type DashboardFinancialChartPoint = {
  date: string
  loanAmount: number
  loanAmounts: DashboardCurrencyAmount[]
  debt: number
  returnedAmount: number
  interest: number
  expenses: number
}

export type DashboardLoanAttention = {
  customerName: string
  loanCode: string
  dueDate: string | null
  loanAmount: number
  currency: DashboardCurrency
  overdueDays: number
  riskLevel: 'Low' | 'Medium' | 'High'
  trustPercent: number
}

export type DashboardCollateralCategory = {
  category: string
  value: number
  count: number
  currency: DashboardCurrency
}

export type DashboardCollateralReviewItem = {
  code: string
  itemName: string
  category: string
  estimatedMarketValue: number
  loanAmount: number
  currency: DashboardCurrency
  ltvRatio: number
  status: 'Safe' | 'Low Margin' | 'Expired'
  isJewellery: boolean
  materialTypeId: number | null
  materialTypeName: string | null
  itemCategoryTypeId?: number | null
  itemCategoryTypeName?: string | null
  kyat: number
  pal: number
  yway: number
}

export type TenantDashboardSummary = {
  filters: {
    time_filter: DashboardTimeFilter
    start_at: string
    end_at: string
  }
  financial: {
    cashAvailable: number
    activeLoanAmount: number
    activeLoanAmounts: DashboardCurrencyAmount[]
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
    overdueAmounts: DashboardCurrencyAmount[]
    highRiskCustomers: number
    badRepaymentHistoryCount: number
    loansRequiringAttention: DashboardLoanAttention[]
  }
  collateral: {
    totalCollateralValue: number
    totalCollateralValues: DashboardCurrencyAmount[]
    averageLtvRatio: number
    goldJewelryValue: number
    goldJewelryValues: DashboardCurrencyAmount[]
    expiredCollateralCount: number
    lowMarginCollateralItems: number
    categoryBreakdown: DashboardCollateralCategory[]
    items: DashboardCollateralReviewItem[]
    itemsNeedingReview: DashboardCollateralReviewItem[]
  }
}
