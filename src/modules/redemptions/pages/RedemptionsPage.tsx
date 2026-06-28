import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Badge, Button, Input, Textarea } from '../../../components/atoms'
import { Alert, EmptyState, LoadingState } from '../../../components/feedback'
import { CloseIcon, FilterIcon, SearchIcon } from '../../../components/icons/icon'
import { ActionBar, Card, FilterBar, FormField, KeyValueList, SectionHeader } from '../../../components/molecules'
import { DataTable, Modal, type DataTableColumn } from '../../../components/organisms'
import { LocalizedText, useUiLocale } from '../../../locales/UiLocale'
import { createIdempotencyKey } from '../../../services/http/idempotency'
import { formatDate, formatMoney, getSlipCustomerName } from '../../slips/slipFormat'
import { redemptionService, type RedemptionCalculationResult, type RedemptionDebt, type RedemptionDetail, type RedemptionInterestPayment } from '../services/redemptionService'

const perPage = 10

type RedemptionTab = 'workflow' | 'history'

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function initialRedemptionDate() {
  return formatDateInputValue(new Date())
}

function initialMonthStartDate() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')

  return `${today.getFullYear()}-${month}-01`
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
  const [managementStartDate, setManagementStartDate] = useState(initialMonthStartDate)
  const [managementEndDate, setManagementEndDate] = useState(initialRedemptionDate)
  const [draftManagementStartDate, setDraftManagementStartDate] = useState(initialMonthStartDate)
  const [draftManagementEndDate, setDraftManagementEndDate] = useState(initialRedemptionDate)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isManagementDetailModalOpen, setIsManagementDetailModalOpen] = useState(false)
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
      const response = await redemptionService.listRedemptions({
        endDate: managementEndDate,
        page,
        perPage,
        startDate: managementStartDate,
      })
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
  }, [managementEndDate, managementStartDate])

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

  function applyManagementFilters() {
    if (draftManagementStartDate && draftManagementEndDate && draftManagementEndDate < draftManagementStartDate) {
      setError('To date must be on or after from date.')
      return
    }

    setManagementStartDate(draftManagementStartDate)
    setManagementEndDate(draftManagementEndDate)
    setSelectedRecord(null)
    setCurrentPage(1)
    setIsFilterModalOpen(false)
  }

  function clearManagementFilters() {
    setDraftManagementStartDate('')
    setDraftManagementEndDate('')
    setManagementStartDate('')
    setManagementEndDate('')
    setSelectedRecord(null)
    setCurrentPage(1)
    setIsFilterModalOpen(false)
  }

  function openMobileManagementDetail(record: RedemptionDetail) {
    setSelectedRecord(record)
    setIsManagementDetailModalOpen(true)
  }

  const historyColumns: Array<DataTableColumn<RedemptionDetail>> = [
    { header: 'Slip No', key: 'slip', render: (record) => <strong>{getRedemptionSlipNumber(record)}</strong> },
    { header: 'Net Amount', key: 'net', render: (record) => formatMoney(getRedemptionAmount(record, 'net')) },
    { header: 'Received', key: 'received', render: (record) => formatMoney(getRedemptionAmount(record, 'received')) },
    { header: 'Change', key: 'change', render: (record) => formatMoney(getRedemptionAmount(record, 'change')) },
    { header: 'Redeemed At', key: 'date', render: (record) => formatDate(getRedemptionDate(record)) },
  ]

  return (
    <section className="page ops-page ops-page--settlement">
      <div className="ops-hero">
        <SectionHeader title="Redemptions" subtitle="Calculate redemption totals, receive payment, and review redemption records." />
        <div className="ops-metrics" aria-label={t('Redemption summary')}>
          <div className="ops-metric ops-metric--amount">
            <span>Total to pay</span>
            <strong>{formatMoney(totalToPay)}</strong>
          </div>
          <div className="ops-metric">
            <span>Change</span>
            <strong>{formatMoney(changeAmount)}</strong>
          </div>
          <div className="ops-metric">
            <span>History total</span>
            <strong>{formatNumber(total)}</strong>
          </div>
        </div>
      </div>

      <div className="module-tabs ops-tabs redemption-mobile-tabs" role="tablist" aria-label={t('Redemption sections')}>
        <Button aria-pressed={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} variant={activeTab === 'workflow' ? 'primary' : 'secondary'}>Creation</Button>
        <Button aria-pressed={activeTab === 'history'} onClick={() => setActiveTab('history')} variant={activeTab === 'history' ? 'primary' : 'secondary'}>Management</Button>
      </div>

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Redemption action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Redemption updated" tone="success" />}

      {activeTab === 'workflow' ? (
        <div className="workflow-stack">
          <Card title="Slip Lookup">
            <form className="inline-form ops-lookup-form redemption-lookup-form" onSubmit={(event) => void handleCalculate(event)}>
              <FormField id="redemption-slip-no" label="Slip Number or Barcode">
                <Input id="redemption-slip-no" value={slipNo} onChange={(event) => setSlipNo(event.target.value)} />
              </FormField>
              <Button aria-label="Load Detail" className="redemption-lookup-submit" isLoading={isCalculating} leftIcon={<SearchIcon />} title="Load Detail" type="submit" variant="primary">Load Detail</Button>
            </form>
          </Card>

          {calculation && (
            <div className="ops-post-lookup-grid">
              <Card title="Redemption Detail">
                <RedemptionSummary calculation={calculation} />
              </Card>

              <Card title="Receive Payment">
                <form className="workflow-stack redemption-payment-form" onSubmit={(event) => void handleRedeem(event)}>
                  <div className="form-grid-compact redemption-payment-form__fields">
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
                  <div className="ops-amount-panel redemption-payment-info">
                    <KeyValueList items={[
                      { key: 'Total Amount To Pay', value: formatMoney(totalToPay) },
                      { key: 'Received', value: formatMoney(paymentAmount) },
                      { key: 'Change', value: formatMoney(changeAmount) },
                    ]} />
                  </div>
                  <ActionBar>
                    <Button onClick={() => { resetRedemptionForm(); setRedemptionResult(null) }} variant="secondary">Reset</Button>
                    <Button disabled={!calculation} isLoading={isRedeeming} type="submit" variant="primary">Redeem</Button>
                  </ActionBar>
                </form>
                <div className="redemption-caution">
                  <strong><LocalizedText text="Before finalizing" /></strong>
                  <span><LocalizedText text="Inspect returned collateral before redeeming. Redeem will permanently update this slip." /></span>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="split-workspace ops-history-workspace redemption-management-workspace">
          <Card
            action={(
              <Button
                aria-label="Filter redemption dates"
                className="ui-button--icon redemption-management-mobile-filter-button"
                leftIcon={<FilterIcon />}
                onClick={() => setIsFilterModalOpen(true)}
                title="Filter redemption dates"
                variant="secondary"
              >
                Filter
              </Button>
            )}
            title="Redemption History"
            description={`${total} total redemption${total === 1 ? '' : 's'}`}
          >
            <div className="redemption-management-desktop-filter">
              <RedemptionManagementFilterFields
                endDate={draftManagementEndDate}
                onApply={applyManagementFilters}
                onClear={clearManagementFilters}
                onEndDateChange={setDraftManagementEndDate}
                onStartDateChange={setDraftManagementStartDate}
                startDate={draftManagementStartDate}
              />
            </div>
            <div className="redemption-management-desktop-list">
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
            </div>
            <RedemptionManagementMobileList
              currentPage={currentPage}
              isLoading={isLoadingRecords}
              lastPage={lastPage}
              onNext={() => setCurrentPage((page) => page + 1)}
              onPrevious={() => setCurrentPage((page) => page - 1)}
              onSelect={openMobileManagementDetail}
              records={records}
              total={total}
            />
          </Card>
          <div className="redemption-management-desktop-detail">
            {selectedRecord ? (
              <RedemptionManagementDetailCard record={selectedRecord} onClose={() => setSelectedRecord(null)} />
            ) : (
              <Card title="Redemption Detail" description="Select a redemption record">
                <p className="muted"><LocalizedText text="No redemption selected." /></p>
              </Card>
            )}
          </div>
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
      <Modal
        footer={(
          <>
            <Button onClick={clearManagementFilters} variant="secondary">Clear</Button>
            <Button onClick={applyManagementFilters} variant="primary">Apply Filter</Button>
          </>
        )}
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter redemption dates"
      >
        <div className="redemption-management-mobile-filter-modal">
          <RedemptionManagementDateFields
            endDate={draftManagementEndDate}
            onEndDateChange={setDraftManagementEndDate}
            onStartDateChange={setDraftManagementStartDate}
            startDate={draftManagementStartDate}
          />
        </div>
      </Modal>
      {isManagementDetailModalOpen && selectedRecord && (
        <div className="redemption-management-mobile-detail-backdrop" role="presentation" onMouseDown={() => setIsManagementDetailModalOpen(false)}>
          <div className="redemption-management-mobile-detail-modal" onMouseDown={(event) => event.stopPropagation()}>
            <RedemptionManagementDetailCard record={selectedRecord} onClose={() => setIsManagementDetailModalOpen(false)} />
          </div>
        </div>
      )}
    </section>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function RedemptionManagementDateFields({
  endDate,
  onEndDateChange,
  onStartDateChange,
  startDate,
}: {
  endDate: string
  onEndDateChange: (value: string) => void
  onStartDateChange: (value: string) => void
  startDate: string
}) {
  return (
    <div className="redemption-management-filter-fields">
      <FormField id="redemption-management-start-date" label="From date">
        <Input id="redemption-management-start-date" onChange={(event) => onStartDateChange(event.target.value)} type="date" value={startDate} />
      </FormField>
      <FormField id="redemption-management-end-date" label="To date">
        <Input id="redemption-management-end-date" onChange={(event) => onEndDateChange(event.target.value)} type="date" value={endDate} />
      </FormField>
    </div>
  )
}

function RedemptionManagementFilterFields({
  endDate,
  onApply,
  onClear,
  onEndDateChange,
  onStartDateChange,
  startDate,
}: {
  endDate: string
  onApply: () => void
  onClear: () => void
  onEndDateChange: (value: string) => void
  onStartDateChange: (value: string) => void
  startDate: string
}) {
  return (
    <FilterBar
      actions={(
        <>
          <Button onClick={onClear} variant="secondary">Clear</Button>
          <Button onClick={onApply} variant="primary">Apply Filter</Button>
        </>
      )}
    >
      <RedemptionManagementDateFields
        endDate={endDate}
        onEndDateChange={onEndDateChange}
        onStartDateChange={onStartDateChange}
        startDate={startDate}
      />
    </FilterBar>
  )
}

function RedemptionManagementMobileList({
  currentPage,
  isLoading,
  lastPage,
  onNext,
  onPrevious,
  onSelect,
  records,
  total,
}: {
  currentPage: number
  isLoading: boolean
  lastPage: number
  onNext: () => void
  onPrevious: () => void
  onSelect: (record: RedemptionDetail) => void
  records: RedemptionDetail[]
  total: number
}) {
  if (isLoading) {
    return (
      <div className="redemption-management-mobile-list">
        <LoadingState rows={5} />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="redemption-management-mobile-list">
        <EmptyState description="Completed redemptions will appear here." title="No redemptions yet" />
      </div>
    )
  }

  return (
    <div className="redemption-management-mobile-list">
      <div className="redemption-management-mobile-cards">
        {records.map((record) => (
          <button className="redemption-management-mobile-card" key={record.id} onClick={() => onSelect(record)} type="button">
            <strong>{getRedemptionSlipNumber(record)}</strong>
            <span>
              <span>
                <small>Total Amount</small>
                <b>{formatMoney(getRedemptionAmount(record, 'net'))}</b>
              </span>
              <span>
                <small>Redeemed Date</small>
                <b>{formatDate(getRedemptionDate(record))}</b>
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="ui-pagination redemption-management-mobile-pagination">
        <span className="ui-pagination__meta">
          Page {currentPage} of {lastPage} - {total} records
        </span>
        <Button disabled={currentPage <= 1} onClick={onPrevious} variant="secondary">Previous</Button>
        <Button disabled={currentPage >= lastPage} onClick={onNext} variant="secondary">Next</Button>
      </div>
    </div>
  )
}

function RedemptionSummary({ calculation }: { calculation: RedemptionCalculationResult }) {
  const interestPayments = getInterestPayments(calculation)
  const unpaidDebts = getUnpaidDebts(calculation)
  const collateralItems = calculation.collateral_items ?? calculation.slip.items ?? []

  return (
    <div className="redemption-detail-panel">
      <div className="redemption-mobile-summary-card">
        <div className="redemption-mobile-summary-card__header">
          <span>Slip No</span>
          <strong>{calculation.slip.slip_no}</strong>
        </div>
        <div className="redemption-mobile-summary-card__total">
          <span>Total Amount To Pay</span>
          <strong>{formatMoney(calculation.total_amount_to_pay)}</strong>
        </div>
        <div className="redemption-mobile-summary-card__metrics">
          <div>
            <span>Customer Name</span>
            <strong>{calculation.customer?.name ?? getSlipCustomerName(calculation.slip)}</strong>
          </div>
          <div>
            <span>Loan Amount</span>
            <strong>{formatMoney(calculation.loan_amount)}</strong>
          </div>
          <div>
            <span>Total Unpaid Interest</span>
            <strong>{formatMoney(calculation.calculated_interest)}</strong>
          </div>
          <div>
            <span>Total Unpaid Debt</span>
            <strong>{formatMoney(calculation.total_debt)}</strong>
          </div>
        </div>
        <div className="redemption-mobile-collateral-list">
          <div className="redemption-mobile-collateral-list__header">
            <strong>Collateral Items</strong>
            <span>{collateralItems.length} item(s)</span>
          </div>
          {collateralItems.length === 0 ? <p className="muted"><LocalizedText text="No collateral items returned." /></p> : (
            <div className="redemption-mobile-collateral-list__items">
              {collateralItems.map((item) => (
                <article className="redemption-mobile-collateral-item" key={item.code ?? item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.code ?? '-'}</span>
                  </div>
                  <span>{item.type}</span>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="redemption-summary-grid">
        <div>
          <span>Slip No</span>
          <strong>{calculation.slip.slip_no}</strong>
        </div>
        <div>
          <span>Customer</span>
          <strong>{calculation.customer?.name ?? getSlipCustomerName(calculation.slip)}</strong>
        </div>
        <div>
          <span>Loan Amount</span>
          <strong>{formatMoney(calculation.loan_amount)}</strong>
        </div>
        <div>
          <span>Interest</span>
          <strong>{formatMoney(calculation.calculated_interest)}</strong>
        </div>
        <div>
          <span>Debt</span>
          <strong>{formatMoney(calculation.total_debt)}</strong>
        </div>
        <div className="redemption-summary-grid__total">
          <span>Total Amount To Pay</span>
          <strong>{formatMoney(calculation.total_amount_to_pay)}</strong>
        </div>
      </div>

      <section className="redemption-snapshot-section redemption-mobile-hidden-snapshot">
        <header>
          <strong><LocalizedText text="Collateral Summary" /></strong>
          <span>{collateralItems.length} item(s)</span>
        </header>
        {collateralItems.length === 0 ? <p className="muted"><LocalizedText text="No collateral items returned." /></p> : (
          <DataTable
            columns={[
              { header: 'Code', key: 'code', render: (item) => item.code ?? '-' },
              { header: 'Name', key: 'name', render: (item) => <strong>{item.name}</strong> },
              { header: 'Type', key: 'type', render: (item) => item.type },
              { header: 'Estimated Value', key: 'estimated', render: (item) => formatMoney(item.estimated_value) },
            ]}
            getItemId={(item) => item.code ?? item.id}
            getItemTitle={(item) => item.name}
            items={collateralItems}
          />
        )}
      </section>

      <section className="redemption-snapshot-section redemption-mobile-hidden-snapshot">
        <header>
          <strong><LocalizedText text="Interest Snapshot" /></strong>
          <span>{interestPayments.length} row(s)</span>
        </header>
        {interestPayments.length === 0 ? <p className="muted"><LocalizedText text="No interest rows returned." /></p> : (
          <DataTable
            columns={[
              { header: 'Start Date', key: 'start', render: (payment) => formatDate(getInterestStartDate(payment)) },
              { header: 'End Date', key: 'end', render: (payment) => formatDate(getInterestEndDate(payment)) },
              { header: 'Interest', key: 'interest', render: (payment) => formatMoney(getInterestAmount(payment)) },
              { header: 'Status', key: 'status', render: (payment) => <Badge tone={isInterestPaid(payment) ? 'success' : 'warning'}>{isInterestPaid(payment) ? 'Paid' : 'Unpaid'}</Badge> },
            ]}
            getItemId={(payment) => payment.id}
            getItemTitle={(payment) => `${formatDate(getInterestStartDate(payment))} - ${formatDate(getInterestEndDate(payment))}`}
            items={interestPayments}
          />
        )}
      </section>

      <section className="redemption-snapshot-section redemption-mobile-hidden-snapshot">
        <header>
          <strong><LocalizedText text="Debt Snapshot" /></strong>
          <span>{unpaidDebts.length} unpaid</span>
        </header>
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

function RedemptionManagementDetailCard({ onClose, record }: { onClose: () => void; record: RedemptionDetail }) {
  const slipNumber = getRedemptionSlipNumber(record)

  return (
    <section className="redemption-management-detail-card">
      <header className="redemption-management-detail-card__header">
        <div>
          <h3>Redemption Detail</h3>
          <p>Slip {slipNumber}</p>
        </div>
        <button aria-label="Close detail view" onClick={onClose} type="button">
          <CloseIcon />
        </button>
      </header>

      <div className="redemption-management-detail-card__body">
        <div className="redemption-management-detail-card__metrics">
          <RedemptionMetricRow label="Slip No" tone="primary" value={slipNumber} />
          <RedemptionMetricRow label="Gross Amount" value={formatMoney(getRedemptionAmount(record, 'gross'))} />
          <RedemptionMetricRow label="Net Amount" tone="primary" value={formatMoney(getRedemptionAmount(record, 'net'))} />
          <RedemptionMetricRow label="Interest" tone="warning" value={formatMoney(getRedemptionAmount(record, 'interest'))} />
          <RedemptionMetricRow label="Received" tone="success" value={formatMoney(getRedemptionAmount(record, 'received'))} />
          <RedemptionMetricRow label="Change" value={formatMoney(getRedemptionAmount(record, 'change'))} />
          <RedemptionMetricRow label="Redeemed At" value={formatDate(getRedemptionDate(record))} />
        </div>

        <section className="redemption-management-detail-card__notes">
          <h4>Internal Notes</h4>
          <div>{record.notes || 'No notes recorded for this redemption.'}</div>
        </section>
      </div>
    </section>
  )
}

function RedemptionMetricRow({ label, tone, value }: { label: string; tone?: 'primary' | 'success' | 'warning'; value: string }) {
  const toneClass = tone ? ` redemption-management-detail-card__row--${tone}` : ''

  return (
    <div className={`redemption-management-detail-card__row${toneClass}`}>
      <span>{label}</span>
      <strong>{value}</strong>
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

function isInterestPaid(payment: RedemptionInterestPayment) {
  return Boolean(payment.is_paid ?? payment.isPaid ?? false)
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
