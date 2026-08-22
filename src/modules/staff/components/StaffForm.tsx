import type { FormEvent, ReactNode } from 'react'
import { Button, Input, Select } from '../../../components/atoms'
import { ActionBar, Card, FormField, FormGroup, NrcField } from '../../../components/molecules'
import type { TenantRoleOption } from '../../../dataobjects/tenant/staff'
import type { StaffFormErrors, StaffFormState } from './staffFormModel'

type StaffFormProps = {
  disabled?: boolean
  errors: StaffFormErrors
  isLoadingRoles?: boolean
  isSaving: boolean
  mode: 'create' | 'edit'
  onChange: <K extends keyof StaffFormState>(field: K, value: StaffFormState[K]) => void
  onReset: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  operationAlert?: ReactNode
  isRoleOptionDisabled?: (role: TenantRoleOption) => boolean
  roleDisabled?: boolean
  roleOptions: TenantRoleOption[]
  value: StaffFormState
}

export function StaffForm({
  disabled = false,
  errors,
  isLoadingRoles = false,
  isSaving,
  mode,
  onChange,
  onReset,
  onSubmit,
  operationAlert,
  isRoleOptionDisabled,
  roleDisabled = false,
  roleOptions,
  value,
}: StaffFormProps) {
  const isRoleUnavailable = isLoadingRoles || roleOptions.length === 0

  return (
    <Card title={mode === 'create' ? 'Staff details' : 'Edit staff details'} description="Keep login and contact details accurate.">
      {operationAlert}
      <form className="ui-form" onSubmit={onSubmit}>
        <FormGroup columns={2}>
          <FormField error={errors.name} id="staff-name" label="Name">
            <Input disabled={disabled} hasError={Boolean(errors.name)} id="staff-name" onChange={(event) => onChange('name', event.target.value)} value={value.name} />
          </FormField>
          <FormField error={errors.nrc} id="staff-nrc" label="NRC">
            <NrcField disabled={disabled} hasError={Boolean(errors.nrc)} id="staff-nrc" onChange={(nextNrc) => onChange('nrc', nextNrc)} required value={value.nrc} />
          </FormField>
          <FormField error={errors.email} id="staff-email" label="Email">
            <Input disabled={disabled} hasError={Boolean(errors.email)} id="staff-email" onChange={(event) => onChange('email', event.target.value)} type="email" value={value.email} />
          </FormField>
          <FormField error={errors.phone} id="staff-phone" label="Phone">
            <Input disabled={disabled} hasError={Boolean(errors.phone)} id="staff-phone" onChange={(event) => onChange('phone', event.target.value)} value={value.phone} />
          </FormField>
          <FormField error={errors.role_id} id="staff-role" label="Role">
            <Select
              disabled={disabled || roleDisabled || isRoleUnavailable}
              hasError={Boolean(errors.role_id)}
              id="staff-role"
              onChange={(event) => onChange('role_id', event.target.value)}
              value={value.role_id}
            >
              <option value="">{isLoadingRoles ? 'Loading roles...' : 'Select role'}</option>
              {roleOptions.map((role) => (
                <option disabled={isRoleOptionDisabled?.(role)} key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField error={errors.address} id="staff-address" label="Address">
            <Input disabled={disabled} hasError={Boolean(errors.address)} id="staff-address" onChange={(event) => onChange('address', event.target.value)} value={value.address} />
          </FormField>
        </FormGroup>

        <ActionBar>
          <Button disabled={disabled} onClick={onReset} variant="secondary">
            Reset Changes
          </Button>
          <Button disabled={disabled || isRoleUnavailable} isLoading={isSaving} type="submit" variant="primary">
            {mode === 'create' ? 'Create Staff' : 'Save Staff'}
          </Button>
        </ActionBar>
      </form>
    </Card>
  )
}
