import type { FormEvent, ReactNode } from 'react'
import { Button, Input, Textarea } from '../../../components/atoms'
import { ActionBar, Card, FinancialAmountInput, FormField, FormGroup } from '../../../components/molecules'
import type { DebtFormErrors, DebtFormState } from './debtFormModel'
import { CustomerSearchField } from './CustomerSearchField'
import { FinancialAccountSelect } from '../../financialAccounts/components/FinancialAccountSelect'
import { ReportingExchangeRateField } from '../../finance/ReportingExchangeRateField'

type DebtFormFieldsProps = {
  errors: DebtFormErrors
  onChange: <TField extends keyof DebtFormState>(field: TField, value: DebtFormState[TField]) => void
  value: DebtFormState
}

type DebtFormProps = DebtFormFieldsProps & {
  isSaving: boolean
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  operationAlert?: ReactNode
}

export function DebtFormFields({ errors, onChange, value }: DebtFormFieldsProps) {
  return (
    <FormGroup columns={2}>
      <FormField error={errors.amount} id="debt-amount" label="Amount">
        <FinancialAmountInput hasError={Boolean(errors.amount)} id="debt-amount" min="0.01" onChange={(next) => { onChange('amount', next.amount); onChange('amount_unit', next.unit) }} step="0.01" value={{ amount: value.amount, unit: value.amount_unit as import('../../finance/financialUnits').FinancialUnitCode }} />
      </FormField>
      <FormField error={errors.created_account_id} helperText="The debt is recorded in this account's currency." id="debt-created-account" label="Created Account">
        <FinancialAccountSelect hasError={Boolean(errors.created_account_id)} id="debt-created-account" onChange={(accountId) => onChange('created_account_id', accountId)} value={value.created_account_id} />
      </FormField>
      <ReportingExchangeRateField accountId={value.created_account_id} inversed={value.reporting_exchange_rate_inversed} manualRate={value.reporting_exchange_rate} onInversedChange={(inversed) => onChange('reporting_exchange_rate_inversed', inversed)} onManualRateChange={(rate) => onChange('reporting_exchange_rate', rate)} />
      <FormField error={errors.slip_code ?? errors.customer_code} helperText="Optional link for this debt." id="debt-link" label="Debt link">
        <div className="debt-link-field">
          <div className="debt-link-field__toggle" role="group" aria-label="Debt link type">
            <Button
              aria-pressed={value.link_mode === 'slip'}
              className="debt-link-field__toggle-button"
              onClick={() => {
                onChange('link_mode', 'slip')
                onChange('customer_code', '')
              }}
              variant={value.link_mode === 'slip' ? 'primary' : 'secondary'}
            >
              Slip
            </Button>
            <Button
              aria-pressed={value.link_mode === 'customer'}
              className="debt-link-field__toggle-button"
              onClick={() => {
                onChange('link_mode', 'customer')
                onChange('slip_code', '')
              }}
              variant={value.link_mode === 'customer' ? 'primary' : 'secondary'}
            >
              Customer
            </Button>
          </div>
          {value.link_mode === 'customer' ? (
            <CustomerSearchField
              hasError={Boolean(errors.customer_code)}
              id="debt-customer-code"
              onChange={(customerCode) => onChange('customer_code', customerCode)}
              value={value.customer_code}
            />
          ) : (
            <Input hasError={Boolean(errors.slip_code)} id="debt-slip-code" onChange={(event) => onChange('slip_code', event.target.value)} type="text" value={value.slip_code} />
          )}
        </div>
      </FormField>
      <FormField error={errors.tag} helperText="Example: unpaid_interest" id="debt-tag" label="Tag">
        <Input hasError={Boolean(errors.tag)} id="debt-tag" onChange={(event) => onChange('tag', event.target.value)} value={value.tag} />
      </FormField>
      <FormField error={errors.description} id="debt-description" label="Description">
        <Textarea hasError={Boolean(errors.description)} id="debt-description" onChange={(event) => onChange('description', event.target.value)} value={value.description} />
      </FormField>
    </FormGroup>
  )
}

export function DebtForm({ errors, isSaving, onCancel, onChange, onSubmit, operationAlert, value }: DebtFormProps) {
  return (
    <Card title="Debt Details">
      {operationAlert}
      <form className="ui-form" onSubmit={onSubmit}>
        <DebtFormFields errors={errors} onChange={onChange} value={value} />
        <ActionBar>
          <Button onClick={onCancel} variant="secondary">Cancel</Button>
          <Button isLoading={isSaving} type="submit" variant="primary">Add Debt</Button>
        </ActionBar>
      </form>
    </Card>
  )
}
