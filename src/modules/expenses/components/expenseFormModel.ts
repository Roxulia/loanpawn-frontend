import { optionalInteger, positiveAmount, required } from '../../finance/financeFormat'

export type ExpenseFormState = {
  account_id: string
  amount: string
  amount_unit: import('../../finance/financialUnits').FinancialUnitCode
  description: string
  expense_type_id: string
  has_existing_image: boolean
  image_reference: File | null
  remove_image_reference: boolean
  reporting_exchange_rate: string
  reporting_exchange_rate_inversed: boolean
}

export type ExpenseFormErrors = Partial<Record<keyof ExpenseFormState, string>>

export const emptyExpenseForm: ExpenseFormState = {
  account_id: '',
  amount: '',
  amount_unit: 'UNIT',
  description: '',
  expense_type_id: '',
  has_existing_image: false,
  image_reference: null,
  remove_image_reference: false,
  reporting_exchange_rate: '',
  reporting_exchange_rate_inversed: false,
}

export function expenseFormToPayload(form: ExpenseFormState) {
  const payload = expenseMetadataToFormData(form)
  payload.set('amount', String(Number(form.amount)))
  payload.set('amount_unit', form.amount_unit)

  return payload
}

export function expenseUpdateToPayload(form: ExpenseFormState) {
  const payload = expenseMetadataToFormData(form)

  if (form.remove_image_reference) {
    payload.set('remove_image_reference', '1')
  }

  return payload
}

export function validateExpenseForm(form: ExpenseFormState) {
  const errors: ExpenseFormErrors = {}

  if (!required(form.description)) {
    errors.description = 'Description is required.'
  }

  if (!positiveAmount(form.amount)) {
    errors.amount = 'Amount must be greater than zero.'
  }

  if (!optionalInteger(form.expense_type_id)) {
    errors.expense_type_id = 'Expense type ID must be a whole number.'
  }

  if (form.image_reference && form.image_reference.size > 5 * 1024 * 1024) {
    errors.image_reference = 'Reference image must not exceed 5 MB.'
  }

  if (form.image_reference && !['image/jpeg', 'image/png', 'image/webp'].includes(form.image_reference.type)) {
    errors.image_reference = 'Reference image must be JPG, PNG, or WebP.'
  }

  return errors
}

function expenseMetadataToFormData(form: ExpenseFormState) {
  const payload = new FormData()
  payload.set('description', form.description.trim())
  payload.set('expense_type_id', form.expense_type_id)
  if (form.account_id) payload.set('account_id', form.account_id)
  if (form.reporting_exchange_rate) {
    payload.set('reporting_exchange_rate', form.reporting_exchange_rate)
    payload.set('reporting_exchange_rate_inversed', form.reporting_exchange_rate_inversed ? '1' : '0')
  }

  if (form.image_reference) {
    payload.set('image_reference', form.image_reference)
  }

  return payload
}
