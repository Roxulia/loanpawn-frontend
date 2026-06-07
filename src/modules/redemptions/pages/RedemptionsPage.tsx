import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Input, Textarea } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { ActionBar, Card, FormField, KeyValueList, SectionHeader } from '../../../components/molecules'
import { DataTable, Modal, type DataTableColumn } from '../../../components/organisms'
import { LocalizedText, useUiLocale } from '../../../locales/UiLocale'
import { createIdempotencyKey } from '../../../services/http/idempotency'
import { formatDate, formatMoney, getSlipCustomerName } from '../../slips/slipFormat'
import { redemptionService, type RedemptionCalculationResult, type RedemptionDebt, type RedemptionDetail, type RedemptionInterestPayment } from '../services/redemptionService'

const perPage = 10

type RedemptionTab = 'workflow' | 'history'

function initialRedemptionDate() {
  return new Date().toISOString().slice(0, 10)
}

export function RedemptionsPage() {
  const { t } = useUiLocale()
  const [activeTab, setActiveTab] = useState<RedemptionTab>('workflow')
  const [slipNo, setSlipNo] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [redemptionDate, setRedemptionDate] = useState(initialRedemptionDate)
  const [notes, setNotes] = useState('')
  const [calculation, setCalculation] = useState<RedemptionCalculationResult | null>(null)
  const [redemptionResult, setRedemptionResult] = useState<RedemptionDetail | null>(null)
  const [records, setRecords] = useState<RedemptionDetail[]>([])
  const [selectedRecord, setSelectedRecord] = useState<RedemptionDetail | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const redemptionIdempotencyKeyRef = useRef<string | null>(null)

  const totalToPay = calculation?.total_amount_to_pay ?? 0
  const changeAmount = Math.max(Number(paymentAmount || 0) - totalToPay, 0)

  const loadRecords = useCallback(async (page: number) => {
    setIsLoadingRecords(true)
    setError(null)

    try {
      const response = await redemptionService.listRedemptions({ page, perPage })
      const pageData = response
      const nextItems = pageData.items ?? []
      const nextPerPage = pageData.per_page ?? pageData.perPage ?? perPage

      setRecords(nextItems)
      setSelectedRecord((current) => current ?? nextItems[0] ?? null)
      setCurrentPage(pageData.current_page ?? pageData.page ?? page)
      setLastPage(Math.max(1, Math.ceil((pageData.total ?? nextItems.length) / nextPerPage)))
      setTotal(pageData.total ?? nextItems.length)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load redemption history.')
    } finally {
      setIsLoadingRecords(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      const loadTimer = window.setTimeout(() => {
        void loadRecords(currentPage)
      }, 0)

      return () => window.clearTimeout(loadTimer)
    }
  }, [activeTab, currentPage, loadRecords])

  async function handleCalculate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (!slipNo.trim()) {
      setError('Slip number is required.')
      return
    }

    setIsCalculating(true)
    setError(null)
    setNotice(null)
    setRedemptionResult(null)

    try {
      const response = await redemptionService.calculate(slipNo.trim())
      setCalculation(response)
      setPaymentAmount(String(response.total_amount_to_pay))
      setNotice(`Redemption calculated for slip ${response.slip.slip_no}.`)
    } catch (calculateError) {
      setCalculation(null)
      setError(calculateError instanceof Error ? calculateError.message : 'Unable to calculate redemption.')
    } finally {
      setIsCalculating(false)
    }
  }

  async function handleRedeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (redemptionIdempotencyKeyRef.current !== null) {
      return
    }

    if (!calculation) {
      setError('Calculate a slip before redeeming.')
      return
    }

    if (Number(paymentAmount) < totalToPay) {
      setError('Payment amount must be at least the total amount to pay.')
      return
    }

    setIsRedeeming(true)
    setError(null)
    redemptionIdempotencyKeyRef.current = createIdempotencyKey()

    try {
      const interests = getInterestPayments(calculation).map(toRedemptionInterestPayload)
      const debts = getUnpaidDebts(calculation).map(toRedemptionDebtPayload)
      const response = await redemptionService.create({
        slip_no: calculation.slip.slip_no,
        calculated_total: totalToPay,
        payment_amount: Number(paymentAmount),
        interests,
        debts,
        redemption_date: redemptionDate || undefined,
        notes: notes.trim() || undefined,
      }, undefined, {
        idempotencyKey: redemptionIdempotencyKeyRef.current,
      })

      setNotice('Pawn redemption created successfully.')
      setRedemptionResult(response)
      resetRedemptionForm()
      if (activeTab === 'history') {
        await loadRecords(1)
      }
    } catch (redeemError) {
      setError(redeemError instanceof Error ? redeemError.message : 'Unable to redeem slip.')
    } finally {
      redemptionIdempotencyKeyRef.current = null
      setIsRedeeming(false)
    }
  }

  function resetRedemptionForm() {
    setSlipNo('')
    setPaymentAmount('')
    setRedemptionDate(initialRedemptionDate())
    setNotes('')
    setCalculation(null)
  }

  const historyColumns: Array<DataTableColumn<RedemptionDetail>> = [
    { header: 'Slip No', key: 'slip', render: (record) => <strong>{getRedemptionSlipNumber(record)}</strong> },
    { header: 'Net Amount', key: 'net', render: (record) => formatMoney(getRedemptionAmount(record, 'net')) },
    { header: 'Received', key: 'received', render: (record) => formatMoney(getRedemptionAmount(record, 'received')) },
    { header: 'Change', key: 'change', render: (record) => formatMoney(getRedemptionAmount(record, 'change')) },
    { header: 'Redeemed At', key: 'date', render: (record) => formatDate(getRedemptionDate(record)) },
  ]

  return (
    <section className="page">
      <SectionHeader title="Redemptions" subtitle="Calculate redemption totals, receive payment, and review redemption records." />

      <div className="module-tabs" role="tablist" aria-label={t('Redemption sections')}>
        <Button onClick={() => setActiveTab('workflow')} variant={activeTab === 'workflow' ? 'primary' : 'secondary'}>Workflow</Button>
        <Button onClick={() => setActiveTab('history')} variant={activeTab === 'history' ? 'primary' : 'secondary'}>History</Button>
      </div>

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Redemption action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Redemption updated" tone="success" />}

      {activeTab === 'workflow' ? (
        <div className="workflow-stack">
          <Card title="Slip Lookup">
            <form className="inline-form" onSubmit={(event) => void handleCalculate(event)}>
              <FormField id="redemption-slip-no" label="Slip Number or Barcode">
                <Input id="redemption-slip-no" value={slipNo} onChange={(event) => setSlipNo(event.target.value)} />
              </FormField>
              <Button isLoading={isCalculating} type="submit" variant="primary">Load Detail</Button>
            </form>
            {calculation && <RedemptionSummary calculation={calculation} />}
          </Card>

          <Card title="Receive Payment">
            <form className="workflow-stack" onSubmit={(event) => void handleRedeem(event)}>
              <div className="form-grid-compact">
                <FormField id="redemption-payment" label="Payment Amount">
                  <Input id="redemption-payment" min="0" step="0.01" type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
                </FormField>
                <FormField id="redemption-date" label="Redemption Date">
                  <Input id="redemption-date" type="date" value={redemptionDate} onChange={(event) => setRedemptionDate(event.target.value)} />
                </FormField>
              </div>
              <FormField id="redemption-notes" label="Notes">
                <Textarea id="redemption-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </FormField>
              <KeyValueList items={[
                { key: 'Total Amount To Pay', value: formatMoney(totalToPay) },
                { key: 'Received', value: formatMoney(paymentAmount) },
                { key: 'Change', value: formatMoney(changeAmount) },
              ]} />
              <ActionBar>
                <Button onClick={() => { resetRedemptionForm(); setRedemptionResult(null) }} variant="secondary">Reset</Button>
                <Button disabled={!calculation} isLoading={isRedeeming} type="submit" variant="primary">Redeem</Button>
              </ActionBar>
            </form>
          </Card>
        </div>
      ) : (
        <div className="split-workspace">
          <Card title="Redemption History" description={`${total} total redemption${total === 1 ? '' : 's'}`}>
            <DataTable
              columns={historyColumns}
              emptyDescription="Completed redemptions will appear here."
              emptyTitle="No redemptions yet"
              getItemId={(record) => record.id}
              getItemTitle={(record) => `Slip ${getRedemptionSlipNumber(record)}`}
              isLoading={isLoadingRecords}
              items={records}
              onRowClick={(record) => setSelectedRecord(record)}
              pagination={{
                currentPage,
                lastPage,
                onNext: () => setCurrentPage((page) => page + 1),
                onPrevious: () => setCurrentPage((page) => page - 1),
                total,
              }}
            />
          </Card>
          <Card title="Redemption Detail" description={selectedRecord ? `Slip ${getRedemptionSlipNumber(selectedRecord)}` : 'Select a redemption record'}>
            {selectedRecord ? <RedemptionDetailPanel record={selectedRecord} /> : <p className="muted"><LocalizedText text="No redemption selected." /></p>}
          </Card>
        </div>
      )}
      <Modal
        footer={<Button onClick={() => setRedemptionResult(null)} variant="primary">Done</Button>}
        isOpen={Boolean(redemptionResult)}
        onClose={() => setRedemptionResult(null)}
        title="Redemption Result"
      >
        {redemptionResult && <RedemptionDetailPanel record={redemptionResult} />}
      </Modal>
    </section>
  )
}

