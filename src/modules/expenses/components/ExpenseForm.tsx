import type { FormEvent, ReactNode } from 'react'
import { Button, Input, Select, Textarea } from '../../../components/atoms'
import { ActionBar, Card, FormField, FormGroup } from '../../../components/molecules'
import type { ExpenseTypeOption } from '../../../dataobjects/tenant/finance'
import type { ExpenseFormErrors, ExpenseFormState } from './expenseFormModel'

type ExpenseFormProps = {
  errors: ExpenseFormErrors
  expenseTypes: ExpenseTypeOption[]
  isLoadingExpenseTypes: boolean
  isSaving: boolean
  onCancel: () => void
  onChange: (field: keyof ExpenseFormState, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  operationAlert?: ReactNode
  value: ExpenseFormState
}

export function ExpenseForm({
  errors,
  expenseTypes,
  isLoadingExpenseTypes,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
  operationAlert,
  value,
}: ExpenseFormProps) {
  return (
    <Card title="Expense Details">
      {operationAlert}
      <form className="ui-form" onSubmit={onSubmit}>
        <FormGroup columns={2}>
          <FormField error={errors.amount} id="expense-create-amount" label="Amount">
            <Input hasError={Boolean(errors.amount)} id="expense-create-amount" min="0.01" onChange={(event) => onChange('amount', event.target.value)} step="0.01" type="number" value={value.amount} />
          </FormField>
          <FormField error={errors.expense_type_id} id="expense-create-type-id" label="Expense type">
            <Select disabled={isLoadingExpenseTypes} hasError={Boolean(errors.expense_type_id)} id="expense-create-type-id" onChange={(event) => onChange('expense_type_id', event.target.value)} value={value.expense_type_id}>
              <option value="">{isLoadingExpenseTypes ? 'Loading expense types...' : 'No expense type'}</option>
              {expenseTypes.map((expenseType) => (
                <option key={expenseType.id} value={expenseType.id}>{formatExpenseTypeOption(expenseType)}</option>
              ))}
            </Select>
          </FormField>
          <FormField error={errors.description} id="expense-create-description" label="Description">
            <Textarea hasError={Boolean(errors.description)} id="expense-create-description" onChange={(event) => onChange('description', event.target.value)} value={value.description} />
          </FormField>
        </FormGroup>
        <ActionBar>
          <Button onClick={onCancel} variant="secondary">Cancel</Button>
          <Button isLoading={isSaving} type="submit" variant="primary">Add Expense</Button>
        </ActionBar>
      </form>
    </Card>
  )
}

function formatExpenseTypeOption(expenseType: ExpenseTypeOption) {
  return expenseType.code ? `${expenseType.name} (${expenseType.code})` : expenseType.name
}
