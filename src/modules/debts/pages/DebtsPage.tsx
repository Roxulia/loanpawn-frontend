import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Badge, Button } from '../../../components/atoms'
import type { DataTableColumn } from '../../../components/organisms'
import type { TenantDebt } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { routePaths } from '../../../app/routes/paths'
import { FinanceResourcePage, type FinanceResourcePageConfig } from '../../finance/FinanceResourcePage'
import { FinanceHistoryMobileCard } from '../../finance/FinanceHistoryMobileCard'
import { formatDate, getNumberField, getStringField } from '../../finance/financeFormat'
import { DebtFormFields } from '../components/DebtForm'
import { debtFormToPayload, emptyDebtForm, validateDebtForm, type DebtFormErrors, type DebtFormState } from '../components/debtFormModel'
import { AccountCurrencyAmount } from '../../finance/AccountCurrencyAmount'
import { DebtPaymentWorkflow } from '../components/DebtPaymentWorkflow'
import { formatDebtLink } from '../components/debtFormat'

const columns: Array<DataTableColumn<TenantDebt>> = [
  { header: 'Debt Code', key: 'code', render: (item) => <strong>{item.code}</strong> },
  { header: 'Linked to', key: 'link', render: formatDebtLink },
  { header: 'Amount', key: 'amount', render: (item) => <strong><AccountCurrencyAmount accountId={item.created_account_id ?? item.createdAccountId} amount={item.principal_balance ?? item.principalBalance ?? item.amount} /></strong> },
  { header: 'Interest', key: 'interest', render: (item) => (item.apply_interest ?? item.applyInterest) ? <span>{item.interest_rate ?? item.interestRate}% {item.interest_type_name ?? item.interestTypeName ?? ''}</span> : '-' },
  { header: 'Tag', key: 'tag', render: (item) => item.tag || '-' },
  { header: 'Status', key: 'status', render: (item) => <Badge tone={item.is_paid ? 'success' : 'warning'}>{item.is_paid ? 'Paid' : 'Unpaid'}</Badge> },
  { header: 'Created', key: 'created', render: (item) => formatDate(getStringField(item, 'created_at', 'createdAt')) },
]

function makeConfig(onPay: (debtCode: string) => void): FinanceResourcePageConfig<TenantDebt, DebtFormState> {
  return {
    cardTitle: 'Debt records',
    columns,
    createLabel: 'Add Debt',
    createPath: routePaths.debtCreate,
    createPermission: 'create_debt',
    deleteLabel: 'Delete Debt',
    deleteMessage: (item) => `Delete debt record "${item.description}"? This action cannot be undone.`,
    deletePermission: 'delete_debt',
    detailPath: (item) => routePaths.debtDetail(item.code),
    emptyDescription: 'No unpaid interest or other debt records found.',
    emptyTitle: 'No debts',
    getItemId: (item) => item.id,
    getItemTitle: (item) => item.code,
    getSearchText: (item) => [item.code, item.description, item.amount, item.tag ?? '', getStringField(item, 'slip_no', 'slipNo'), getStringField(item, 'customer_name', 'customerName'), getStringField(item, 'customer_code', 'customerCode'), item.is_paid ? 'paid' : 'unpaid'].join(' '),
    initialForm: emptyDebtForm,
    itemToForm: (item) => ({ amount: item.amount, apply_interest: item.apply_interest ?? item.applyInterest ?? false, amount_unit: 'UNIT', created_account_id: String(item.created_account_id ?? item.createdAccountId ?? ''), customer_code: getStringField(item, 'customer_code', 'customerCode'), description: item.description, link_mode: getStringField(item, 'customer_code', 'customerCode') ? 'customer' : 'slip', slip_code: getStringField(item, 'slip_no', 'slipNo'), tag: item.tag ?? '', interest_rate: String(item.interest_rate ?? item.interestRate ?? ''), interest_type_id: String(item.interest_type_id ?? item.interestTypeId ?? ''), reporting_exchange_rate: '', reporting_exchange_rate_inversed: false }),
    list: (params) => tenantResourceService.listDebts(params),
    listPermission: 'list_debt',
    modalTitle: (mode) => mode === 'create' ? 'Add debt' : 'Edit debt',
    onDelete: (item) => tenantResourceService.deleteDebt(item.code),
    hideUpdateAction: true,
    renderForm: (form, errors, updateField) => <DebtFormFields errors={errors as DebtFormErrors} onChange={(field, value) => updateField(field, value)} value={form} />,
    renderItemActions: (item) => item.is_paid ? null : <Button onClick={() => onPay(item.code)} variant="secondary">Pay Debt</Button>,
    renderItemActionsPermission: 'update_debt',
    renderMobileCard: (item, actions, onClick) => <FinanceHistoryMobileCard actions={actions} amount={<AccountCurrencyAmount accountId={item.created_account_id ?? item.createdAccountId} amount={item.principal_balance ?? item.principalBalance ?? item.amount} />} eyebrow={item.code} meta={<>{formatDebtLink(item)} · {formatDate(getStringField(item, 'created_at', 'createdAt'))}</>} onClick={onClick} status={item.is_paid ? 'Paid' : 'Unpaid'} statusTone={item.is_paid ? 'active' : 'due'} title={item.description} />,
    save: (mode, form, item) => mode === 'create' ? tenantResourceService.createDebt(debtFormToPayload(form)) : tenantResourceService.updateDebt(item?.code ?? '', { ...debtFormToPayload(form), update_key: getNumberField(item ?? {}, 'update_key', 'updateKey') ?? 0 }),
    searchPlaceholder: 'Debt code, slip code, tag, status, description, or amount',
    subtitle: 'Track unpaid interest and debt records attached to pawn operations.',
    title: 'Debts',
    totalLabel: 'debt',
    updatePermission: 'update_debt',
    validate: validateDebtForm,
  }
}

export function DebtsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const activeTab = params.get('tab') === 'payment' ? 'payment' : 'list'
  const debtCode = params.get('debt_code') ?? ''
  const config = useMemo(() => makeConfig((code) => navigate(routePaths.debtPayment(code))), [navigate])

  function selectTab(tab: 'list' | 'payment') {
    navigate(tab === 'payment' ? `${routePaths.debts}?tab=payment` : routePaths.debts)
  }

  return <section className="debt-management-tabs">
    <div className="module-tabs" role="tablist" aria-label="Debt management sections">
      <Button aria-pressed={activeTab === 'list'} onClick={() => selectTab('list')} variant={activeTab === 'list' ? 'primary' : 'secondary'}>Debt List</Button>
      <Button aria-pressed={activeTab === 'payment'} onClick={() => selectTab('payment')} variant={activeTab === 'payment' ? 'primary' : 'secondary'}>Payment & Interest</Button>
    </div>
    {activeTab === 'list' ? <FinanceResourcePage config={config} /> : <DebtPaymentWorkflow initialDebtCode={debtCode} />}
  </section>
}
