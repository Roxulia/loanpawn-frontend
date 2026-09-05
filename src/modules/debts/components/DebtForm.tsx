import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Button, Input, Select, Textarea } from '../../../components/atoms'
import { ActionBar, Card, FinancialAmountInput, FormField, FormGroup } from '../../../components/molecules'
import type { DebtFormErrors, DebtFormState } from './debtFormModel'
import { CustomerSearchField } from './CustomerSearchField'
import { FinancialAccountSelect } from '../../financialAccounts/components/FinancialAccountSelect'
import { ReportingExchangeRateField } from '../../finance/ReportingExchangeRateField'
import { slipService, type InterestType } from '../../slips/services/slipService'

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

export function DebtFormFields(props: DebtFormFieldsProps) {
  const interestTypes = useInterestTypes()
  return <FormGroup columns={2}>{debtFields(props, interestTypes, 'debt')}</FormGroup>
}

export function DebtForm({ errors, isSaving, onCancel, onChange, onSubmit, operationAlert, value }: DebtFormProps) {
  const interestTypes = useInterestTypes()
  const props = { errors, onChange, value }
  return <Card title="Debt Details">
    {operationAlert}
    <form className="ui-form debt-create-form" onSubmit={onSubmit}>
      <DebtCreateDesktopFields interestTypes={interestTypes} {...props} />
      <DebtCreateMobileFields interestTypes={interestTypes} {...props} />
      <ActionBar><Button onClick={onCancel} variant="secondary">Cancel</Button><Button isLoading={isSaving} type="submit" variant="primary">Add Debt</Button></ActionBar>
    </form>
  </Card>
}

type CreateFieldsProps = DebtFormFieldsProps & { interestTypes: InterestType[] }

function DebtCreateDesktopFields(props: CreateFieldsProps) {
  return <div className="debt-create-fields debt-create-fields--desktop"><DebtCreateSections idPrefix="debt-create-desktop" {...props} /></div>
}

function DebtCreateMobileFields(props: CreateFieldsProps) {
  return <div className="debt-create-fields debt-create-fields--mobile"><DebtCreateSections idPrefix="debt-create-mobile" mobile {...props} /></div>
}

function DebtCreateSections({ errors, idPrefix, interestTypes, mobile = false, onChange, value }: CreateFieldsProps & { idPrefix: string; mobile?: boolean }) {
  return <>
    <FormGroup className="debt-create-section debt-create-section--financial" columns={mobile ? 1 : 2} description="Set the debt value and the account that records it." title="Financial Details">
      {amountField(errors, onChange, value, `${idPrefix}-amount`)}
      {accountField(errors, onChange, value, `${idPrefix}-account`)}
      <ReportingExchangeRateField accountId={value.created_account_id} inversed={value.reporting_exchange_rate_inversed} manualRate={value.reporting_exchange_rate} onInversedChange={(inversed) => onChange('reporting_exchange_rate_inversed', inversed)} onManualRateChange={(rate) => onChange('reporting_exchange_rate', rate)} />
    </FormGroup>
    <FormGroup className="debt-create-section debt-create-section--reference" columns={mobile ? 1 : 2} description="Optionally connect the debt to a slip or customer and explain why it was created." title="Debt Reference">
      {linkField(errors, onChange, value, `${idPrefix}-link`)}
      {tagField(errors, onChange, value, `${idPrefix}-tag`)}
      {descriptionField(errors, onChange, value, `${idPrefix}-description`)}
    </FormGroup>
    <FormGroup className="debt-create-section debt-create-section--interest" columns={mobile ? 1 : 2} description="Apply fixed recurring interest only when this debt requires it." title="Interest Settings">
      {interestFields(errors, interestTypes, onChange, value, `${idPrefix}-interest`)}
    </FormGroup>
  </>
}

function debtFields({ errors, onChange, value }: DebtFormFieldsProps, interestTypes: InterestType[], prefix: string) {
  return <>
    {amountField(errors, onChange, value, `${prefix}-amount`)}
    {accountField(errors, onChange, value, `${prefix}-account`)}
    <ReportingExchangeRateField accountId={value.created_account_id} inversed={value.reporting_exchange_rate_inversed} manualRate={value.reporting_exchange_rate} onInversedChange={(inversed) => onChange('reporting_exchange_rate_inversed', inversed)} onManualRateChange={(rate) => onChange('reporting_exchange_rate', rate)} />
    {linkField(errors, onChange, value, `${prefix}-link`)}
    {tagField(errors, onChange, value, `${prefix}-tag`)}
    {descriptionField(errors, onChange, value, `${prefix}-description`)}
    {interestFields(errors, interestTypes, onChange, value, `${prefix}-interest`)}
  </>
}

