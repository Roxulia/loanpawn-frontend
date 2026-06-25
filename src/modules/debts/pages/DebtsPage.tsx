import { useState, type FormEvent } from 'react'
import { Badge, Button, Input } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { FormField, FormGroup, KeyValueList } from '../../../components/molecules'
import { Modal, ModalForm, type DataTableColumn } from '../../../components/organisms'
import type { TenantDebt } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { routePaths } from '../../../app/routes/paths'
import {
  FinanceResourcePage,
  type FinanceResourcePageConfig,
} from '../../finance/FinanceResourcePage'
import {
  formatDate,
  formatMoney,
  getNumberField,
  getStringField,
} from '../../finance/financeFormat'
import { DebtFormFields } from '../components/DebtForm'
import { debtFormToPayload, emptyDebtForm, validateDebtForm, type DebtFormErrors, type DebtFormState } from '../components/debtFormModel'

const columns: Array<DataTableColumn<TenantDebt>> = [
  {
    header: 'Slip code',
    key: 'slip',
    render: (item) => getStringField(item, 'slip_no', 'slipNo') || formatSlipId(item),
  },
  {
    header: 'Amount',
    key: 'amount',
    render: (item) => <strong>{formatMoney(item.amount)}</strong>,
  },
  {
    header: 'Tag',
    key: 'tag',
    render: (item) => item.tag || '-',
  },
  {
    header: 'Status',
    key: 'status',
    render: (item) => <Badge tone={item.is_paid ? 'success' : 'warning'}>{item.is_paid ? 'Paid' : 'Unpaid'}</Badge>,
  },
  {
    header: 'Created',
    key: 'created',
    render: (item) => formatDate(getStringField(item, 'created_at', 'createdAt')),
  },
]

const config: FinanceResourcePageConfig<TenantDebt, DebtFormState> = {
  cardTitle: 'Debt records',
  columns,
  createLabel: 'Add Debt',
  createPath: routePaths.debtCreate,
  createPermission: 'create_debt',
  deleteLabel: 'Delete Debt',
  deleteMessage: (item) => `Delete debt record "${item.description}"? This action cannot be undone.`,
  deletePermission: 'delete_debt',
  emptyDescription: 'No unpaid interest or other debt records found.',
  emptyTitle: 'No debts',
  getItemId: (item) => item.id,
  getItemTitle: (item) => item.description,
  getSearchText: (item) => [
    item.description,
    item.amount,
    item.tag ?? '',
    getStringField(item, 'slip_no', 'slipNo'),
    item.is_paid ? 'paid' : 'unpaid',
  ].join(' '),
  initialForm: emptyDebtForm,
  itemToForm: (item) => ({
    amount: item.amount,
    description: item.description,
    slip_id: String(getNumberField(item, 'slip_id', 'slipId') ?? ''),
    tag: item.tag ?? '',
  }),
  list: (params) => tenantResourceService.listDebts(params),
  listPermission: 'list_debt',
  modalTitle: (mode) => mode === 'create' ? 'Add debt' : 'Edit debt',
  onDelete: (item) => tenantResourceService.deleteDebt(item.code),
  renderForm,
  hideUpdateAction: true,
  renderItemActions: (item, helpers) => (
    <PayDebtAction debt={item} onPaid={helpers.updateItem} />
  ),
  renderItemActionsPermission: 'update_debt',
  save: (mode, form, item) => {
    const payload = debtFormToPayload(form)

    return mode === 'create'
      ? tenantResourceService.createDebt(payload)
      : tenantResourceService.updateDebt(item?.code ?? '', {
        ...payload,
        update_key: getNumberField(item ?? {}, 'update_key', 'updateKey') ?? 0,
      })
  },
  searchPlaceholder: 'Slip code, tag, status, description, or amount',
  subtitle: 'Track unpaid interest and debt records attached to pawn operations.',
  title: 'Debts',
  totalLabel: 'debt',
  updatePermission: 'update_debt',
  validate: validateDebtForm,
}

export function DebtsPage() {
  return <FinanceResourcePage config={config} />
}

function renderForm(
  form: DebtFormState,
  errors: DebtFormErrors,
  updateField: (field: keyof DebtFormState, value: string | boolean) => void,
) {
  return <DebtFormFields errors={errors} onChange={(field, value) => updateField(field, value)} value={form} />
}

function formatSlipId(item: TenantDebt) {
  const slipId = getNumberField(item, 'slip_id', 'slipId')

  return slipId ? `Slip #${slipId}` : '-'
}

function PayDebtAction({ debt, onPaid }: { debt: TenantDebt; onPaid: (debt: TenantDebt) => void }) {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isPaying, setIsPaying] = useState(false)
  const [paidDebt, setPaidDebt] = useState<TenantDebt | null>(null)
  const [paidAmount, setPaidAmount] = useState('')

  if (debt.is_paid) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (Number(paymentAmount) <= 0) {
      setPaymentError('Payment amount must be greater than zero.')
      return
    }

    setIsPaying(true)
    setPaymentError(null)

    try {
      const response = await tenantResourceService.payDebt(debt.code, {
        amount_paid: Number(paymentAmount),
      })

      setPaidDebt(response)
      setPaidAmount(paymentAmount)
      setIsPayModalOpen(false)
      setPaymentAmount('')
    } catch (payError) {
      setPaymentError(payError instanceof Error ? payError.message : 'Unable to pay debt.')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsPayModalOpen(true)} variant="secondary">Pay Debt</Button>
      <ModalForm
        confirmLabel="Pay Debt"
        isLoading={isPaying}
        isOpen={isPayModalOpen}
        onCancel={() => {
          setIsPayModalOpen(false)
          setPaymentError(null)
          setPaymentAmount('')
        }}
        onSubmit={(event) => void handleSubmit(event)}
        title={`Pay ${debt.code}`}
      >
        {paymentError && <Alert message={paymentError} onDismiss={() => setPaymentError(null)} title="Debt payment failed" tone="danger" />}
        <FormGroup columns={1}>
          <FormField id={`debt-pay-${debt.id}`} label="Payment Amount">
            <Input
              id={`debt-pay-${debt.id}`}
              min="0.01"
              onChange={(event) => setPaymentAmount(event.target.value)}
              step="0.01"
              type="number"
              value={paymentAmount}
            />
          </FormField>
        </FormGroup>
      </ModalForm>
      <Modal
        footer={<Button onClick={() => closePaidResult()} variant="primary">Done</Button>}
        isOpen={Boolean(paidDebt)}
        onClose={closePaidResult}
        title="Debt Payment Result"
      >
        {paidDebt && (
          <KeyValueList items={[
            { key: 'Status', value: 'Processed' },
            { key: 'Debt', value: paidDebt.code },
            { key: 'Debt Amount', value: formatMoney(paidDebt.amount) },
            { key: 'Paid Amount', value: formatMoney(paidAmount || paidDebt.amount) },
            { key: 'Change', value: formatMoney(paidDebt.change_amount ?? paidDebt.changeAmount ?? 0) },
            { key: 'Paid State', value: paidDebt.is_paid ? 'Paid' : 'Unpaid' },
          ]} />
        )}
      </Modal>
    </>
  )

  function closePaidResult() {
    if (paidDebt) {
      onPaid(paidDebt)
    }

    setPaidDebt(null)
    setPaidAmount('')
  }
}
