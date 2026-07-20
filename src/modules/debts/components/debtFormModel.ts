import { positiveAmount, required } from '../../finance/financeFormat'

export type DebtLinkMode = 'slip' | 'customer'

export type DebtFormState = Record<string, string> & {
  amount: string
  customer_code: string
  description: string
  link_mode: DebtLinkMode
  slip_code: string
  tag: string
}

export type DebtFormErrors = Partial<Record<keyof DebtFormState, string>>

export const emptyDebtForm: DebtFormState = {
  amount: '',
  customer_code: '',
  description: '',
  link_mode: 'slip',
  slip_code: '',
  tag: '',
}

export function debtFormToPayload(form: DebtFormState) {
  const slipCode = form.link_mode === 'slip' ? form.slip_code.trim() : ''
  const customerCode = form.link_mode === 'customer' ? form.customer_code.trim() : ''

  return {
    amount: Number(form.amount),
    description: form.description.trim(),
    slip_code: slipCode || null,
    customer_code: customerCode || null,
    tag: form.tag.trim() || null,
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

  return errors
}