function RedemptionSummary({ calculation }: { calculation: RedemptionCalculationResult }) {
  const interestPayments = getInterestPayments(calculation)
  const unpaidDebts = getUnpaidDebts(calculation)

  return (
    <div className="workflow-stack">
      <KeyValueList items={[
        { key: 'Slip No', value: calculation.slip.slip_no },
        { key: 'Customer', value: calculation.customer?.name ?? getSlipCustomerName(calculation.slip) },
        { key: 'Loan Amount', value: formatMoney(calculation.loan_amount) },
        { key: 'Interest', value: formatMoney(calculation.calculated_interest) },
        { key: 'Debt', value: formatMoney(calculation.total_debt) },
        { key: 'Total Amount To Pay', value: formatMoney(calculation.total_amount_to_pay) },
      ]} />
      <section className="detail-list">
        <strong><LocalizedText text="Collateral Summary" /></strong>
        {(calculation.collateral_items ?? calculation.slip.items ?? []).length === 0 ? <p className="muted"><LocalizedText text="No collateral items returned." /></p> : (
          <DataTable
            columns={[
              { header: 'Code', key: 'code', render: (item) => item.code ?? '-' },
              { header: 'Name', key: 'name', render: (item) => <strong>{item.name}</strong> },
              { header: 'Type', key: 'type', render: (item) => item.type },
              { header: 'Estimated Value', key: 'estimated', render: (item) => formatMoney(item.estimated_value) },
            ]}
            getItemId={(item) => item.code ?? item.id}
            getItemTitle={(item) => item.name}
            items={calculation.collateral_items ?? calculation.slip.items ?? []}
          />
        )}
      </section>
      <section className="detail-list">
        <strong><LocalizedText text="Interest Snapshot" /></strong>
        {interestPayments.length === 0 ? <p className="muted"><LocalizedText text="No interest rows returned." /></p> : (
          <DataTable
            columns={[
              { header: 'Start Date', key: 'start', render: (payment) => formatDate(getInterestStartDate(payment)) },
              { header: 'End Date', key: 'end', render: (payment) => formatDate(getInterestEndDate(payment)) },
              { header: 'Interest', key: 'interest', render: (payment) => formatMoney(getInterestAmount(payment)) },
            ]}
            getItemId={(payment) => payment.id}
            getItemTitle={(payment) => `${formatDate(getInterestStartDate(payment))} - ${formatDate(getInterestEndDate(payment))}`}
            items={interestPayments}
          />
        )}
      </section>
      <section className="detail-list">
        <strong><LocalizedText text="Debt Snapshot" /></strong>
        {unpaidDebts.length === 0 ? <p className="muted"><LocalizedText text="No unpaid debts returned." /></p> : (
          <DataTable
            columns={[
              { header: 'Code', key: 'code', render: (debt) => <strong>{debt.code ?? '-'}</strong> },
              { header: 'Description', key: 'description', render: (debt) => debt.description ?? '-' },
              { header: 'Amount', key: 'amount', render: (debt) => formatMoney(debt.amount) },
            ]}
            getItemId={(debt) => debt.code ?? debt.id}
            getItemTitle={(debt) => debt.code ?? `Debt ${debt.id}`}
            items={unpaidDebts}
          />
        )}
      </section>
    </div>
  )
}

