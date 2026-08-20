/* eslint-disable react-refresh/only-export-components */
import { Badge, Textarea } from '../../../components/atoms'
import { FinancialAmountInput, FormField, FormGroup } from '../../../components/molecules'
import type { DataTableColumn } from '../../../components/organisms'
import type { TenantCapital } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { LocalizedText } from '../../../locales/UiLocale'
import {
  FinanceResourcePage,
  type FinanceFormErrors,
  type FinanceFormState,
  type FinanceResourcePageConfig,
} from '../../finance/FinanceResourcePage'
import {
  formatDate,
  getNumberField,
  getStringField,
  positiveAmount,
  required,
} from '../../finance/financeFormat'
import { FinancialAccountSelect } from '../../financialAccounts/components/FinancialAccountSelect'
import { AccountCurrencyAmount } from '../../finance/AccountCurrencyAmount'
import { FinanceHistoryMobileCard } from '../../finance/FinanceHistoryMobileCard'
import { ReportingExchangeRateField } from '../../finance/ReportingExchangeRateField'
import { routePaths } from '../../../app/routes/paths'

export type CapitalForm = FinanceFormState & {
  account_id: string
  amount: string
  amount_unit: import('../../finance/financialUnits').FinancialUnitCode
  description: string
  reporting_exchange_rate: string
  reporting_exchange_rate_inversed: boolean
}

export const initialCapitalForm: CapitalForm = {
  account_id: '',
  amount: '',
  amount_unit: 'UNIT',
  description: '',
  reporting_exchange_rate: '',
  reporting_exchange_rate_inversed: false,
}

const columns: Array<DataTableColumn<TenantCapital>> = [
  {
    header: 'Description',
    key: 'description',
    render: (item) => <strong>{item.description}</strong>,
  },
  {
    header: 'Amount',
    key: 'amount',
    render: (item) => <AccountCurrencyAmount accountId={item.account_id ?? item.accountId} amount={item.amount} />,
  },
  {
    header: 'Accounting effect',
    key: 'accountingEffect',
    render: () => <Badge tone="success">Incoming</Badge>,
  },
  {
    header: 'Created',
    key: 'created',
    render: (item) => formatDate(getStringField(item, 'created_at', 'createdAt')),
  },
]

const config: FinanceResourcePageConfig<TenantCapital, CapitalForm> = {
  cardTitle: 'Shop capital',
  columns,
  createLabel: 'Add Capital',
  createPermission: 'create_capital',
  deleteLabel: 'Delete Capital',
  deleteMessage: (item) => `Delete capital "${item.description}"? This action cannot be undone.`,
  deletePermission: 'delete_capital',
  emptyDescription: 'No shop capital entries found.',
  emptyTitle: 'No capital entries',
  getItemId: (item) => item.id,
  getItemTitle: (item) => item.description,
  getSearchText: (item) => [
    item.description,
    item.amount,
  ].join(' '),
  initialForm: initialCapitalForm,
  itemToForm: (item) => ({
    account_id: String(item.account_id ?? item.accountId ?? ''),
    amount: item.amount,
    amount_unit: 'UNIT',
    description: item.description,
    reporting_exchange_rate: '',
    reporting_exchange_rate_inversed: false,
  }),
  list: (params) => tenantResourceService.listCapitals(params),
  listPermission: 'list_capital',
  modalTitle: (mode) => mode === 'create' ? 'Add capital' : 'Edit capital',
  onDelete: (item) => tenantResourceService.deleteCapital(item.code),
  renderForm,
  save: (mode, form, item) => {
    const payload = capitalPayload(form)
    return mode === 'create'
      ? tenantResourceService.createCapital(payload)
      : tenantResourceService.updateCapital(item?.code ?? '', {
        ...payload,
        update_key: getNumberField(item ?? {}, 'update_key', 'updateKey') ?? 0,
      })
  },
  searchPlaceholder: 'Description or amount',
  subtitle: 'Record owner or shop capital and keep its accounting impact traceable.',
  title: 'Capital Management',
  totalLabel: 'capital entry',
  updatePermission: 'update_capital',
  validate: validateCapitalForm,
  mobileCreatePath: routePaths.capitalCreate,
  mobileEditPath: (item) => routePaths.capitalEdit(item.code),
  renderMobileCard: (item, actions) => <FinanceHistoryMobileCard
    actions={actions}
    amount={<AccountCurrencyAmount accountId={item.account_id ?? item.accountId} amount={item.amount} />}
    eyebrow="Shop capital"
    meta={formatDate(getStringField(item, 'created_at', 'createdAt'))}
    status="Incoming"
    statusTone="active"
    title={item.description}
  />,
}

