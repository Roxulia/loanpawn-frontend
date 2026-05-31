import { nullableNumber, optionalInteger, positiveAmount, required } from '../../finance/financeFormat'

export type DebtFormState = Record<string, string> & {
  amount: string
  description: string
  slip_id: string
  tag: string
}

export type DebtFormErrors = Partial<Record<keyof DebtFormState, string>>

export const emptyDebtForm: DebtFormState = {
  amount: '',
  description: '',
  slip_id: '',
  tag: '',
}

export function debtFormToPayload(form: DebtFormState) {
  return {
    amount: Number(form.amount),
    description: form.description.trim(),
    slip_id: nullableNumber(form.slip_id),
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

  if (!optionalInteger(form.slip_id)) {
    errors.slip_id = 'Slip ID must be a whole number.'
  }

  return errors
}
