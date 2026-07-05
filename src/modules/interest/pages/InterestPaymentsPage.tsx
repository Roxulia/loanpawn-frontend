import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Input } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { ArrowRightIcon, SearchIcon } from '../../../components/icons/icon'
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
    { header: 'Start Date', key: 'start', render: (row) => formatDate(row.start_period_at) },
    { header: 'End Date', key: 'end', render: (row) => formatDate(row.end_period_at) },
    { header: 'Interest Amount', key: 'amount', render: (row) => formatMoney(getInterestAmount(row)) },
  ]

  const historyColumns: Array<DataTableColumn<InterestPaymentHistoryItem>> = [
    { header: 'Slip No', key: 'slip', render: (row) => <strong>{row.slip_no ?? '-'}</strong> },
    { header: 'Period', key: 'period', render: (row) => `${formatDate(row.start_period_at)} - ${formatDate(row.end_period_at)}` },
    { header: 'Interest', key: 'interest', render: (row) => formatMoney(row.interest_amount) },
    { header: 'Paid Amount', key: 'paid', render: (row) => formatMoney(row.payment_amount) },
    { header: 'Change', key: 'change', render: (row) => formatMoney(row.change_amount) },
    { header: 'Payment Date', key: 'paymentDate', render: (row) => formatDate(row.payment_at) },
    { header: 'Notes', key: 'notes', render: (row) => row.notes || '-' },
  ]

  return (
    <section className="page ops-page ops-page--cashier">
      <div className="ops-hero">
        <SectionHeader title="Interest Payments" subtitle="Calculate due interest, record payment, and create debt when needed." />
        <div className="ops-metrics" aria-label={t('Interest payment summary')}>
          <div className="ops-metric ops-metric--amount">
            <span>Total interest</span>
            <strong>{formatMoney(totalInterest)}</strong>
          </div>
          <div className="ops-metric">
            <span>Accrual rows</span>
            <strong>{rows.length}</strong>
          </div>
          <div className="ops-metric">
            <span>History total</span>
            <strong>{formatNumber(total)}</strong>
          </div>
        </div>
      </div>

      <div className="module-tabs ops-tabs" role="tablist" aria-label={t('Interest payment sections')}>
        <Button aria-pressed={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} variant={activeTab === 'workflow' ? 'primary' : 'secondary'}>Workflow</Button>
        <Button aria-pressed={activeTab === 'history'} onClick={() => setActiveTab('history')} variant={activeTab === 'history' ? 'primary' : 'secondary'}>History</Button>
      </div>

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Interest action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Interest updated" tone="success" />}

      {activeTab === 'workflow' ? (
        <div className="workflow-stack">
          <Card title="Slip Lookup">
            <form className="inline-form ops-lookup-form interest-lookup-form" onSubmit={(event) => void handleCalculate(event)}>
              <FormField id="interest-slip-no" label="Slip Number or Barcode">
                <Input id="interest-slip-no" value={slipNo} onChange={(event) => setSlipNo(event.target.value)} />
              </FormField>
              <Button aria-label="Load Slip" className="interest-lookup-submit" isLoading={isCalculating} leftIcon={<SearchIcon />} title="Load Slip" type="submit" variant="primary">Load Slip</Button>
            </form>
          </Card>

          {calculation && (
            <div className="ops-post-lookup-grid">
              <Card title="Accrual Breakdown">
                <div className="ops-amount-panel ops-amount-panel--summary interest-accrual-desktop-detail">
                  <KeyValueList items={[
                    { key: 'Slip No', value: normalizedSlipNo },
                    { key: 'Current Date', value: formatDate(calculation.current_date) },
                    { key: 'Total Interest', value: formatMoney(totalInterest) },
                  ]} />
                </div>
                <div className="interest-accrual-desktop-detail">
                  <DataTable
                    columns={columns}
                    emptyDescription="No unpaid interest is due for this slip."
                    emptyTitle="No interest due"
                    getItemId={(row) => row.id}
                    getItemTitle={(row) => `${formatDate(row.start_period_at)} to ${formatDate(row.end_period_at)}`}
                    items={rows}
                  />
                </div>
                <InterestAccrualMobileDetail
                  currentDate={formatDate(calculation.current_date)}
                  rows={rows}
                  slipNo={normalizedSlipNo}
                  totalInterest={totalInterest}
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
          )}
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
            { key: 'Status', value: formatPaymentStatus(paymentResult.status) },
            { key: 'Paid Amount', value: formatMoney(paymentResult.paidAmount) },
            { key: 'Debt Amount', value: formatMoney(paymentResult.debtAmount) },
            { key: 'Change', value: formatMoney(paymentResult.changeAmount) },
          ]} />
        )}
      </Modal>
    </section>
  )
}

function formatPaymentStatus(status: string) {
  switch (status){
    case 'debt_created' : return "Debt Created with leftover interest";
    case 'change_made' : return "Change Amount needed to be returned to customer";
    case 'success' : return "Paid in full";
    default: return status;
  }
}
function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function InterestAccrualMobileDetail({
  currentDate,
  rows,
  slipNo,
  totalInterest,
}: {
  currentDate: string
  rows: InterestBreakdownRow[]
  slipNo: string
  totalInterest: number
}) {
  return (
    <section className="interest-accrual-mobile-detail">
      <div className="interest-accrual-mobile-detail__header">
        <h3>Accrual Breakdown</h3>
        <span>{rows.length} Record{rows.length === 1 ? '' : 's'} Found</span>
      </div>

      <div className="interest-accrual-mobile-summary">
        <div className="interest-accrual-mobile-summary__header">
          <p>Slip No</p>
          <strong>{slipNo || '-'}</strong>
        </div>
        <div className="interest-accrual-mobile-summary__content">
          <div>
            <p>Current Date</p>
            <strong>{currentDate}</strong>
          </div>
          <div>
            <p>Total Interest</p>
            <strong>{formatMoney(totalInterest)}</strong>
          </div>
        </div>
      </div>

      {rows.map((row, index) => (
        <article className="interest-accrual-mobile-row" key={row.id}>
          <div className="interest-accrual-mobile-row__top">
            <span>{index === 0 ? 'Active Row' : `Row ${index + 1}`}</span>
            <strong>{formatMoney(getInterestAmount(row))}</strong>
          </div>
          <div className="interest-accrual-mobile-row__period">
            <div>
              <span>Start Date</span>
              <strong>{formatDate(row.start_period_at)}</strong>
            </div>
            <ArrowRightIcon />
            <div>
              <span>End Date</span>
              <strong>{formatDate(row.end_period_at)}</strong>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}

function getBreakdown(calculation: InterestCalculationResult | null) {
  return calculation?.interest_breakdown ?? []
}

function getTotalInterest(calculation: InterestCalculationResult | null) {
  return calculation?.total_interest_amount ?? 0
}

function getSlipNo(calculation: InterestCalculationResult | null) {
  return calculation?.slip_no ?? ''
}

function getSlipUpdateKey(calculation: InterestCalculationResult | null) {
  return calculation?.slip_update_key ?? null
}

function getInterestAmount(row: InterestBreakdownRow) {
  return row.interest_amount
}

function getRowUpdateKey(row: InterestBreakdownRow) {
  return row.update_key ?? null
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
    start_period_at: row.start_period_at ?? null,
    end_period_at: row.end_period_at ?? null,
  }
}
