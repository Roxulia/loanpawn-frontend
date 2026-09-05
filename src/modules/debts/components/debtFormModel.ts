import { positiveAmount, required } from '../../finance/financeFormat'

export type DebtLinkMode = 'slip' | 'customer'

export type DebtFormState = {
  amount: string
  apply_interest: boolean
  amount_unit: string
  created_account_id: string
  customer_code: string
  description: string
  link_mode: DebtLinkMode
  slip_code: string
  tag: string
  interest_rate: string
  interest_type_id: string
  reporting_exchange_rate: string
  reporting_exchange_rate_inversed: boolean
}

export type DebtFormErrors = Partial<Record<keyof DebtFormState, string>>

export const emptyDebtForm: DebtFormState = {
  amount: '',
  apply_interest: false,
  amount_unit: 'UNIT',
  created_account_id: '',
  customer_code: '',
  description: '',
  link_mode: 'slip',
  slip_code: '',
  tag: '',
  interest_rate: '',
  interest_type_id: '',
  reporting_exchange_rate: '',
  reporting_exchange_rate_inversed: false,
}

export function debtFormToPayload(form: DebtFormState) {
  const slipCode = form.link_mode === 'slip' ? form.slip_code.trim() : ''
  const customerCode = form.link_mode === 'customer' ? form.customer_code.trim() : ''

  return {
    amount: Number(form.amount),
    amount_unit: form.amount_unit,
    ...(form.created_account_id ? { created_account_id: Number(form.created_account_id) } : {}),
    description: form.description.trim(),
    slip_code: slipCode || null,
    customer_code: customerCode || null,
    tag: form.tag.trim() || null,
    apply_interest: form.apply_interest,
    ...(form.apply_interest ? {
      interest_rate: Number(form.interest_rate),
      interest_type_id: Number(form.interest_type_id),
    } : {}),
    ...(form.reporting_exchange_rate ? { reporting_exchange_rate: Number(form.reporting_exchange_rate), reporting_exchange_rate_inversed: form.reporting_exchange_rate_inversed } : {}),
  }
}

export function validateDebtForm(form: DebtFormState) {
  const errors: DebtFormErrors = {}

  if (!required(form.description)) {
    errors.description = 'Description is required.'
  }

  if (!positiveAmount(form.amount)) {
    errors.amount = 'Amount must be greater than zero.'
  }

  if (form.apply_interest && !positiveAmount(form.interest_rate)) {
    errors.interest_rate = 'Interest rate must be greater than zero.'
  }
  if (form.apply_interest && !form.interest_type_id) {
    errors.interest_type_id = 'Interest type is required.'
  }

  return errors
}
