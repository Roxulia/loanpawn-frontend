import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Button } from '../../../components/atoms'
import { Alert, EmptyState, LoadingState } from '../../../components/feedback'
import { CirclePlusIcon, EditIcon, TrashIcon } from '../../../components/icons/icon'
import { SearchField } from '../../../components/molecules'
import { ConfirmDialog } from '../../../components/organisms'
import { usePermissions } from '../../auth'
import {
  customerService,
  type TenantCustomer,
  type TenantCustomerLastActivity,
  type TenantCustomerListPage,
  type TenantCustomerListSummary,
} from '../services/customerService'
import { getTrustScore } from '../customerFormat'

const perPage = 10

export function CustomerListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission } = usePermissions()
  const canList = hasPermission('list_customer')
  const canCreate = hasPermission('create_customer')
  const canUpdate = hasPermission('update_customer')
  const canDelete = hasPermission('delete_customer')
  const canUseRowActions = canUpdate || canDelete
  const [customers, setCustomers] = useState<TenantCustomer[]>([])
  const [summary, setSummary] = useState<TenantCustomerListSummary | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(() => getRouteNotice(location.state))
  const [customerToDelete, setCustomerToDelete] = useState<TenantCustomer | null>(null)

  const loadCustomers = useCallback(async (page: number, search = debouncedSearchTerm) => {
    if (!canList) {
      setCustomers([])
      setSummary(null)
      setCurrentPage(1)
      setLastPage(1)
      setTotal(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const pageData = await customerService.listCustomers({ page, perPage, search })

      setCustomers(pageData.items)
      setSummary(pageData.summary ?? null)
      setCurrentPage(getPageValue(pageData, 'currentPage', 'current_page', 1))
      setLastPage(getPageValue(pageData, 'lastPage', 'last_page', 1))
      setTotal(pageData.total)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load customers.')
    } finally {
      setIsLoading(false)
    }
  }, [canList, debouncedSearchTerm])

  useEffect(() => {
    if (getRouteNotice(location.state)) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  useEffect(() => {
    const searchTimer = window.setTimeout(() => {
      setCurrentPage(1)
      setDebouncedSearchTerm(searchTerm.trim())
    }, 300)

    return () => window.clearTimeout(searchTimer)
  }, [searchTerm])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadCustomers(currentPage, debouncedSearchTerm)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [currentPage, debouncedSearchTerm, loadCustomers])

  const pageNumbers = useMemo(() => getVisiblePageNumbers(currentPage, lastPage), [currentPage, lastPage])
  const showingFrom = total === 0 ? 0 : ((currentPage - 1) * perPage) + 1
  const showingTo = Math.min(currentPage * perPage, total)

  async function handleDelete() {
    if (!customerToDelete) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await customerService.deleteCustomer(customerToDelete.code)
      setNotice('Customer deleted successfully.')
      setCustomerToDelete(null)

      const nextPage = customers.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      setCurrentPage(nextPage)
      await loadCustomers(nextPage)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete customer.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="page customer-serene-page">
      <header className="customer-serene-page__header">
        <div>
          <span className="eyebrow">Customers / Registry</span>
          <h1>Customers</h1>
          <p>Search, review, and maintain trusted customer records for pawn operations.</p>
        </div>
        {canCreate ? (
          <Button
            className="customer-serene-page__desktop-create"
            leftIcon={<CirclePlusIcon />}
            onClick={() => navigate(routePaths.customerCreate)}
            variant="primary"
          >
            Add Customer
          </Button>
        ) : null}
      </header>

      <div className="customer-serene-page__stats">
        <CustomerMetricCard
          accent="teal"
          label="Total Clients"
          meta="Customer registry"
          value={formatNumber(getSummaryValue(summary, 'totalClients', 'total_clients', total))}
        />
        <CustomerMetricCard
          accent="blue"
          label="Avg. Trust Score"
          meta="High Quality"
          value={formatDecimal(getSummaryValue(summary, 'averageTrustScore', 'average_trust_score', 0))}
        />
        <CustomerMetricCard
          accent="teal"
          label="Active Pawn Loans"
          meta="Active"
          value={formatNumber(getSummaryValue(summary, 'activePawnLoans', 'active_pawn_loans', 0))}
        />
        <CustomerMetricCard
          accent="red"
          label="Risk Flagged"
          meta="Review Required"
          value={formatNumber(getSummaryValue(summary, 'riskFlagged', 'risk_flagged', 0))}
        />
      </div>

      {canCreate ? (
        <div className="customer-serene-page__create">
          <Button leftIcon={<CirclePlusIcon />} onClick={() => navigate(routePaths.customerCreate)} variant="primary">
            Add Customer
          </Button>
        </div>
      ) : null}

      <section className="customer-serene-table" aria-label="Customer records">
        <div className="customer-serene-table__toolbar">
          <div>
            <h2>Customer records</h2>
            <p>{formatNumber(total)} total customer{total === 1 ? '' : 's'}</p>
          </div>
          <div className="customer-serene-table__controls">
            {canList ? (
              <SearchField
                id="customer-search"
                label="Search customers"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Name, phone, email, or address"
                value={searchTerm}
              />
            ) : null}
            {canList ? (
              <button
                aria-label="Refresh customer records"
                className="customer-serene-refresh"
                onClick={() => void loadCustomers(currentPage)}
                title="Refresh"
                type="button"
              >
                <RefreshIcon />
              </button>
            ) : null}
            {canList ? (
              <Button className="customer-serene-refresh-text" onClick={() => void loadCustomers(currentPage)} variant="secondary">
                Refresh
              </Button>
            ) : null}
          </div>
        </div>

        <div className="customer-serene-table__body">
          {error && <Alert message={error} onDismiss={() => setError(null)} title="Customer action failed" tone="danger" />}
          {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Customer updated" tone="success" />}

          {isLoading ? (
            <LoadingState rows={5} />
          ) : customers.length === 0 ? (
            <EmptyState
              action={canCreate ? (
                <Button leftIcon={<CirclePlusIcon />} onClick={() => navigate(routePaths.customerCreate)} variant="primary">
                  Add Customer
                </Button>
              ) : null}
              description={canList ? (debouncedSearchTerm ? 'No customers match this search.' : 'Create the first customer record.') : 'Your account can create customers, but cannot view customer records.'}
              title={canList ? (searchTerm ? 'No matching customers' : 'No customers yet') : 'Customer records hidden'}
            />
          ) : (
            <>
              <div className="customer-serene-table__scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact Info</th>
                      <th>Trust Score</th>
                      <th>Primary Location</th>
                      <th>Last Activity</th>
                      {canUseRowActions && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={canList ? () => navigate(routePaths.customerDetail(customer.code)) : undefined}
                      >
                        <td>
                          <div className="customer-serene-person">
                            <span className="customer-serene-person__avatar">{getInitials(customer.name)}</span>
                            <span>
                              <strong>{customer.name}</strong>
                              <small>{customer.code}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="customer-serene-stack">
                            <span>{formatValue(customer.email)}</span>
                            <small>{formatValue(customer.phone)}</small>
                          </div>
                        </td>
                        <td>
                          <TrustScoreCell customer={customer} />
                        </td>
                        <td>
                          <span className="customer-serene-location">
                            <LocationPinIcon />
                            {getCustomerValue(customer, 'primaryLocation', 'primary_location', customer.address ?? '-')}
                          </span>
                        </td>
                        <td>
                          <LastActivityCell activity={getLastActivity(customer)} />
                        </td>
                        {canUseRowActions && (
                          <td onClick={(event) => event.stopPropagation()}>
                            <div className="row-actions">
                              {canUpdate && (
                                <Button
                                  aria-label={`Edit ${customer.name}`}
                                  className="ui-button--icon"
                                  onClick={() => navigate(routePaths.customerEdit(customer.code))}
                                  title="Edit customer"
                                  variant="secondary"
                                >
                                  <EditIcon />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  aria-label={`Delete ${customer.name}`}
                                  className="ui-button--icon"
                                  onClick={() => setCustomerToDelete(customer)}
                                  title="Delete customer"
                                  variant="danger"
                                >
                                  <TrashIcon />
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="customer-serene-card-list">
                {customers.map((customer) => (
                  <CustomerRecordCard
                    canDelete={canDelete}
                    canUpdate={canUpdate}
                    customer={customer}
                    key={customer.id}
                    onDelete={() => setCustomerToDelete(customer)}
                    onEdit={() => navigate(routePaths.customerEdit(customer.code))}
                    onView={() => navigate(routePaths.customerDetail(customer.code))}
                  />
                ))}
              </div>

              <footer className="customer-serene-pagination">
                <span>Showing {showingFrom}-{showingTo} of {formatNumber(total)} customers</span>
                <div className="customer-serene-pagination__controls">
                  <Button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    variant="secondary"
                  >
                    Previous
                  </Button>
                  {pageNumbers.map((page) => (
                    <button
                      aria-current={page === currentPage ? 'page' : undefined}
                      className="customer-serene-pagination__page"
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      type="button"
                    >
                      {page}
                    </button>
                  ))}
                  <Button
                    disabled={currentPage >= lastPage}
                    onClick={() => setCurrentPage((page) => Math.min(lastPage, page + 1))}
                    variant="secondary"
                  >
                    Next
                  </Button>
                </div>
              </footer>
            </>
          )}
        </div>
      </section>

      <ConfirmDialog
        confirmLabel="Delete Customer"
        isLoading={isDeleting}
        isOpen={Boolean(customerToDelete)}
        message={`Delete ${customerToDelete?.name ?? 'this customer'}? This action cannot be undone.`}
        onCancel={() => setCustomerToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Confirm customer deletion"
      />
    </section>
  )
}

function CustomerRecordCard({
  canDelete,
  canUpdate,
  customer,
  onDelete,
  onEdit,
  onView,
}: {
  canDelete: boolean
  canUpdate: boolean
  customer: TenantCustomer
  onDelete: () => void
  onEdit: () => void
  onView: () => void
}) {
  const activity = getLastActivity(customer)
  const displayScore = getCustomerNumber(customer, 'displayTrustScore', 'display_trust_score', normalizeTrustScore(getTrustScore(customer)))
  const scoreOutOfTen = displayScore / 10
  const isDue = getStatusTone(activity.tone) === 'danger'

  return (
    <article className="customer-record-card">
      <header className="customer-record-card__header">
        <div className="customer-record-card__identity">
          <span className="customer-record-card__avatar">{getInitials(customer.name)}</span>
          <span>
            <strong>{customer.name}</strong>
            <small>#{customer.code}</small>
          </span>
        </div>
        <span className={`customer-record-card__status customer-record-card__status--${isDue ? 'due' : 'active'}`}>
          {isDue ? 'DUE' : 'ACTIVE'}
        </span>
      </header>

      <div className="customer-record-card__trust">
        <div>
          <span>Trust Score</span>
          <strong>{formatTrustOutOfTen(scoreOutOfTen)}</strong>
        </div>
        <div
          className={[
            'customer-record-card__progress',
            displayScore < 50 ? 'customer-record-card__progress--danger' : '',
          ].filter(Boolean).join(' ')}
          aria-hidden="true"
        >
          <span style={{ width: `${displayScore}%` }} />
        </div>
      </div>

      <div className="customer-record-card__meta">
        <span className="customer-record-card__activity">
          <ClockIcon />
          {formatRelativeActivity(activity.date)}
        </span>
        <div className="customer-record-card__actions">
          {canUpdate ? (
            <button aria-label={`Edit ${customer.name}`} onClick={onEdit} title="Edit customer" type="button">
              <EditIcon />
            </button>
          ) : null}
          {canDelete ? (
            <button aria-label={`Delete ${customer.name}`} onClick={onDelete} title="Delete customer" type="button">
              <TrashIcon />
            </button>
          ) : null}
          <button className="customer-record-card__details" onClick={onView} type="button">
            View Details
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </article>
  )
}

function CustomerMetricCard({
  accent,
  label,
  meta,
  value,
}: {
  accent: 'teal' | 'blue' | 'red'
  label: string
  meta: string
  value: string
}) {
  return (
    <article className={`customer-serene-metric customer-serene-metric--${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </article>
  )
}

function TrustScoreCell({ customer }: { customer: TenantCustomer }) {
  const score = getCustomerNumber(customer, 'displayTrustScore', 'display_trust_score', normalizeTrustScore(getTrustScore(customer)))
  const tone = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'

  return (
    <div className="customer-serene-trust">
      <span>{score}</span>
      <div className="customer-serene-trust__track" aria-hidden="true">
        <span className={`customer-serene-trust__bar customer-serene-trust__bar--${tone}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function LastActivityCell({ activity }: { activity: TenantCustomerLastActivity }) {
  return (
    <div className="customer-serene-activity">
      <span>{formatDate(activity.date)}</span>
      <strong className={`customer-serene-status customer-serene-status--${getStatusTone(activity.tone)}`}>{activity.status}</strong>
      <small>{activity.label}</small>
    </div>
  )
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" className="customer-serene-refresh__icon" viewBox="0 0 24 24">
      <path d="M20 6v5h-5" />
      <path d="M4 18v-5h5" />
      <path d="M18.2 9A7 7 0 0 0 6.3 6.8L4 9" />
      <path d="M5.8 15A7 7 0 0 0 17.7 17.2L20 15" />
    </svg>
  )
}

function LocationPinIcon() {
  return (
    <svg aria-hidden="true" className="customer-serene-location__icon" viewBox="0 0 24 24">
      <path d="M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12Z" />
      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="customer-record-card__meta-icon" viewBox="0 0 24 24">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" className="customer-record-card__chevron" viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function getRouteNotice(state: unknown) {
  if (typeof state === 'object' && state !== null && 'notice' in state && typeof state.notice === 'string') {
    return state.notice
  }

  return null
}

function getPageValue(
  pageData: TenantCustomerListPage,
  camelKey: 'currentPage' | 'lastPage',
  snakeKey: 'current_page' | 'last_page',
  fallback: number,
) {
  return pageData[camelKey] ?? pageData[snakeKey] ?? fallback
}

function getSummaryValue(
  summary: TenantCustomerListSummary | null,
  camelKey: keyof TenantCustomerListSummary,
  snakeKey: keyof TenantCustomerListSummary,
  fallback: number,
) {
  return Number(summary?.[camelKey] ?? summary?.[snakeKey] ?? fallback)
}

function getCustomerValue(
  customer: TenantCustomer,
  camelKey: keyof TenantCustomer,
  snakeKey: keyof TenantCustomer,
  fallback: string,
) {
  const value = customer[camelKey] ?? customer[snakeKey]

  return typeof value === 'string' && value.trim() !== '' ? value : fallback
}

function getCustomerNumber(
  customer: TenantCustomer,
  camelKey: keyof TenantCustomer,
  snakeKey: keyof TenantCustomer,
  fallback: number,
) {
  const value = customer[camelKey] ?? customer[snakeKey]

  return typeof value === 'number' ? value : fallback
}

function getLastActivity(customer: TenantCustomer): TenantCustomerLastActivity {
  return customer.lastActivity ?? customer.last_activity ?? {
    date: null,
    status: 'NO ACTIVITY',
    label: 'No pawn activity recorded',
    tone: 'neutral',
  }
}

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'CU'
}

function normalizeTrustScore(score: number) {
  return Math.max(0, Math.min(100, Math.round((score / 255) * 100)))
}

function getStatusTone(tone: string) {
  if (tone === 'success' || tone === 'danger' || tone === 'warning' || tone === 'info') {
    return tone
  }

  return 'neutral'
}

function getVisiblePageNumbers(currentPage: number, lastPage: number) {
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(lastPage, currentPage + 2)
  const pages: number[] = []

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value)
}

function formatTrustOutOfTen(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value)
}

function formatValue(value?: string | number | null) {
  return value === undefined || value === null || value === '' ? '-' : value
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatRelativeActivity(value?: string | null) {
  if (!value) {
    return 'No activity'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const diffMs = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.round(diffMs / minute))
    return `${minutes} min ago`
  }

  if (diffMs < day) {
    const hours = Math.round(diffMs / hour)
    return `${hours} hr${hours === 1 ? '' : 's'} ago`
  }

  if (diffMs < day * 2) {
    return 'Yesterday'
  }

  const days = Math.round(diffMs / day)

  if (days < 30) {
    return `${days} days ago`
  }

  return formatDate(value)
}
