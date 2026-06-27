import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Button, Input } from '../../../components/atoms'
import { Alert, EmptyState, LoadingState } from '../../../components/feedback'
import { FormField, SearchField } from '../../../components/molecules'
import type { AccountingOverview, AccountingTransaction } from '../../../dataobjects/tenant/finance'
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
  const [overview, setOverview] = useState<AccountingOverview | null>(null)
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
  const [error, setError] = useState<string | null>(null)

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
      const [overviewResponse, transactionResponse] = await Promise.all([
        tenantResourceService.getAccountingOverview(),
        tenantResourceService.listAccounting({ page, perPage, search }),
      ])

      setOverview(overviewResponse)
      setTransactions(transactionResponse.items)
      setCurrentPage(transactionResponse.current_page ?? page)
      setLastPage(transactionResponse.last_page ?? 1)
      setTotal(transactionResponse.total)
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

  const fiscalLabel = useMemo(() => getFiscalQuarterLabel(new Date()), [])

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

  return (
    <section className="page accounting-page accounting-serene-page">
      <header className="accounting-serene-header">
        <div>
          <span className="eyebrow">Finance / Ledger</span>
          <h1>Accounting Ledger</h1>
          <p>Monitor capital movement, verify ledger activity, and export date-range accounting reports.</p>
        </div>
        <div className="accounting-serene-header__actions">
          <span className="accounting-serene-refresh-indicator">Auto-refreshing: 5mins</span>
          <Button isLoading={isDownloading} onClick={() => void generateReport()} variant="primary">
            Generate Report
          </Button>
        </div>
      </header>

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Accounting action failed" tone="danger" />}

      <section className="accounting-serene-controls" aria-label="Accounting filters">
        <SearchField
          id="ledger-search"
          label="Search ledger"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search ledger..."
          value={searchTerm}
        />
        <div className="accounting-serene-period-field">
          <label>&nbsp;</label>
          <div className="accounting-serene-period">{fiscalLabel}</div>
        </div>
        <FormField id="ledger-start-date" label="Start date">
          <Input id="ledger-start-date" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
        </FormField>
        <FormField id="ledger-end-date" label="End date">
          <Input id="ledger-end-date" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
        </FormField>
      </section>

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
    </section>
  )
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
      <td>
        <strong className="accounting-serene-transaction-id">{formatTransactionId(item.id)}</strong>
      </td>
      <td>
        <div className="accounting-serene-entity">
          <span>{getInitials(description)}</span>
          <div>
            <strong>{description}</strong>
            <small>{referenceLabel || transactionTypeLabel(transactionType as 'incoming' | 'outgoing')}</small>
          </div>
        </div>
      </td>
      <td>
        <span className={`accounting-serene-category accounting-serene-category--${isIncoming ? 'incoming' : 'outgoing'}`}>
          {referenceLabel || (isIncoming ? 'Asset Inflow' : 'Operational Ex')}
        </span>
      </td>
      <td>
        <strong className={`accounting-serene-amount accounting-serene-amount--${isIncoming ? 'incoming' : 'outgoing'}`}>
          {isIncoming ? '' : '-'}{formatMoney(item.amount)}
        </strong>
      </td>
      <td>
        <span className="accounting-serene-status"><span />Completed</span>
      </td>
      <td>
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

function getFiscalQuarterLabel(date: Date) {
  const quarter = Math.floor(date.getMonth() / 3) + 1

  return `FY ${date.getFullYear()} - Q${quarter}`
}

function VaultIcon() {
  return (
    <svg aria-hidden="true" className="accounting-serene-icon" viewBox="0 0 24 24">
      <path d="M4 7h16v13H4V7Z" />
      <path d="M7 7V4h10v3" />
      <path d="M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M12 10v6" />
      <path d="M9 13h6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="accounting-serene-check" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}
