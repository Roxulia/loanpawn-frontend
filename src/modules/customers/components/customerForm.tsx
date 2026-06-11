import type { FormEvent, ReactNode } from 'react'
import { Button, Input, Textarea } from '../../../components/atoms'
import { ActionBar, Card, FormField, FormGroup, NrcField } from '../../../components/molecules'
import type { CustomerFormErrors, CustomerFormState } from './customerFormModel'

type CustomerFormProps = {
  cancelLabel?: string
  errors: CustomerFormErrors
  isSaving: boolean
  mode: 'create' | 'edit'
  onCancel: () => void
  onChange: <K extends keyof CustomerFormState>(field: K, value: CustomerFormState[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  operationAlert?: ReactNode
  value: CustomerFormState
}

export function CustomerForm({
  cancelLabel = 'Cancel',
  errors,
  isSaving,
  mode,
  onCancel,
  onChange,
  onSubmit,
  operationAlert,
  value,
}: CustomerFormProps) {
  return (
    <Card
      title={mode === 'create' ? 'Customer details' : 'Edit customer details'}
      description="Keep customer identity and contact data accurate for loan slip workflows."
    >
      {operationAlert}
      <form className="ui-form" onSubmit={onSubmit}>
        <FormGroup columns={2}>
          <FormField error={errors.name} id="customer-name" label="Name">
            <Input
              autoComplete="name"
              hasError={Boolean(errors.name)}
              id="customer-name"
              onChange={(event) => onChange('name', event.target.value)}
              value={value.name}
            />
          </FormField>
          <FormField error={errors.phone} id="customer-phone" label="Phone">
            <Input
              autoComplete="tel"
              hasError={Boolean(errors.phone)}
              id="customer-phone"
              onChange={(event) => onChange('phone', event.target.value)}
              value={value.phone}
            />
          </FormField>
          <FormField error={errors.nrc} id="customer-nrc" label="NRC">
            <NrcField hasError={Boolean(errors.nrc)} id="customer-nrc" onChange={(nextNrc) => onChange('nrc', nextNrc)} value={value.nrc} />
          </FormField>
          <FormField error={errors.email} id="customer-email" label="Email">
            <Input
              autoComplete="email"
              hasError={Boolean(errors.email)}
              id="customer-email"
              onChange={(event) => onChange('email', event.target.value)}
              type="email"
              value={value.email}
            />
          </FormField>
          <FormField error={errors.address} id="customer-address" label="Address">
            <Textarea
              hasError={Boolean(errors.address)}
              id="customer-address"
              onChange={(event) => onChange('address', event.target.value)}
              rows={3}
              value={value.address}
            />
          </FormField>
          <FormField error={errors.note} id="customer-note" label="Note">
            <Textarea
              hasError={Boolean(errors.note)}
              id="customer-note"
              onChange={(event) => onChange('note', event.target.value)}
              rows={3}
              value={value.note}
            />
          </FormField>
        </FormGroup>

        <ActionBar>
          <Button onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button isLoading={isSaving} type="submit" variant="primary">
            {mode === 'create' ? 'Create Customer' : 'Save Changes'}
          </Button>
        </ActionBar>
      </form>
    </Card>
  )
}