export function CapitalsPage() {
  return <FinanceResourcePage config={config} />
}

function renderForm(
  form: CapitalForm,
  errors: FinanceFormErrors<CapitalForm>,
  updateField: (field: keyof CapitalForm, value: string | boolean) => void,
  context: { mode: 'create' | 'edit' },
) {
  return <CapitalFormFields errors={errors} form={form} isEditing={context.mode === 'edit'} updateField={updateField} />
}

export function CapitalFormFields({
  errors,
  form,
  isEditing = false,
  updateField,
}: {
  errors: FinanceFormErrors<CapitalForm>
  form: CapitalForm
  isEditing?: boolean
  updateField: (field: keyof CapitalForm, value: string | boolean) => void
}) {
  return (
    <FormGroup columns={2}>
      <FormField id="capital-account" label="Financial Account">
        <FinancialAccountSelect id="capital-account" locked={isEditing} onChange={(accountId) => updateField('account_id', accountId)} value={form.account_id} />
        {isEditing ? <span className="ui-form-field__hint">The account used by posted capital cannot be changed.</span> : null}
      </FormField>
      <FormField error={errors.amount} id="capital-amount" label="Amount">
        <FinancialAmountInput
          hasError={Boolean(errors.amount)}
          id="capital-amount"
          min="0.01"
          onChange={(next) => { updateField('amount', next.amount); updateField('amount_unit', next.unit) }}
          step="0.01"
          value={{ amount: form.amount, unit: form.amount_unit }}
        />
      </FormField>
      <ReportingExchangeRateField accountId={form.account_id} inversed={form.reporting_exchange_rate_inversed} manualRate={form.reporting_exchange_rate} onInversedChange={(value) => updateField('reporting_exchange_rate_inversed', value)} onManualRateChange={(value) => updateField('reporting_exchange_rate', value)} />
      <div className="ui-form-field">
        <span className="ui-label"><LocalizedText text="Accounting effect" /></span>
        <Badge tone="success">Incoming</Badge>
        <div className="ui-form-field__hint"><LocalizedText text="Capital records create incoming accounting entries server-side." /></div>
      </div>
      <FormField error={errors.description} id="capital-description" label="Description">
        <Textarea
          hasError={Boolean(errors.description)}
          id="capital-description"
          onChange={(event) => updateField('description', event.target.value)}
          value={form.description}
        />
      </FormField>
    </FormGroup>
  )
}

export function validateCapitalForm(form: CapitalForm) {
  const errors: FinanceFormErrors<CapitalForm> = {}

  if (!required(form.description)) {
    errors.description = 'Description is required.'
  }

  if (!positiveAmount(form.amount)) {
    errors.amount = 'Amount must be greater than zero.'
  }

  return errors
}

export function capitalPayload(form: CapitalForm) {
  return {
    ...(form.account_id ? { account_id: Number(form.account_id) } : {}),
    amount: Number(form.amount),
    amount_unit: form.amount_unit,
    description: form.description.trim(),
    ...(form.reporting_exchange_rate ? { reporting_exchange_rate: Number(form.reporting_exchange_rate), reporting_exchange_rate_inversed: form.reporting_exchange_rate_inversed } : {}),
  }
}