function RedemptionDetailPanel({ record }: { record: RedemptionDetail }) {
  return (
    <KeyValueList items={[
      { key: 'Slip No', value: getRedemptionSlipNumber(record) },
      { key: 'Gross Amount', value: formatMoney(getRedemptionAmount(record, 'gross')) },
      { key: 'Net Amount', value: formatMoney(getRedemptionAmount(record, 'net')) },
      { key: 'Interest', value: formatMoney(getRedemptionAmount(record, 'interest')) },
      { key: 'Received', value: formatMoney(getRedemptionAmount(record, 'received')) },
      { key: 'Change', value: formatMoney(getRedemptionAmount(record, 'change')) },
      { key: 'Redeemed At', value: formatDate(getRedemptionDate(record)) },
      { key: 'Notes', value: record.notes || '-' },
    ]} />
  )
}

function getRedemptionSlipNumber(record: RedemptionDetail) {
  return record.slip_number ?? record.slipNumber ?? '-'
}

function getRedemptionDate(record: RedemptionDetail) {
  return record.redemption_date ?? record.redemptionDate ?? null
}

function getRedemptionAmount(
  record: RedemptionDetail,
  field: 'gross' | 'net' | 'interest' | 'received' | 'change',
) {
  if (field === 'gross') {
    return record.gross_amount ?? record.grossAmount ?? 0
  }

  if (field === 'net') {
    return record.net_amount ?? record.netAmount ?? 0
  }

  if (field === 'interest') {
    return record.interest_amount ?? record.interestAmount ?? 0
  }

  if (field === 'received') {
    return record.received_amount ?? record.receivedAmount ?? 0
  }

  return record.change_amount ?? record.changeAmount ?? 0
}

