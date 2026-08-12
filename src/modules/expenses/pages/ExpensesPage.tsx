import { useEffect, useState } from 'react'
import { Badge, Button, Input, Select, Textarea } from '../../../components/atoms'
import { FormField, FormGroup } from '../../../components/molecules'
import type { DataTableColumn } from '../../../components/organisms'
import type { ExpenseTypeOption, TenantExpense } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { routePaths } from '../../../app/routes/paths'
import { LocalizedText } from '../../../locales/UiLocale'
import { ExpenseDetailModal } from '../components/ExpenseDetailModal'
import { ExpenseImageInput } from '../components/ExpenseImageInput'
import { expenseUpdateToPayload } from '../components/expenseFormModel'
import { FinancialAccountSelect } from '../../financialAccounts/components/FinancialAccountSelect'
import {
  FinanceResourcePage,
  type FinanceFormErrors,
  type FinanceFormState,
  type FinanceResourcePageConfig,
} from '../../finance/FinanceResourcePage'
import { FinanceHistoryMobileCard } from '../../finance/FinanceHistoryMobileCard'
import {
  formatDate,
  formatMoney,
  getNumberField,
  getStringField,
  optionalInteger,
  positiveAmount,
  required,
} from '../../finance/financeFormat'

type ExpenseForm = FinanceFormState & {
  account_id: string
  amount: string
  description: string
  expense_type_id: string
  has_existing_image: boolean
  image_reference: File | null
  remove_image_reference: boolean
}

const initialForm: ExpenseForm = {
  account_id: '',
  amount: '',
  description: '',
  expense_type_id: '',
  has_existing_image: false,
  image_reference: null,
  remove_image_reference: false,
}

const columns: Array<DataTableColumn<TenantExpense>> = [
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
    header: 'Expense type',
    key: 'expenseType',
    render: (item) => {
      const typeName = getStringField(item, 'expense_type_name', 'expenseTypeName')
      const typeCode = getStringField(item, 'expense_type_code', 'expenseTypeCode')
      const typeId = getNumberField(item, 'expense_type_id', 'expenseTypeId')

      return typeName || typeCode || (typeId ? `Type #${typeId}` : '-')
    },
  },
  {
    header: 'Created',
    key: 'created',
    render: (item) => formatDate(getStringField(item, 'created_at', 'createdAt')),
  },
]

const config: FinanceResourcePageConfig<TenantExpense, ExpenseForm> = {
  cardTitle: 'Shop expenses',
  columns,
  createLabel: 'Add Expense',
  createPath: routePaths.expenseCreate,
  createPermission: 'create_expense',
  deleteLabel: 'Delete Expense',
  deleteMessage: (item) => `Delete expense "${item.description}"? This action cannot be undone.`,
  deletePermission: 'delete_expense',
  emptyDescription: 'No shop expenses found.',
  emptyTitle: 'No expenses',
  getItemId: (item) => item.id,
  getItemTitle: (item) => item.description,
  getSearchText: (item) => [
    item.description,
    item.amount,
    getStringField(item, 'expense_type_name', 'expenseTypeName'),
    getStringField(item, 'expense_type_code', 'expenseTypeCode'),
    String(getNumberField(item, 'expense_type_id', 'expenseTypeId') ?? ''),
  ].join(' '),
  initialForm,
  itemToForm: (item) => ({
    account_id: String(item.account_id ?? item.accountId ?? ''),
    amount: item.amount,
    description: item.description,
    expense_type_id: String(getNumberField(item, 'expense_type_id', 'expenseTypeId') ?? ''),
    has_existing_image: Boolean(item.has_image_reference ?? item.hasImageReference),
    image_reference: null,
    remove_image_reference: false,
  }),
  list: (params) => tenantResourceService.listExpenses(params),
  listPermission: 'list_expense',
  modalTitle: (mode) => mode === 'create' ? 'Add expense' : 'Edit expense',
  onDelete: (item) => tenantResourceService.deleteExpense(item.code),
  renderForm,
  renderMobileCard: (item, actions) => (
    <FinanceHistoryMobileCard
      actions={actions}
      amount={formatMoney(item.amount)}
      eyebrow={formatExpenseType(item)}
      meta={formatDate(getStringField(item, 'created_at', 'createdAt'))}
      status="Outgoing"
      statusTone="due"
      title={item.description}
    />
  ),
  save: (mode, form, item) => {
    if (mode === 'create') {
      throw new Error('Expenses must be created from the Add Expense page.')
    }

    const payload = expenseUpdateToPayload(form)
    payload.set('update_key', String(getNumberField(item ?? {}, 'update_key', 'updateKey') ?? 0))

    return tenantResourceService.updateExpense(item?.code ?? '', payload)
  },
  searchPlaceholder: 'Description, expense type, or amount',
  subtitle: 'Record shop expenses and keep their accounting impact traceable.',
  title: 'Expenses',
  totalLabel: 'expense',
  updatePermission: 'update_expense',
  validate,
}

