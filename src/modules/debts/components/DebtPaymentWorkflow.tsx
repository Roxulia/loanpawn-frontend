import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Button, Input, Select } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { Card, FinancialAmountInput, FormField, FormGroup, KeyValueList } from '../../../components/molecules'
import { DataTable, type DataTableColumn } from '../../../components/organisms'
import type { DebtInterestAccrual, DebtInterestCalculation, DebtPaymentHistoryItem } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { createIdempotencyKey } from '../../../services/http/idempotency'
import { AccountCurrencyAmount } from '../../finance/AccountCurrencyAmount'
import { ReportingExchangeRateField } from '../../finance/ReportingExchangeRateField'
import { FinancialAccountSelect } from '../../financialAccounts/components/FinancialAccountSelect'
import { formatDate } from '../../finance/financeFormat'
import type { FinancialUnitCode } from '../../finance/financialUnits'

const accrualColumns: Array<DataTableColumn<DebtInterestAccrual>> = [
  { header: 'Period', key: 'period', render: (row) => `${formatDate(row.start_period_at)} - ${formatDate(row.end_period_at)}` },
  { header: 'Principal', key: 'principal', render: (row) => row.principal_amount },
  { header: 'Interest', key: 'interest', render: (row) => row.interest_amount },
  { header: 'Paid', key: 'paid', render: (row) => row.paid_amount },
  { header: 'Outstanding', key: 'outstanding', render: (row) => row.outstanding_amount },
]

const historyColumns: Array<DataTableColumn<DebtPaymentHistoryItem>> = [
  { header: 'Payment', key: 'code', render: (row) => row.code },
  { header: 'Order', key: 'order', render: (row) => row.allocation_order === 'interest_first' ? 'Interest first' : 'Principal first' },
  { header: 'Principal', key: 'principal', render: (row) => row.principal_paid },
  { header: 'Interest', key: 'interest', render: (row) => row.interest_paid },
  { header: 'Paid at', key: 'date', render: (row) => formatDate(row.payment_at) },
]

