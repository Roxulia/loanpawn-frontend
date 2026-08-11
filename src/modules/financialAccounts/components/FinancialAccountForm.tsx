import type { FormEvent, ReactNode } from 'react'
import { Button, Input, Select } from '../../../components/atoms'
import { FormField, FormGroup } from '../../../components/molecules'
import { FormPanel } from '../../../components/organisms'
import type { Currency } from '../../currency/types'
import type { DefaultTypeOption } from '../../settings/services/settingsService'

export type FinancialAccountFormState = {
  account_type: string; currency_type: string; account_name: string; balance: string
  allow_negative_balance: boolean; account_number: string; is_active: boolean; is_default: boolean
}

type Props = {
  value: FinancialAccountFormState
  accountTypes: DefaultTypeOption[]
  currencies: Currency[]
  editing?: boolean
  isSaving: boolean
  alert?: ReactNode
  onChange: <K extends keyof FinancialAccountFormState>(field: K, value: FinancialAccountFormState[K]) => void
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function FinancialAccountForm({ value, accountTypes, currencies, editing = false, isSaving, alert, onChange, onCancel, onSubmit }: Props) {
  return <FormPanel title={editing ? 'Account details' : 'New account details'} description={editing ? 'Only the account name, number, status, and default selection can be changed.' : 'Choose the account type and currency for the new account.'} onSubmit={onSubmit} actions={<><Button onClick={onCancel}>Cancel</Button><Button isLoading={isSaving} type="submit" variant="primary">{editing ? 'Save changes' : 'Create account'}</Button></>}>
    {alert}
    <FormGroup columns={2}>
      <FormField id="account-name" label="Account name"><Input id="account-name" required maxLength={100} value={value.account_name} onChange={(event) => onChange('account_name', event.target.value)} /></FormField>
      <FormField id="account-number" label="Account number" helperText="Optional"><Input id="account-number" maxLength={50} value={value.account_number} onChange={(event) => onChange('account_number', event.target.value)} /></FormField>
      {!editing && <FormField id="account-type" label="Account type"><Select id="account-type" required value={value.account_type} onChange={(event) => onChange('account_type', event.target.value)}><option value="">Select account type</option>{accountTypes.map((item) => <option key={item.id} value={item.code ?? ''}>{item.name}</option>)}</Select></FormField>}
      {!editing && <FormField id="currency-type" label="Currency"><Select id="currency-type" required value={value.currency_type} onChange={(event) => onChange('currency_type', event.target.value)}><option value="">Select currency</option>{currencies.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.code}>{item.code} — {item.name}</option>)}</Select></FormField>}
      {!editing && <FormField id="opening-balance" label="Opening balance" helperText="Optional; defaults to zero"><Input id="opening-balance" min="0" step="0.01" type="number" value={value.balance} onChange={(event) => onChange('balance', event.target.value)} /></FormField>}
    </FormGroup>
    <FormGroup columns={1}>
      {!editing && <label><input checked={value.allow_negative_balance} type="checkbox" onChange={(event) => onChange('allow_negative_balance', event.target.checked)} /> Allow negative balance</label>}
      {editing && <label><input checked={value.is_active} type="checkbox" onChange={(event) => onChange('is_active', event.target.checked)} /> Active</label>}
      {editing && <label><input checked={value.is_default} type="checkbox" onChange={(event) => onChange('is_default', event.target.checked)} /> Default account</label>}
    </FormGroup>
  </FormPanel>
}
