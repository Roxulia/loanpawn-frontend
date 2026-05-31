import { nullableNumber, optionalInteger, positiveAmount, required } from '../../finance/financeFormat'

export type ExpenseFormState = {
  amount: string
  description: string
  expense_type_id: string
}

export type ExpenseFormErrors = Partial<Record<keyof ExpenseFormState, string>>

export const emptyExpenseForm: ExpenseFormState = {
  amount: '',
  description: '',
  expense_type_id: '',
}

export function expenseFormToPayload(form: ExpenseFormState) {
  return {
    amount: Number(form.amount),
    description: form.description.trim(),
    expense_type_id: nullableNumber(form.expense_type_id),
  }
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

  return errors
}
