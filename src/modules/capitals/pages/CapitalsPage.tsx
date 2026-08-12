import { Badge, Input, Textarea } from '../../../components/atoms'
import { FormField, FormGroup } from '../../../components/molecules'
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
  formatMoney,
  getNumberField,
  getStringField,
  positiveAmount,
  required,
} from '../../finance/financeFormat'
import { FinancialAccountSelect } from '../../financialAccounts/components/FinancialAccountSelect'

type CapitalForm = FinanceFormState & {
  account_id: string
  amount: string
  description: string
}

const initialForm: CapitalForm = {
  account_id: '',
  amount: '',
  description: '',
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
    render: (item) => formatMoney(item.amount),
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
  initialForm,
  itemToForm: (item) => ({
    account_id: String(item.account_id ?? item.accountId ?? ''),
    amount: item.amount,
    description: item.description,
  }),
  list: (params) => tenantResourceService.listCapitals(params),
  listPermission: 'list_capital',
  modalTitle: (mode) => mode === 'create' ? 'Add capital' : 'Edit capital',
  onDelete: (item) => tenantResourceService.deleteCapital(item.code),
  renderForm,
  save: (mode, form, item) => {
    const payload = {
      ...(form.account_id ? { account_id: Number(form.account_id) } : {}),
      amount: Number(form.amount),
      description: form.description.trim(),
    }

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
  validate,
}

export function CapitalsPage() {
  return <FinanceResourcePage config={config} />
}

function renderForm(
  form: CapitalForm,
  errors: FinanceFormErrors<CapitalForm>,
  updateField: (field: keyof CapitalForm, value: string | boolean) => void,
) {
  return <CapitalFormFields errors={errors} form={form} updateField={updateField} />
}

function CapitalFormFields({
  errors,
  form,
  updateField,
}: {
  errors: FinanceFormErrors<CapitalForm>
  form: CapitalForm
  updateField: (field: keyof CapitalForm, value: string | boolean) => void
}) {
  return (
    <FormGroup columns={2}>
      <FormField id="capital-account" label="Financial Account">
        <FinancialAccountSelect id="capital-account" onChange={(accountId) => updateField('account_id', accountId)} value={form.account_id} />
      </FormField>
      <FormField error={errors.amount} id="capital-amount" label="Amount">
        <Input
          hasError={Boolean(errors.amount)}
          id="capital-amount"
          min="0.01"
          onChange={(event) => updateField('amount', event.target.value)}
          step="0.01"
          type="number"
          value={form.amount}
        />
      </FormField>
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

function validate(form: CapitalForm) {
  const errors: FinanceFormErrors<CapitalForm> = {}

  if (!required(form.description)) {
    errors.description = 'Description is required.'
  }

  if (!positiveAmount(form.amount)) {
    errors.amount = 'Amount must be greater than zero.'
  }

  return errors
}
