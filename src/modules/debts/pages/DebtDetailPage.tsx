import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Badge, Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { Card, KeyValueList, SectionHeader } from '../../../components/molecules'
import { DataTable, type DataTableColumn } from '../../../components/organisms'
import { routePaths } from '../../../app/routes/paths'
import type { DebtInterestAccrual, DebtInterestCalculation, DebtPaymentHistoryItem, TenantDebt } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { usePermissions } from '../../auth'
import { AccountCurrencyAmount } from '../../finance/AccountCurrencyAmount'
import { formatDate, getStringField } from '../../finance/financeFormat'
import { formatDebtLink } from '../components/debtFormat'

const accrualColumns: Array<DataTableColumn<DebtInterestAccrual>> = [
  { header: 'Period', key: 'period', render: (row) => `${formatDate(row.start_period_at)} - ${formatDate(row.end_period_at)}` },
  { header: 'Principal', key: 'principal', render: (row) => row.principal_amount },
  { header: 'Interest', key: 'interest', render: (row) => row.interest_amount },
  { header: 'Paid', key: 'paid', render: (row) => row.paid_amount },
  { header: 'Outstanding', key: 'outstanding', render: (row) => row.outstanding_amount },
]

const historyColumns: Array<DataTableColumn<DebtPaymentHistoryItem>> = [
  { header: 'Payment', key: 'code', render: (row) => row.code },
  { header: 'Paid amount', key: 'amount', render: (row) => row.payment_amount },
  { header: 'Principal', key: 'principal', render: (row) => row.principal_paid },
  { header: 'Interest', key: 'interest', render: (row) => row.interest_paid },
  { header: 'Paid at', key: 'date', render: (row) => formatDate(row.payment_at) },
]

export function DebtDetailPage() {
  const navigate = useNavigate()
  const { debtCode: rawDebtCode } = useParams()
  const debtCode = rawDebtCode?.trim() ?? ''
  const { hasPermission } = usePermissions()
  const [debt, setDebt] = useState<TenantDebt | null>(null)
  const [calculation, setCalculation] = useState<DebtInterestCalculation | null>(null)
  const [history, setHistory] = useState<DebtPaymentHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDebt = useCallback(async () => {
    if (!debtCode) return
    setIsLoading(true)
    setError(null)
    try {
      const [nextDebt, nextCalculation, nextHistory] = await Promise.all([
        tenantResourceService.getDebt(debtCode),
        tenantResourceService.calculateDebtInterest(debtCode),
        tenantResourceService.listDebtPayments(debtCode),
      ])
      setDebt(nextDebt)
      setCalculation(nextCalculation)
      setHistory(nextHistory)
    } catch (loadError) {
      setDebt(null)
      setCalculation(null)
      setHistory([])
      setError(loadError instanceof Error ? loadError.message : 'Unable to load debt detail.')
    } finally {
      setIsLoading(false)
    }
  }, [debtCode])

  useEffect(() => { const timer = window.setTimeout(() => void loadDebt(), 0); return () => window.clearTimeout(timer) }, [loadDebt])
  if (!debtCode) return <Navigate replace to={routePaths.debts} />

  return <section className="page debt-detail-page">
    <SectionHeader title="Debt Detail" subtitle={debtCode} action={<div className="row-actions"><Button onClick={() => navigate(routePaths.debts)} variant="secondary">Back</Button>{debt && !debt.is_paid && hasPermission('update_debt') && <Button onClick={() => navigate(routePaths.debtPayment(debt.code))} variant="primary">Pay Debt</Button>}</div>} />
    {error && <Alert message={error} onDismiss={() => setError(null)} title="Debt lookup failed" tone="danger" />}
    {isLoading ? <LoadingState rows={6} /> : debt && calculation ? <>
      <DebtDetailDesktop calculation={calculation} debt={debt} />
      <DebtDetailMobile calculation={calculation} debt={debt} />
      <Card title="Interest Accruals"><DataTable columns={accrualColumns} emptyDescription="This debt has no interest accruals." emptyTitle="No accrued interest" getItemId={(row) => row.id} getItemTitle={(row) => `Accrual ${row.id}`} items={calculation.interest_breakdown} /></Card>
      <Card title="Payment History"><DataTable columns={historyColumns} emptyDescription="Payments will appear here." emptyTitle="No payments" getItemId={(row) => row.id} getItemTitle={(row) => row.code} items={history} /></Card>
    </> : !error && <Alert message="This debt is unavailable." title="Debt not found" tone="warning" />}
  </section>
}

function DebtDetailDesktop({ calculation, debt }: { calculation: DebtInterestCalculation; debt: TenantDebt }) {
  return <div className="debt-detail-summary--desktop"><DebtSummary calculation={calculation} debt={debt} /></div>
}

function DebtDetailMobile({ calculation, debt }: { calculation: DebtInterestCalculation; debt: TenantDebt }) {
  return <div className="debt-detail-summary--mobile"><DebtSummary calculation={calculation} debt={debt} /></div>
}

function DebtSummary({ calculation, debt }: { calculation: DebtInterestCalculation; debt: TenantDebt }) {
  return <Card title={debt.code} description={debt.description} action={<Badge tone={debt.is_paid ? 'success' : 'warning'}>{debt.is_paid ? 'Paid' : 'Unpaid'}</Badge>}>
    <KeyValueList items={[
      { key: 'Linked to', value: formatDebtLink(debt) },
      { key: 'Tag', value: debt.tag || '-' },
      { key: 'Original amount', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.original_principal} /> },
      { key: 'Principal balance', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.principal_balance} /> },
      { key: 'Accrued interest', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.outstanding_interest} /> },
      { key: 'Total outstanding', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.total_outstanding} /> },
      { key: 'Interest', value: calculation.apply_interest ? `${calculation.interest_rate}% ${calculation.interest_type_name ?? ''}` : 'Not applied' },
      { key: 'Created', value: formatDate(getStringField(debt, 'created_at', 'createdAt')) },
      { key: 'Updated', value: formatDate(getStringField(debt, 'updated_at', 'updatedAt')) },
    ]} />
  </Card>
}