export function ExpensesPage() {
  const [detailExpense, setDetailExpense] = useState<TenantExpense | null>(null)

  return (
    <>
      <FinanceResourcePage
        config={{
          ...config,
          renderItemActions: (item) => (
            <Button onClick={() => setDetailExpense(item)} variant="secondary">View</Button>
          ),
          renderItemActionsPermission: 'list_expense',
        }}
      />
      <ExpenseDetailModal expense={detailExpense} onClose={() => setDetailExpense(null)} />
    </>
  )
}

function formatExpenseType(item: TenantExpense) {
  const typeName = getStringField(item, 'expense_type_name', 'expenseTypeName')
  const typeCode = getStringField(item, 'expense_type_code', 'expenseTypeCode')
  const typeId = getNumberField(item, 'expense_type_id', 'expenseTypeId')

  return typeName || typeCode || (typeId ? `Type #${typeId}` : 'Expense')
}

function renderForm(
  form: ExpenseForm,
  errors: FinanceFormErrors<ExpenseForm>,
  updateField: (field: keyof ExpenseForm, value: string | boolean | File | null) => void,
) {
  return <ExpenseFormFields errors={errors} form={form} updateField={updateField} />
}

function ExpenseFormFields({
  errors,
  form,
  updateField,
}: {
  errors: FinanceFormErrors<ExpenseForm>
  form: ExpenseForm
  updateField: (field: keyof ExpenseForm, value: string | boolean | File | null) => void
}) {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([])
  const [isLoadingExpenseTypes, setIsLoadingExpenseTypes] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsLoadingExpenseTypes(true)

    tenantResourceService.listExpenseTypes()
      .then((response) => {
        if (isMounted) {
          setExpenseTypes(response)
        }
      })
      .catch(() => {
        if (isMounted) {
          setExpenseTypes([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingExpenseTypes(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <FormGroup columns={2}>
      <FormField id="expense-account" label="Payment Account">
        <FinancialAccountSelect id="expense-account" onChange={(accountId) => updateField('account_id', accountId)} value={form.account_id} />
      </FormField>
      <FormField error={errors.amount} id="expense-amount" label="Amount">
        <Input
          disabled
          hasError={Boolean(errors.amount)}
          id="expense-amount"
          min="0.01"
          onChange={(event) => updateField('amount', event.target.value)}
          step="0.01"
          type="number"
          value={form.amount}
        />
      </FormField>
      <FormField error={errors.expense_type_id} id="expense-type-id" label="Expense type">
        <Select
          disabled={isLoadingExpenseTypes}
          hasError={Boolean(errors.expense_type_id)}
          id="expense-type-id"
          onChange={(event) => updateField('expense_type_id', event.target.value)}
          value={form.expense_type_id}
        >
          <option value="">{isLoadingExpenseTypes ? 'Loading expense types...' : 'No expense type'}</option>
          {expenseTypes.map((expenseType) => (
            <option key={expenseType.id} value={expenseType.id}>
              {formatExpenseTypeOption(expenseType)}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField error={errors.description} id="expense-description" label="Description">
        <Textarea
          hasError={Boolean(errors.description)}
          id="expense-description"
          onChange={(event) => updateField('description', event.target.value)}
          value={form.description}
        />
      </FormField>
      <FormField error={errors.image_reference} id="expense-image-reference" label="Reference image">
        <ExpenseImageInput
          existingImage={form.has_existing_image}
          file={form.image_reference}
          id="expense-image-reference"
          isRemoved={form.remove_image_reference}
          onChange={(file) => updateField('image_reference', file)}
          onRemoveChange={(removed) => updateField('remove_image_reference', removed)}
        />
      </FormField>
      <div className="ui-form-field">
        <span className="ui-label"><LocalizedText text="Accounting effect" /></span>
        <Badge tone="warning">Outgoing</Badge>
        <div className="ui-form-field__hint"><LocalizedText text="Expense records create outgoing accounting entries server-side." /></div>
      </div>
    </FormGroup>
  )
}

function formatExpenseTypeOption(expenseType: ExpenseTypeOption) {
  return expenseType.code ? `${expenseType.name} (${expenseType.code})` : expenseType.name
}

function validate(form: ExpenseForm) {
  const errors: FinanceFormErrors<ExpenseForm> = {}

  if (!required(form.description)) {
    errors.description = 'Description is required.'
  }

  if (!positiveAmount(form.amount)) {
    errors.amount = 'Amount must be greater than zero.'
  }

  if (!optionalInteger(form.expense_type_id)) {
    errors.expense_type_id = 'Expense type ID must be a whole number.'
  }

  if (form.image_reference && form.image_reference.size > 5 * 1024 * 1024) {
    errors.image_reference = 'Reference image must not exceed 5 MB.'
  }

  if (form.image_reference && !['image/jpeg', 'image/png', 'image/webp'].includes(form.image_reference.type)) {
    errors.image_reference = 'Reference image must be JPG, PNG, or WebP.'
  }

  return errors
}
