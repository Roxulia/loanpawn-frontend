import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Input } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { ActionBar, Card, FormField, KeyValueList, SectionHeader } from '../../../components/molecules'
import { ConfirmDialog, DataTable, Modal, type DataTableColumn } from '../../../components/organisms'
import { LocalizedText, useUiLocale } from '../../../locales/UiLocale'
import { createIdempotencyKey } from '../../../services/http/idempotency'
import { formatDate, formatMoney } from '../../slips/slipFormat'
import { interestService, type InterestBreakdownRow, type InterestCalculationResult, type InterestPaymentHistoryItem, type InterestPaymentResult } from '../services/interestService'

const perPage = 10

type InterestTab = 'workflow' | 'history'

export function InterestPaymentsPage() {
  const { t } = useUiLocale()
  const [activeTab, setActiveTab] = useState<InterestTab>('workflow')
  const [slipNo, setSlipNo] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [recordDebt, setRecordDebt] = useState(false)
  const [calculation, setCalculation] = useState<InterestCalculationResult | null>(null)
  const [paymentResult, setPaymentResult] = useState<InterestPaymentResult | null>(null)
  const [history, setHistory] = useState<InterestPaymentHistoryItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmDebt, setConfirmDebt] = useState(false)
  const paymentIdempotencyKeyRef = useRef<string | null>(null)

  const rows = getBreakdown(calculation)
  const totalInterest = getTotalInterest(calculation)
  const normalizedSlipNo = getSlipNo(calculation) || slipNo.trim()
  const paidAmount = Number(paymentAmount || 0)
  const isInsufficient = calculation !== null && paidAmount > 0 && paidAmount < totalInterest

  const loadHistory = useCallback(async (page: number) => {
    setIsLoadingHistory(true)
    setError(null)

    try {
      const response = await interestService.listHistory({ page, perPage })
      const pageData = response
      const nextItems = pageData.items ?? []
      const nextPerPage = pageData.per_page ?? pageData.perPage ?? perPage

      setHistory(nextItems)
      setCurrentPage(pageData.current_page ?? pageData.currentPage ?? page)
      setLastPage(pageData.last_page ?? pageData.lastPage ?? Math.max(1, Math.ceil((pageData.total ?? nextItems.length) / nextPerPage)))
      setTotal(pageData.total ?? nextItems.length)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load interest payment history.')
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      const loadTimer = window.setTimeout(() => {
        void loadHistory(currentPage)
      }, 0)

      return () => window.clearTimeout(loadTimer)
    }
  }, [activeTab, currentPage, loadHistory])

  async function handleCalculate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (!slipNo.trim()) {
      setError('Slip number is required.')
      return
    }

    setIsCalculating(true)
    setError(null)
    setNotice(null)
    setPaymentResult(null)

    try {
      const response = await interestService.calculate(slipNo.trim())
      setCalculation(response)
      setNotice(`Interest calculated for slip ${getSlipNo(response) || slipNo.trim()}.`)
    } catch (calculateError) {
      setCalculation(null)
      setError(calculateError instanceof Error ? calculateError.message : 'Unable to calculate interest.')
    } finally {
      setIsCalculating(false)
    }
  }

  async function submitPayment(forceDebt = recordDebt) {
    if (paymentIdempotencyKeyRef.current !== null) {
      return
    }

    if (!normalizedSlipNo) {
      setError('Calculate a slip before recording payment.')
      return
    }

    if (Number(paymentAmount) <= 0) {
      setError('Payment amount must be greater than zero.')
      return
    }

    if (!calculation) {
      setError('Calculate a slip before recording payment.')
      return
    }

    const slipUpdateKey = getSlipUpdateKey(calculation)
    if (slipUpdateKey === null) {
      setError('Slip calculation data is stale or incomplete. Refresh the calculation and try again.')
      return
    }

    setIsPaying(true)
    setError(null)
    paymentIdempotencyKeyRef.current = createIdempotencyKey()

    try {
      const response = await interestService.pay(normalizedSlipNo, {
        slip_update_key: slipUpdateKey,
        payment_amount: Number(paymentAmount),
        record_debt: forceDebt,
        interest_breakdown: rows.map(toPaymentBreakdownPayload),
      }, undefined, {
        idempotencyKey: paymentIdempotencyKeyRef.current,
      })
      setConfirmDebt(false)
      setSlipNo('')
      setPaymentAmount('')
      setRecordDebt(false)
      setCalculation(null)
      setPaymentResult(response)
      setNotice('Interest payment processed successfully.')
      if (activeTab === 'history') {
        await loadHistory(1)
      }
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : 'Unable to record interest payment.')
    } finally {
      paymentIdempotencyKeyRef.current = null
      setIsPaying(false)
    }
  }

  function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isInsufficient && !recordDebt) {
      setConfirmDebt(true)
      return
    }

    void submitPayment(recordDebt)
  }

  const columns: Array<DataTableColumn<InterestBreakdownRow>> = [
    { header: 'Start Date', key: 'start', render: (row) => formatDate(row.start_date ?? row.startDate) },
    { header: 'End Date', key: 'end', render: (row) => formatDate(row.end_date ?? row.endDate) },
    { header: 'Interest Amount', key: 'amount', render: (row) => formatMoney(getInterestAmount(row)) },
  ]

  const historyColumns: Array<DataTableColumn<InterestPaymentHistoryItem>> = [
    { header: 'Slip No', key: 'slip', render: (row) => <strong>{row.slip_no ?? '-'}</strong> },
    { header: 'Period', key: 'period', render: (row) => `${formatDate(row.start_date)} - ${formatDate(row.end_date)}` },
    { header: 'Interest', key: 'interest', render: (row) => formatMoney(row.interest_amount) },
    { header: 'Paid Amount', key: 'paid', render: (row) => formatMoney(row.payment_amount) },
    { header: 'Change', key: 'change', render: (row) => formatMoney(row.change_amount) },
    { header: 'Payment Date', key: 'paymentDate', render: (row) => formatDate(row.payment_date) },
    { header: 'Notes', key: 'notes', render: (row) => row.notes || '-' },
  ]

  return (
    <section className="page">
      <SectionHeader title="Interest Payments" subtitle="Calculate due interest, record payment, and create debt when needed." />

      <div className="module-tabs" role="tablist" aria-label={t('Interest payment sections')}>
        <Button onClick={() => setActiveTab('workflow')} variant={activeTab === 'workflow' ? 'primary' : 'secondary'}>Workflow</Button>
        <Button onClick={() => setActiveTab('history')} variant={activeTab === 'history' ? 'primary' : 'secondary'}>History</Button>
      </div>

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Interest action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Interest updated" tone="success" />}

      {activeTab === 'workflow' ? (
        <div className="workflow-stack">
          <Card title="Slip Lookup">
            <form className="inline-form" onSubmit={(event) => void handleCalculate(event)}>
              <FormField id="interest-slip-no" label="Slip Number or Barcode">
                <Input id="interest-slip-no" value={slipNo} onChange={(event) => setSlipNo(event.target.value)} />
              </FormField>
              <Button isLoading={isCalculating} type="submit" variant="primary">Load Slip</Button>
            </form>
            {calculation && (
              <KeyValueList items={[
                { key: 'Slip No', value: normalizedSlipNo },
                { key: 'Current Date', value: formatDate(calculation.currentDate ?? calculation.current_date) },
                { key: 'Total Interest', value: formatMoney(totalInterest) },
              ]} />
            )}
          </Card>

          <Card title="Accrual Breakdown">
            <DataTable
              columns={columns}
              emptyDescription={calculation ? 'No unpaid interest is due for this slip.' : 'Load a slip to calculate due interest.'}
              emptyTitle={calculation ? 'No interest due' : 'No calculation yet'}
              getItemId={(row) => row.id}
              getItemTitle={(row) => `${formatDate(row.start_date)} to ${formatDate(row.end_date)}`}
              items={rows}
            />
          </Card>

          <Card title="Record Payment">
            <form className="workflow-stack" onSubmit={handlePaymentSubmit}>
              <FormField id="interest-payment-amount" label="Payment Amount">
                <Input id="interest-payment-amount" min="0.01" step="0.01" type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
              </FormField>
              <label className="checkbox-line">
                <input checked={recordDebt} onChange={(event) => setRecordDebt(event.target.checked)} type="checkbox" />
                <span><LocalizedText text="Create debt if payment is insufficient" /></span>
              </label>
              {isInsufficient && !recordDebt && (
                <Alert message="Payment is less than calculated interest. Confirm debt recording before submitting." title="Insufficient payment" tone="warning" />
              )}
              <ActionBar>
                <Button onClick={() => { setPaymentAmount(''); setRecordDebt(false); setPaymentResult(null) }} variant="secondary">Reset</Button>
                <Button disabled={!calculation} isLoading={isPaying} type="submit" variant="primary">Record Payment</Button>
              </ActionBar>
            </form>
          </Card>
        </div>
      ) : (
        <Card title="Interest History" description={`${total} total payment${total === 1 ? '' : 's'}`}>
          <DataTable
            columns={historyColumns}
            emptyDescription="Completed interest payments will appear here."
            emptyTitle="No interest payments yet"
            getItemId={(row) => row.id}
            getItemTitle={(row) => row.slip_no ? `Slip ${row.slip_no}` : `Interest Payment #${row.id}`}
            isLoading={isLoadingHistory}
            items={history}
            pagination={{
              currentPage,
              lastPage,
              onNext: () => setCurrentPage((page) => page + 1),
              onPrevious: () => setCurrentPage((page) => page - 1),
              total,
            }}
          />
        </Card>
      )}

      <ConfirmDialog
        confirmLabel="Record Debt"
        isLoading={isPaying}
        isOpen={confirmDebt}
        message="Payment is insufficient. Submit this payment and create debt for the remaining interest?"
        onCancel={() => setConfirmDebt(false)}
        onConfirm={() => void submitPayment(true)}
        title="Confirm debt recording"
      />
      <Modal
        footer={<Button onClick={() => setPaymentResult(null)} variant="primary">Done</Button>}
        isOpen={Boolean(paymentResult)}
        onClose={() => setPaymentResult(null)}
        title="Interest Payment Result"
      >
        {paymentResult && (
          <KeyValueList items={[
            { key: 'Status', value: paymentResult.status },
            { key: 'Paid Amount', value: formatMoney(paymentResult.paidAmount ?? paymentResult.paid_amount) },
            { key: 'Debt Amount', value: formatMoney(paymentResult.debtAmount ?? paymentResult.debt_amount) },
            { key: 'Change', value: formatMoney(paymentResult.changeAmount ?? paymentResult.change_amount) },
          ]} />
        )}
      </Modal>
    </section>
  )
}