export function DebtPaymentWorkflow({ initialDebtCode = '' }: { initialDebtCode?: string }) {
  const [debtCode, setDebtCode] = useState(initialDebtCode)
  const [calculation, setCalculation] = useState<DebtInterestCalculation | null>(null)
  const [history, setHistory] = useState<DebtPaymentHistoryItem[]>([])
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<FinancialUnitCode>('UNIT')
  const [accountId, setAccountId] = useState('')
  const [reportingExchangeRate, setReportingExchangeRate] = useState('')
  const [reportingExchangeRateInversed, setReportingExchangeRateInversed] = useState(false)
  const [order, setOrder] = useState<'interest_first' | 'principal_first'>('interest_first')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadDebt = useCallback(async (code: string) => {
    const normalizedCode = code.trim()
    if (!normalizedCode) return
    setIsLoading(true)
    setError(null)
    try {
      const [nextCalculation, nextHistory] = await Promise.all([
        tenantResourceService.calculateDebtInterest(normalizedCode),
        tenantResourceService.listDebtPayments(normalizedCode),
      ])
      setCalculation(nextCalculation)
      setHistory(nextHistory)
      setDebtCode(normalizedCode)
    } catch (loadError) {
      setCalculation(null)
      setHistory([])
      setError(loadError instanceof Error ? loadError.message : 'Unable to load debt.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialDebtCode.trim()) return
    const timer = window.setTimeout(() => {
      setDebtCode(initialDebtCode)
      void loadDebt(initialDebtCode)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialDebtCode, loadDebt])

  async function pay(event: FormEvent) {
    event.preventDefault()
    if (!calculation) return
    const paymentAmount = calculation.allow_partial_payments ? Number(amount) : Number(calculation.total_outstanding)
    if (paymentAmount <= 0) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await tenantResourceService.payDebt(calculation.debt_code, {
        amount_paid: paymentAmount,
        amount_paid_unit: calculation.allow_partial_payments ? unit : 'UNIT',
        allocation_order: calculation.allow_partial_payments ? order : 'interest_first',
        debt_update_key: calculation.debt_update_key,
        ...(accountId ? { accept_account_id: Number(accountId) } : {}),
        ...(reportingExchangeRate ? { reporting_exchange_rate: Number(reportingExchangeRate), reporting_exchange_rate_inversed: reportingExchangeRateInversed } : {}),
      }, { idempotencyKey: createIdempotencyKey() })
      setNotice(`Principal paid: ${result.principal_paid}; interest paid: ${result.interest_paid}; change: ${result.change_amount}.`)
      setAmount('')
      await loadDebt(calculation.debt_code)
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : 'Unable to record payment.')
    } finally {
      setIsLoading(false)
    }
  }

  return <div className="debt-interest-workflow">
    {error && <Alert message={error} onDismiss={() => setError(null)} title="Debt payment failed" tone="danger" />}
    {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Payment recorded" tone="success" />}
    <Card title="Debt Lookup">
      <form className="inline-form debt-interest-lookup" onSubmit={(event) => { event.preventDefault(); void loadDebt(debtCode) }}>
        <FormField id="debt-interest-code" label="Debt Code"><Input id="debt-interest-code" onChange={(event) => setDebtCode(event.target.value)} value={debtCode} /></FormField>
        <Button isLoading={isLoading} type="submit">Load Debt</Button>
      </form>
    </Card>
    {calculation && <div className="debt-interest-workflow__content">
      <Card title="Debt Balance">
        <KeyValueList items={[
          { key: 'Debt', value: calculation.debt_code },
          { key: 'Principal', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.principal_balance} /> },
          { key: 'Accrued Interest', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.outstanding_interest} /> },
          { key: 'Total Outstanding', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.total_outstanding} /> },
          { key: 'Interest', value: calculation.apply_interest ? `${calculation.interest_rate}% ${calculation.interest_type_name ?? ''}` : 'Not applied' },
        ]} />
        <div className="debt-interest-accruals--desktop"><DataTable columns={accrualColumns} emptyDescription="This debt has no interest accruals." emptyTitle="No accrued interest" getItemId={(row) => row.id} getItemTitle={(row) => `Accrual ${row.id}`} items={calculation.interest_breakdown} /></div>
        <div className="debt-interest-accruals--mobile">{calculation.interest_breakdown.map((row) => <article key={row.id}><strong>{formatDate(row.start_period_at)} - {formatDate(row.end_period_at)}</strong><span>Outstanding: {row.outstanding_amount}</span></article>)}</div>
      </Card>
      {Number(calculation.total_outstanding) > 0 && <Card title={calculation.allow_partial_payments ? 'Record Partial or Full Payment' : 'Record Payment'}>
        <form className="ui-form" onSubmit={(event) => void pay(event)}>
          <FormGroup columns={1}>
            {!calculation.allow_partial_payments && <KeyValueList items={[{ key: 'Full settlement amount', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.total_outstanding} /> }]} />}
            {calculation.allow_partial_payments && <>
              <FormField id="debt-payment-order" label="Payment Order"><Select id="debt-payment-order" onChange={(event) => setOrder(event.target.value as typeof order)} value={order}><option value="interest_first">Pay interest first</option><option value="principal_first">Pay principal first</option></Select></FormField>
              <FormField id="debt-workflow-amount" label="Payment Amount"><FinancialAmountInput id="debt-workflow-amount" min="0.01" onChange={(next) => { setAmount(next.amount); setUnit(next.unit) }} step="0.01" value={{ amount, unit }} /></FormField>
            </>}
            <FormField id="debt-workflow-account" label="Accepting Account" helperText="Only accounts using the debt currency are shown."><FinancialAccountSelect id="debt-workflow-account" matchAccountId={calculation.account_id} onChange={setAccountId} value={accountId} /></FormField>
            <ReportingExchangeRateField accountId={accountId || calculation.account_id} inversed={reportingExchangeRateInversed} manualRate={reportingExchangeRate} onInversedChange={setReportingExchangeRateInversed} onManualRateChange={setReportingExchangeRate} />
          </FormGroup>
          <Button disabled={calculation.allow_partial_payments && Number(amount) <= 0} isLoading={isLoading} type="submit">Record Payment</Button>
        </form>
      </Card>}
      <Card title="Payment History"><DataTable columns={historyColumns} emptyDescription="Payments will appear here." emptyTitle="No payments" getItemId={(row) => row.id} getItemTitle={(row) => row.code} items={history} /></Card>
    </div>}
  </div>
}
