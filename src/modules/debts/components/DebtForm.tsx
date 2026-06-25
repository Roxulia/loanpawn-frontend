import type { FormEvent, ReactNode } from 'react'
import { Button, Input, Textarea } from '../../../components/atoms'
import { ActionBar, Card, FormField, FormGroup } from '../../../components/molecules'
import type { DebtFormErrors, DebtFormState } from './debtFormModel'

type DebtFormFieldsProps = {
  errors: DebtFormErrors
  onChange: (field: keyof DebtFormState, value: string) => void
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
        <Input hasError={Boolean(errors.amount)} id="debt-amount" min="0.01" onChange={(event) => onChange('amount', event.target.value)} step="0.01" type="number" value={value.amount} />
      </FormField>
      <FormField error={errors.slip_id} helperText="Optional linked slip code." id="debt-slip-id" label="Slip code">
        <Input hasError={Boolean(errors.slip_id)} id="debt-slip-id" onChange={(event) => onChange('slip_id', event.target.value)} type="text" value={value.slip_id} />
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
