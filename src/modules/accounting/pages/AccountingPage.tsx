import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Button, Input } from '../../../components/atoms'
import { Alert, EmptyState, LoadingState } from '../../../components/feedback'
import { CheckIcon, DownloadIcon, FilterIcon, VaultIcon } from '../../../components/icons/icon'
import { FormField, SearchField } from '../../../components/molecules'
import { ConfirmDialog, Modal } from '../../../components/organisms'
import type { AccountingDay, AccountingOverview, AccountingTransaction } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { usePermissions } from '../../auth'
import {
  formatMoney,
  getStringField,
  transactionTypeLabel,
} from '../../finance/financeFormat'

const perPage = 10
const today = new Date().toISOString().slice(0, 10)
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

export function AccountingPage() {
  const { hasPermission } = usePermissions()
  const canList = hasPermission('list_accounting')
  const canCloseAccountingDay = hasPermission('close_accounting_day')
  const [overview, setOverview] = useState<AccountingOverview | null>(null)
  const [accountingDay, setAccountingDay] = useState<AccountingDay | null>(null)
  const [transactions, setTransactions] = useState<AccountingTransaction[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [startDate, setStartDate] = useState(monthStart)
  const [endDate, setEndDate] = useState(today)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [isClosingDay, setIsClosingDay] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadAccounting = useCallback(async (page: number, search = debouncedSearchTerm) => {
    if (!canList) {
      setOverview(null)
      setTransactions([])
      setCurrentPage(1)
      setLastPage(1)
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [overviewResponse, transactionResponse, accountingDayResponse] = await Promise.all([
        tenantResourceService.getAccountingOverview(),
        tenantResourceService.listAccounting({ page, perPage, search }),
        tenantResourceService.getCurrentAccountingDay(),
      ])

      setOverview(overviewResponse)
      setTransactions(transactionResponse.items)
      setCurrentPage(transactionResponse.current_page ?? page)
      setLastPage(transactionResponse.last_page ?? 1)
      setTotal(transactionResponse.total)
      setAccountingDay(accountingDayResponse)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load accounting ledger.')
    } finally {
      setIsLoading(false)
    }
  }, [canList, debouncedSearchTerm])

  useEffect(() => {
    const searchTimer = window.setTimeout(() => {
      setCurrentPage(1)
      setDebouncedSearchTerm(searchTerm.trim())
    }, 300)

    return () => window.clearTimeout(searchTimer)
  }, [searchTerm])

  useEffect(() => {
    void loadAccounting(currentPage, debouncedSearchTerm)
  }, [currentPage, debouncedSearchTerm, loadAccounting])

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void loadAccounting(currentPage, debouncedSearchTerm)
    }, 300000)

    return () => window.clearInterval(refreshTimer)
  }, [currentPage, debouncedSearchTerm, loadAccounting])

  async function generateReport() {
    if (!startDate || !endDate) {
      setError('Choose both start date and end date.')
      return
    }

    setIsDownloading(true)
    setError(null)

    try {
      const blob = await tenantResourceService.downloadAccountingLedger({ endDate, startDate })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `general-ledger-${startDate}-to-${endDate}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Unable to download ledger report.')
    } finally {
      setIsDownloading(false)
    }
  }

  async function closeAccountingDay() {
    if (isClosingDay) return

    setIsClosingDay(true)
    setError(null)
    setNotice(null)

    try {
      const closedDay = await tenantResourceService.closeCurrentAccountingDay()
      setAccountingDay(closedDay)
      setIsCloseDialogOpen(false)
      setNotice(`Accounting day ${closedDay.business_date} was closed successfully.`)
      await loadAccounting(currentPage, debouncedSearchTerm)
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : 'Unable to close the accounting day.')
    } finally {
      setIsClosingDay(false)
    }
  }

  return (
    <section className="page accounting-page accounting-serene-page">
      <header className="accounting-serene-header">
        <div>
          <span className="eyebrow">Finance / Ledger</span>
          <h1>Accounting Ledger</h1>
          <p>Monitor capital movement, verify ledger activity, and export date-range accounting reports.</p>
        </div>
      </header>

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Accounting action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Accounting day updated" tone="success" />}

      <AccountingDayStatusCard accountingDay={accountingDay} canClose={canCloseAccountingDay} className="accounting-day-status-card--desktop" onClose={() => setIsCloseDialogOpen(true)} />
      <AccountingDayStatusCard accountingDay={accountingDay} canClose={canCloseAccountingDay} className="accounting-day-status-card--mobile" onClose={() => setIsCloseDialogOpen(true)} />

      <section className="accounting-serene-metrics" aria-label="Accounting overview">
        <AccountingMetricCard
          icon={<VaultIcon />}
          label="System Vault"
          meta="Total Liquid Capital"
          trend="Live ledger balance"
          value={formatMoney(getOverviewNumber(overview, 'liquidCapital', 'liquid_capital'))}
          variant="primary"
        />
        <AccountingMetricCard
          label="Incoming Flows"
          meta={`${formatPercent(getOverviewNumber(overview, 'incomingProgress', 'incoming_progress'))} of monthly flow`}
          progress={getOverviewNumber(overview, 'incomingProgress', 'incoming_progress')}
          value={formatMoney(getOverviewNumber(overview, 'monthIncoming', 'month_incoming'))}
          variant="incoming"
        />
        <AccountingMetricCard
          label="Operational Outgo"
          meta={`${formatPercent(getOverviewNumber(overview, 'outgoingProgress', 'outgoing_progress'))} of monthly movement`}
          progress={getOverviewNumber(overview, 'outgoingProgress', 'outgoing_progress')}
          value={formatMoney(getOverviewNumber(overview, 'monthOutgoing', 'month_outgoing'))}
          variant="outgoing"
        />
      </section>

      <section className="accounting-serene-controls" aria-label="Accounting filters">
        <SearchField
          id="ledger-search"
          label="Search ledger"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search ledger..."
          value={searchTerm}
        />
        <Button
          aria-label="Filter report dates"
          className="ui-button--icon accounting-serene-icon-button"
          onClick={() => setIsFilterModalOpen(true)}
          title="Filter report dates"
          variant="secondary"
        >
          <FilterIcon />
        </Button>
        <Button
          aria-label="Download ledger report"
          className="ui-button--icon accounting-serene-icon-button"
          isLoading={isDownloading}
          onClick={() => void generateReport()}
          title="Download ledger report"
          variant="primary"
        >
          <DownloadIcon />
        </Button>
      </section>

      <section className="accounting-serene-ledger" aria-label="Recent transactions">
        <header className="accounting-serene-ledger__header">
          <div>
            <h2>Recent Transactions</h2>
            <p>{total} ledger record{total === 1 ? '' : 's'}</p>
          </div>
          <Badge tone="info">Verified ledger</Badge>
        </header>

        {isLoading ? (
          <LoadingState rows={6} />
        ) : transactions.length === 0 ? (
          <EmptyState
            description={debouncedSearchTerm ? 'No ledger records match this search.' : 'No accounting records have been posted yet.'}
            title={debouncedSearchTerm ? 'No matching transactions' : 'No transactions'}
          />
        ) : (
          <>
            <div className="accounting-serene-table">
              <table>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Entity</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <TransactionRow item={transaction} key={transaction.id} />
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="accounting-serene-pagination">
              <span>Page {currentPage} of {lastPage} - {total} records</span>
              <div>
                <Button disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)} variant="secondary">
                  Previous
                </Button>
                <Button disabled={currentPage >= lastPage} onClick={() => setCurrentPage((page) => page + 1)} variant="secondary">
                  Next
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>

      <Modal
        footer={(
          <>
            <Button onClick={() => setIsFilterModalOpen(false)} variant="secondary">
              Close
            </Button>
            <Button onClick={() => setIsFilterModalOpen(false)} variant="primary">
              Apply Filter
            </Button>
          </>
        )}
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter report dates"
      >
        <div className="accounting-serene-filter-modal">
          <FormField id="ledger-start-date" label="From date">
            <Input id="ledger-start-date" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
          </FormField>
          <FormField id="ledger-end-date" label="To date">
            <Input id="ledger-end-date" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
          </FormField>
        </div>
      </Modal>
      <ConfirmDialog
        confirmLabel="Close Accounting Day"
        isLoading={isClosingDay}
        isOpen={isCloseDialogOpen}
        message={`Close accounting day ${accountingDay?.business_date ?? ''}? Financial amounts for this day will become immutable.`}
        onCancel={() => setIsCloseDialogOpen(false)}
        onConfirm={() => void closeAccountingDay()}
        title="Close accounting day"
      />
    </section>
  )
}

function AccountingDayStatusCard({ accountingDay, canClose, className, onClose }: { accountingDay: AccountingDay | null; canClose: boolean; className: string; onClose: () => void }) {
  const status = accountingDay?.status ?? 'NOT_OPENED'
  const tone = status === 'OPEN' ? 'success' : status === 'CLOSING' ? 'warning' : status === 'CLOSED' ? 'danger' : 'info'

  return <section className={`accounting-day-status-card ${className}`} aria-label="Current accounting day">
    <div className="accounting-day-status-card__details">
      <strong>{accountingDay?.business_date ?? 'Today'}</strong>
      <Badge tone={tone}>{status.replace('_', ' ')}</Badge>
      <p>{accountingDay ? `${accountingDay.timezone}${accountingDay.opened_at ? ` · Opened ${formatAccountingDayTime(accountingDay.opened_at)}` : ''}` : 'The first financial transaction will open today’s accounting day.'}</p>
    </div>
    {canClose && status === 'OPEN' && <Button onClick={onClose} variant="danger">Close Accounting Day</Button>}
  </section>
}

function formatAccountingDayTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function AccountingMetricCard({
  icon,
  label,
  meta,
  progress,
  trend,
  value,
  variant,
}: {
  icon?: ReactNode
  label: string
  meta: string
  progress?: number
  trend?: string
  value: string
  variant: 'primary' | 'incoming' | 'outgoing'
}) {
  return (
    <article className={`accounting-serene-metric accounting-serene-metric--${variant}`}>
      <div className="accounting-serene-metric__top">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{trend ?? meta}</small>
      {progress !== undefined ? (
        <div className="accounting-serene-metric__progress" aria-label={meta}>
          <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      ) : null}
      {progress !== undefined ? <em>{meta}</em> : null}
    </article>
  )
}

function TransactionRow({ item }: { item: AccountingTransaction }) {
  const transactionType = getStringField(item, 'transaction_type', 'transactionType') || 'incoming'
  const isIncoming = transactionType === 'incoming'
  const referenceLabel = getStringField(item, 'reference_label', 'referenceLabel')
  const description = item.description

  return (
    <tr>
      <td data-label="Transaction ID">
        <strong className="accounting-serene-transaction-id">{formatTransactionId(item.id)}</strong>
      </td>
      <td data-label="Entity">
        <div className="accounting-serene-entity">
          <span>{getInitials(description)}</span>
          <div>
            <strong>{description}</strong>
            <small>{referenceLabel || transactionTypeLabel(transactionType as 'incoming' | 'outgoing')}</small>
          </div>
        </div>
      </td>
      <td data-label="Category">
        <span className={`accounting-serene-category accounting-serene-category--${isIncoming ? 'incoming' : 'outgoing'}`}>
          {referenceLabel || (isIncoming ? 'Asset Inflow' : 'Operational Ex')}
        </span>
      </td>
      <td data-label="Amount">
        <strong className={`accounting-serene-amount accounting-serene-amount--${isIncoming ? 'incoming' : 'outgoing'}`}>
          {isIncoming ? '' : '-'}{formatMoney(item.amount)}
        </strong>
      </td>
      <td data-label="Status">
        <span className="accounting-serene-status"><span />Completed</span>
      </td>
      <td data-label="Verification">
        <span className="accounting-serene-verified" title="Verified against ledger">
          <CheckIcon />
        </span>
      </td>
    </tr>
  )
}

function getOverviewNumber(overview: AccountingOverview | null, camelKey: keyof AccountingOverview, snakeKey: keyof AccountingOverview) {
  return Number(overview?.[camelKey] ?? overview?.[snakeKey] ?? 0)
}

function formatTransactionId(id: number) {
  return `#TX-${String(id).padStart(5, '0')}`
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}%`
}

function getInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'TX'
}