function getInterestPayments(calculation: RedemptionCalculationResult | null) {
  return calculation?.interest_payments ?? []
}

function getUnpaidDebts(calculation: RedemptionCalculationResult | null) {
  return (calculation?.debts ?? []).filter((debt) => !(debt.is_paid ?? debt.isPaid ?? false))
}

function getInterestUpdateKey(payment: RedemptionInterestPayment) {
  return payment.update_key ?? payment.updateKey ?? null
}

function getInterestAmount(payment: RedemptionInterestPayment) {
  return payment.interest_amount ?? payment.interestAmount ?? 0
}

function getInterestStartDate(payment: RedemptionInterestPayment) {
  return payment.start_date ?? payment.startDate ?? null
}

function getInterestEndDate(payment: RedemptionInterestPayment) {
  return payment.end_date ?? payment.endDate ?? null
}

function getDebtUpdateKey(debt: RedemptionDebt) {
  return debt.update_key ?? debt.updateKey ?? null
}

function toRedemptionInterestPayload(payment: RedemptionInterestPayment) {
  const updateKey = getInterestUpdateKey(payment)

  if (updateKey === null) {
    throw new Error('Interest snapshot data is stale or incomplete. Refresh the calculation and try again.')
  }

  return {
    id: payment.id,
    update_key: updateKey,
    interest_amount: getInterestAmount(payment),
    start_date: getInterestStartDate(payment),
    end_date: getInterestEndDate(payment),
  }
}

function toRedemptionDebtPayload(debt: RedemptionDebt) {
  const updateKey = getDebtUpdateKey(debt)

  if (updateKey === null) {
    throw new Error('Debt snapshot data is stale or incomplete. Refresh the calculation and try again.')
  }

  return {
    id: debt.id,
    update_key: updateKey,
    amount: Number(debt.amount),
  }
}