function amountField(errors: DebtFormErrors, onChange: DebtFormFieldsProps['onChange'], value: DebtFormState, id: string) {
  return <FormField error={errors.amount} id={id} label="Amount"><FinancialAmountInput hasError={Boolean(errors.amount)} id={id} min="0.01" onChange={(next) => { onChange('amount', next.amount); onChange('amount_unit', next.unit) }} step="0.01" value={{ amount: value.amount, unit: value.amount_unit as import('../../finance/financialUnits').FinancialUnitCode }} /></FormField>
}

function accountField(errors: DebtFormErrors, onChange: DebtFormFieldsProps['onChange'], value: DebtFormState, id: string) {
  return <FormField error={errors.created_account_id} helperText="The debt is recorded in this account's currency." id={id} label="Created Account"><FinancialAccountSelect hasError={Boolean(errors.created_account_id)} id={id} onChange={(accountId) => onChange('created_account_id', accountId)} value={value.created_account_id} /></FormField>
}

function linkField(errors: DebtFormErrors, onChange: DebtFormFieldsProps['onChange'], value: DebtFormState, id: string) {
  return <FormField error={errors.slip_code ?? errors.customer_code} helperText="Optional link for this debt." id={id} label="Debt link"><div className="debt-link-field"><div className="debt-link-field__toggle" role="group" aria-label="Debt link type"><Button aria-pressed={value.link_mode === 'slip'} className="debt-link-field__toggle-button" onClick={() => { onChange('link_mode', 'slip'); onChange('customer_code', '') }} variant={value.link_mode === 'slip' ? 'primary' : 'secondary'}>Slip</Button><Button aria-pressed={value.link_mode === 'customer'} className="debt-link-field__toggle-button" onClick={() => { onChange('link_mode', 'customer'); onChange('slip_code', '') }} variant={value.link_mode === 'customer' ? 'primary' : 'secondary'}>Customer</Button></div>{value.link_mode === 'customer' ? <CustomerSearchField hasError={Boolean(errors.customer_code)} id={`${id}-customer`} onChange={(customerCode) => onChange('customer_code', customerCode)} value={value.customer_code} /> : <Input hasError={Boolean(errors.slip_code)} id={`${id}-slip`} onChange={(event) => onChange('slip_code', event.target.value)} type="text" value={value.slip_code} />}</div></FormField>
}

function tagField(errors: DebtFormErrors, onChange: DebtFormFieldsProps['onChange'], value: DebtFormState, id: string) {
  return <FormField error={errors.tag} helperText="Example: unpaid_interest" id={id} label="Tag"><Input hasError={Boolean(errors.tag)} id={id} onChange={(event) => onChange('tag', event.target.value)} value={value.tag} /></FormField>
}

function descriptionField(errors: DebtFormErrors, onChange: DebtFormFieldsProps['onChange'], value: DebtFormState, id: string) {
  return <FormField error={errors.description} id={id} label="Description"><Textarea hasError={Boolean(errors.description)} id={id} onChange={(event) => onChange('description', event.target.value)} value={value.description} /></FormField>
}

function interestFields(errors: DebtFormErrors, interestTypes: InterestType[], onChange: DebtFormFieldsProps['onChange'], value: DebtFormState, id: string) {
  return <><FormField id={`${id}-apply`} label="Interest"><label className="debt-interest-toggle"><input checked={value.apply_interest} onChange={(event) => onChange('apply_interest', event.target.checked)} type="checkbox" /><span>Apply fixed interest from the creation date</span></label></FormField>{value.apply_interest && <div className="debt-interest-fields"><FormField error={errors.interest_rate} id={`${id}-rate`} label="Interest Rate"><Input hasError={Boolean(errors.interest_rate)} id={`${id}-rate`} min="0.01" onChange={(event) => onChange('interest_rate', event.target.value)} step="0.01" type="number" value={value.interest_rate} /></FormField><FormField error={errors.interest_type_id} id={`${id}-type`} label="Interest Type"><Select hasError={Boolean(errors.interest_type_id)} id={`${id}-type`} onChange={(event) => onChange('interest_type_id', event.target.value)} value={value.interest_type_id}><option value="">Select interest type</option>{interestTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</Select></FormField></div>}</>
}

function useInterestTypes() {
  const [interestTypes, setInterestTypes] = useState<InterestType[]>([])
  useEffect(() => { void slipService.listInterestTypes().then(setInterestTypes).catch(() => setInterestTypes([])) }, [])
  return interestTypes
}
