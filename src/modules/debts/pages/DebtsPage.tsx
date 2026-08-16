import { useState, type FormEvent } from 'react'
import { Badge, Button } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { FinancialAmountInput, FormField, FormGroup, KeyValueList } from '../../../components/molecules'
import { Modal, ModalForm, type DataTableColumn } from '../../../components/organisms'
import type { TenantDebt } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { routePaths } from '../../../app/routes/paths'
import {
  FinanceResourcePage,
  type FinanceResourcePageConfig,
} from '../../finance/FinanceResourcePage'
import { FinanceHistoryMobileCard } from '../../finance/FinanceHistoryMobileCard'
import {
  formatDate,
  getNumberField,
  getStringField,
} from '../../finance/financeFormat'
import { DebtFormFields } from '../components/DebtForm'
import { debtFormToPayload, emptyDebtForm, validateDebtForm, type DebtFormErrors, type DebtFormState } from '../components/debtFormModel'
import { FinancialAccountSelect } from '../../financialAccounts/components/FinancialAccountSelect'
import { financialAmountToBase, type FinancialUnitCode } from '../../finance/financialUnits'
import { AccountCurrencyAmount } from '../../finance/AccountCurrencyAmount'
import { ReportingExchangeRateField } from '../../finance/ReportingExchangeRateField'

const columns: Array<DataTableColumn<TenantDebt>> = [
  {
    header: 'Linked to',
    key: 'link',
    render: (item) => formatDebtLink(item),
  },
  {
    header: 'Amount',
    key: 'amount',
    render: (item) => <strong><AccountCurrencyAmount accountId={item.created_account_id ?? item.createdAccountId} amount={item.amount} /></strong>,
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
    getStringField(item, 'customer_name', 'customerName'),
    getStringField(item, 'customer_code', 'customerCode'),
    item.is_paid ? 'paid' : 'unpaid',
  ].join(' '),
  initialForm: emptyDebtForm,
  itemToForm: (item) => ({
    amount: item.amount,
    amount_unit: 'UNIT',
    created_account_id: String(item.created_account_id ?? item.createdAccountId ?? ''),
    customer_code: getStringField(item, 'customer_code', 'customerCode'),
    description: item.description,
    link_mode: getStringField(item, 'customer_code', 'customerCode') ? 'customer' : 'slip',
    slip_code: getStringField(item, 'slip_no', 'slipNo'),
    tag: item.tag ?? '',
    reporting_exchange_rate: '',
    reporting_exchange_rate_inversed: false,
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
  renderMobileCard: (item, actions) => (
    <FinanceHistoryMobileCard
      actions={actions}
      amount={<AccountCurrencyAmount accountId={item.created_account_id ?? item.createdAccountId} amount={item.amount} />}
      eyebrow={formatDebtLink(item)}
      meta={formatDate(getStringField(item, 'created_at', 'createdAt'))}
      status={item.is_paid ? 'Paid' : 'Unpaid'}
      statusTone={item.is_paid ? 'active' : 'due'}
      title={item.description}
    />
  ),
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

function formatDebtLink(item: TenantDebt) {
  const customerName = getStringField(item, 'customer_name', 'customerName')
  const customerCode = getStringField(item, 'customer_code', 'customerCode')
  const slipNo = getStringField(item, 'slip_no', 'slipNo')

  if (slipNo) {
    return slipNo
  }

  if (customerName || customerCode) {
    return [customerName, customerCode].filter(Boolean).join(' / ')
  }

  const slipId = getNumberField(item, 'slip_id', 'slipId')

  return slipId ? `Slip #${slipId}` : '-'
}

function PayDebtAction({ debt, onPaid }: { debt: TenantDebt; onPaid: (debt: TenantDebt) => void }) {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentAmountUnit, setPaymentAmountUnit] = useState<FinancialUnitCode>('UNIT')
  const [acceptAccountId, setAcceptAccountId] = useState('')
  const [reportingExchangeRate, setReportingExchangeRate] = useState('')
  const [reportingExchangeRateInversed, setReportingExchangeRateInversed] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isPaying, setIsPaying] = useState(false)
  const [paidDebt, setPaidDebt] = useState<TenantDebt | null>(null)
  const [paidAmount, setPaidAmount] = useState('')

  if (debt.is_paid) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (financialAmountToBase({ amount: paymentAmount, unit: paymentAmountUnit }) <= 0) {
      setPaymentError('Payment amount must be greater than zero.')
      return
    }

    setIsPaying(true)
    setPaymentError(null)

    try {
      const response = await tenantResourceService.payDebt(debt.code, {
        amount_paid: Number(paymentAmount),
        amount_paid_unit: paymentAmountUnit,
        ...(acceptAccountId ? { accept_account_id: Number(acceptAccountId) } : {}),
        ...(reportingExchangeRate ? { reporting_exchange_rate: Number(reportingExchangeRate), reporting_exchange_rate_inversed: reportingExchangeRateInversed } : {}),
      })

      setPaidDebt(response)
      setPaidAmount(paymentAmount)
      setIsPayModalOpen(false)
      setPaymentAmount('')
      setAcceptAccountId('')
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
          setAcceptAccountId('')
        }}
        onSubmit={(event) => void handleSubmit(event)}
        title={`Pay ${debt.code}`}
      >
        {paymentError && <Alert message={paymentError} onDismiss={() => setPaymentError(null)} title="Debt payment failed" tone="danger" />}
        <FormGroup columns={1}>
          <FormField id={`debt-pay-${debt.id}`} label="Payment Amount">
            <FinancialAmountInput
              id={`debt-pay-${debt.id}`}
              min="0.01"
              onChange={(next) => { setPaymentAmount(next.amount); setPaymentAmountUnit(next.unit) }}
              step="0.01"
              value={{ amount: paymentAmount, unit: paymentAmountUnit }}
            />
          </FormField>
          <FormField id={`debt-pay-account-${debt.id}`} label="Accepting Account" helperText="Only accounts using the debt currency are shown.">
            <FinancialAccountSelect
              id={`debt-pay-account-${debt.id}`}
              matchAccountId={debt.created_account_id ?? debt.createdAccountId}
              onChange={setAcceptAccountId}
              value={acceptAccountId}
            />
          </FormField>
          <ReportingExchangeRateField accountId={acceptAccountId || debt.created_account_id || debt.createdAccountId} inversed={reportingExchangeRateInversed} manualRate={reportingExchangeRate} onInversedChange={setReportingExchangeRateInversed} onManualRateChange={setReportingExchangeRate} />
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
            { key: 'Debt Amount', value: <AccountCurrencyAmount accountId={paidDebt.created_account_id ?? paidDebt.createdAccountId} amount={paidDebt.amount} /> },
            { key: 'Paid Amount', value: <AccountCurrencyAmount accountId={paidDebt.accept_account_id ?? paidDebt.acceptAccountId} amount={paidAmount || paidDebt.amount} fallbackAccountId={paidDebt.created_account_id ?? paidDebt.createdAccountId} /> },
            { key: 'Change', value: <AccountCurrencyAmount accountId={paidDebt.accept_account_id ?? paidDebt.acceptAccountId} amount={paidDebt.change_amount ?? paidDebt.changeAmount ?? 0} fallbackAccountId={paidDebt.created_account_id ?? paidDebt.createdAccountId} /> },
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
