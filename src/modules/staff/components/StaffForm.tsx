import type { FormEvent, ReactNode } from 'react'
import { Button, Input, Select } from '../../../components/atoms'
import { ActionBar, Card, FormField, FormGroup, NrcField } from '../../../components/molecules'
import type { StaffFormErrors, StaffFormState } from './staffFormModel'

type StaffFormProps = {
  errors: StaffFormErrors
  isSaving: boolean
  mode: 'create' | 'edit'
  onCancel: () => void
  onChange: <K extends keyof StaffFormState>(field: K, value: StaffFormState[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  operationAlert?: ReactNode
  value: StaffFormState
}

export function StaffForm({
  errors,
  isSaving,
  mode,
  onCancel,
  onChange,
  onSubmit,
  operationAlert,
  value,
}: StaffFormProps) {
  return (
    <Card title={mode === 'create' ? 'Staff details' : 'Edit staff details'} description="Keep login and contact details accurate.">
      {operationAlert}
      <form className="ui-form" onSubmit={onSubmit}>
        <FormGroup columns={2}>
          <FormField error={errors.name} id="staff-name" label="Name">
            <Input hasError={Boolean(errors.name)} id="staff-name" onChange={(event) => onChange('name', event.target.value)} value={value.name} />
          </FormField>
          <FormField error={errors.nrc} id="staff-nrc" label="NRC">
            <NrcField hasError={Boolean(errors.nrc)} id="staff-nrc" onChange={(nextNrc) => onChange('nrc', nextNrc)} required value={value.nrc} />
          </FormField>
          <FormField error={errors.email} id="staff-email" label="Email">
            <Input hasError={Boolean(errors.email)} id="staff-email" onChange={(event) => onChange('email', event.target.value)} type="email" value={value.email} />
          </FormField>
          <FormField error={errors.phone} id="staff-phone" label="Phone">
            <Input hasError={Boolean(errors.phone)} id="staff-phone" onChange={(event) => onChange('phone', event.target.value)} value={value.phone} />
          </FormField>
          <FormField error={errors.status} id="staff-status" label="Status">
            <Select hasError={Boolean(errors.status)} id="staff-status" onChange={(event) => onChange('status', event.target.value)} value={value.status}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>
          <FormField error={errors.address} id="staff-address" label="Address">
            <Input hasError={Boolean(errors.address)} id="staff-address" onChange={(event) => onChange('address', event.target.value)} value={value.address} />
          </FormField>
        </FormGroup>

        <ActionBar>
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button isLoading={isSaving} type="submit" variant="primary">
            {mode === 'create' ? 'Create Staff' : 'Save Staff'}
          </Button>
        </ActionBar>
      </form>
    </Card>
  )
}