function getBreakdown(calculation: InterestCalculationResult | null) {
  return calculation?.interestBreakdown ?? calculation?.interest_breakdown ?? []
}

function getTotalInterest(calculation: InterestCalculationResult | null) {
  return calculation?.totalInterestAmount ?? calculation?.total_interest_amount ?? 0
}

function getSlipNo(calculation: InterestCalculationResult | null) {
  return calculation?.slipNo ?? calculation?.slip_no ?? ''
}

function getSlipUpdateKey(calculation: InterestCalculationResult | null) {
  return calculation?.slipUpdateKey ?? calculation?.slip_update_key ?? null
}

function getInterestAmount(row: InterestBreakdownRow) {
  return row.interestAmount ?? row.interest_amount
}

function getRowUpdateKey(row: InterestBreakdownRow) {
  return row.updateKey ?? row.update_key ?? null
}

function toPaymentBreakdownPayload(row: InterestBreakdownRow) {
  const updateKey = getRowUpdateKey(row)

  if (updateKey === null) {
    throw new Error('Interest breakdown data is stale or incomplete. Refresh the calculation and try again.')
  }

  return {
    id: row.id,
    update_key: updateKey,
    interest_amount: getInterestAmount(row),
    start_date: row.start_date ?? row.startDate ?? null,
    end_date: row.end_date ?? row.endDate ?? null,
  }
}
