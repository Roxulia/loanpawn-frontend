import type { FormEvent, ReactNode } from 'react'
import { Button, Select, Textarea } from '../../../components/atoms'
import { ActionBar, Card, FinancialAmountInput, FormField, FormGroup } from '../../../components/molecules'
import type { ExpenseTypeOption } from '../../../dataobjects/tenant/finance'
import type { ExpenseFormErrors, ExpenseFormState } from './expenseFormModel'
import { ExpenseImageInput } from './ExpenseImageInput'
import { FinancialAccountSelect } from '../../financialAccounts/components/FinancialAccountSelect'
import { ReportingExchangeRateField } from '../../finance/ReportingExchangeRateField'

type ExpenseFormProps = {
  editing?: boolean
  errors: ExpenseFormErrors
  expenseTypes: ExpenseTypeOption[]
  isLoadingExpenseTypes: boolean
  isSaving: boolean
  onCancel: () => void
  onChange: <TField extends keyof ExpenseFormState>(field: TField, value: ExpenseFormState[TField]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  operationAlert?: ReactNode
  value: ExpenseFormState
}

export function ExpenseForm({
  editing = false,
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
          <FormField id="expense-create-account" label="Payment Account">
            <FinancialAccountSelect id="expense-create-account" onChange={(accountId) => onChange('account_id', accountId)} value={value.account_id} />
          </FormField>
          <ReportingExchangeRateField accountId={value.account_id} inversed={value.reporting_exchange_rate_inversed} manualRate={value.reporting_exchange_rate} onInversedChange={(inversed) => onChange('reporting_exchange_rate_inversed', inversed)} onManualRateChange={(rate) => onChange('reporting_exchange_rate', rate)} />
          <FormField error={errors.amount} helperText={editing ? 'The posted expense amount cannot be changed.' : undefined} id="expense-create-amount" label="Amount">
            <FinancialAmountInput disabled={editing} hasError={Boolean(errors.amount)} id="expense-create-amount" min="0.01" onChange={(next) => { onChange('amount', next.amount); onChange('amount_unit', next.unit) }} step="0.01" value={{ amount: value.amount, unit: value.amount_unit }} />
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
          <FormField error={errors.image_reference} id="expense-create-image-reference" label="Reference image">
            <ExpenseImageInput
              existingImage={value.has_existing_image}
              file={value.image_reference}
              id="expense-create-image-reference"
              isRemoved={value.remove_image_reference}
              onChange={(file) => onChange('image_reference', file)}
              onRemoveChange={(removed) => onChange('remove_image_reference', removed)}
            />
          </FormField>
        </FormGroup>
        <ActionBar>
          <Button onClick={onCancel} variant="secondary">Cancel</Button>
          <Button isLoading={isSaving} type="submit" variant="primary">{editing ? 'Save Changes' : 'Add Expense'}</Button>
        </ActionBar>
      </form>
    </Card>
  )
}

function formatExpenseTypeOption(expenseType: ExpenseTypeOption) {
  return expenseType.code ? `${expenseType.name} (${expenseType.code})` : expenseType.name
}
