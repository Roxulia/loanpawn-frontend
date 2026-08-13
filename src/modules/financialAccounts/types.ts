export type FinancialAccountOption = { id: number; code: string; name: string }

export type FinancialAccount = {
  id: number
  account_code: string
  account_name: string
  account_number: string | null
  balance: string
  is_active: boolean
  is_default: boolean
  is_deleted: boolean
  allow_negative_balance: boolean
  update_key: number
  account_type: FinancialAccountOption
  currency: FinancialAccountOption & { symbol?: string | null }
}

export type FinancialAccountPage = {
  items: FinancialAccount[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type FinancialAccountTransactionType =
  | 'OPENING_BALANCE' | 'PAWN_LOAN_CREATION' | 'PAWN_INTEREST_PAYMENT' | 'PAWN_REDEMPTION'
  | 'DEBT_CREATION' | 'DEBT_PAYMENT' | 'BUSINESS_LOAN_RECEIPT' | 'BUSINESS_LOAN_PAYMENT'
  | 'EXPENSE_PAYMENT' | 'CAPITAL_CONTRIBUTION' | 'CAPITAL_WITHDRAWAL' | 'ACCOUNT_TRANSFER'
  | 'TRANSFER_FEE' | 'ADJUSTMENT' | 'REVERSAL'

export type FinancialAccountTransaction = {
  id: number
  transaction_type: FinancialAccountTransactionType
  amount: string
  direction: 'debit' | 'credit'
  reference_number: string | null
  reference_type: string | null
  note: string | null
  creator: { id: number; name: string } | null
  related_transaction_id: number | null
  reversed_transaction_id: number | null
  created_at: string | null
}

export type FinancialAccountTransactionPage = {
  items: FinancialAccountTransaction[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type FinancialAccountTransactionFilters = {
  page?: number
  perPage?: number
  search?: string
  direction?: 'debit' | 'credit'
  transactionType?: FinancialAccountTransactionType
  startAt?: string
  endAt?: string
}

export type FinancialAccountCreatePayload = {
  account_type: string
  currency_type: string
  account_name: string
  balance?: number
  allow_negative_balance?: boolean
  account_number?: string | null
}

export type FinancialAccountUpdatePayload = {
  name: string
  is_active: boolean
  is_default: boolean
  account_number: string | null
  update_key: number
}

export type FinancialAccountTransfer = {
  id: number
  from_account: TransferAccountSnapshot
  to_account: TransferAccountSnapshot
  from_amount: string
  to_amount: string
  exchange_rate: string | null
  fee_amount: string
  note: string | null
  transferred_at: string | null
}

export type TransferAccountSnapshot = {
  id: number
  code: string
  name: string
  balance: string
  currency: { id: number; code: string; symbol?: string | null }
}

export type FinancialAccountTransferPage = {
  items: FinancialAccountTransfer[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type FinancialAccountTransferPayload = {
  from_account_id: number
  to_account_id: number
  from_amount: number
  exchange_rate?: number
  fee_amount?: number
  note?: string
}
