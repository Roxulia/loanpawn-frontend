import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ActiveSlipIcon, ChevronRightIcon, CirclePlusIcon, ContactPageIcon, EditIcon, SecurityIcon } from '../../../components/icons/icon'
import { formatDate, formatMoney } from '../../slips/slipFormat'
import { formatCustomerDeletedState, formatValue, getTrustScore, getTrustTone } from '../customerFormat'
import { customerService, type TenantCustomer, type TenantCustomerActiveSlip, type TenantCustomerLoanMetrics, type TenantCustomerUnpaidDebt } from '../services/customerService'

export function CustomerDetailPage() {
  const navigate = useNavigate()
  const { customerId } = useParams()
  const customerCode = customerId?.trim() ?? ''
  const [customer, setCustomer] = useState<TenantCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCustomer = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await customerService.getCustomer(code)
      setCustomer(response)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load customer.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!customerCode) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadCustomer(customerCode)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [customerCode, loadCustomer])

  if (!customerCode) {
    return <Navigate to={routePaths.customers} replace />
  }

  const metrics = getLoanMetrics(customer)
  const activeSlips = getActiveSlips(customer)
  const unpaidDebts = getUnpaidDebts(customer)
  const trustScore = customer ? getTrustScore(customer) : 0
  const displayTrustScore = customer ? getDisplayTrustScore(customer) : 0

  return (
    <section className="page customer-detail-page">
      {error && <Alert message={error} onDismiss={() => setError(null)} title="Customer lookup failed" tone="danger" />}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : customer ? (
        <>
          <nav className="customer-detail-breadcrumb" aria-label="Customer detail breadcrumb">
            <button onClick={() => navigate(routePaths.customers)} type="button">Customers</button>
            <ChevronRightIcon />
            <span>{customer.name}</span>
          </nav>

          <section className="customer-detail-summary">
            <div className="customer-detail-avatar" aria-hidden="true">
              {getInitials(customer.name)}
              <span>Verified</span>
            </div>
            <div className="customer-detail-summary__content">
              <div>
                <div className="customer-detail-summary__title">
                  <h1>{customer.name}</h1>
                  <Badge tone={getTrustTone(trustScore)}>{customer.code}</Badge>
                </div>
                <p>{customer.note || getCustomerSinceText(customer, metrics)}</p>
              </div>
              <div className="customer-detail-summary__metrics">
                <SummaryMetric label="Trust Score" meta={getTrustLabel(displayTrustScore)} value={`${displayTrustScore}`} />
                <SummaryMetric label="Total Loans" meta={`${getMetric(metrics, 'activeSlips', 'active_slips')} active slips`} value={formatNumber(getMetric(metrics, 'totalSlips', 'total_slips'))} />
                <SummaryMetric label="Active Loan Amount" meta="MMK outstanding" value={formatMoney(getMetric(metrics, 'activeLoanAmount', 'active_loan_amount'))} />
              </div>
            </div>
            <div className="customer-detail-summary__actions">
              <Button leftIcon={<EditIcon />} onClick={() => navigate(routePaths.customerEdit(customerCode))} variant="primary">Edit Customer</Button>
              <Button leftIcon={<CirclePlusIcon />} onClick={() => navigate(routePaths.slipsForCustomer(customer.code))} variant="secondary">New Loan Slip</Button>
              <Button onClick={() => navigate(routePaths.customers)} variant="ghost">Back</Button>
            </div>
          </section>

          <div className="customer-detail-grid">
            <div className="customer-detail-column">
              <DetailPanel icon={<ContactPageIcon />} title="Contact Details">
                <DetailField label="Primary Phone" value={formatValue(customer.phone)} />
                <DetailField label="Email Address" value={formatValue(customer.email)} />
                <DetailField label="NRC" value={formatValue(customer.nrc)} />
                <DetailField label="Residential Address" value={formatValue(customer.address)} />
              </DetailPanel>

              <DetailPanel icon={<SecurityIcon />} title="Account Status">
                <DetailRow label="Status" value={formatCustomerDeletedState(customer)} />
                <DetailRow label="Created By" value={formatValue(customer.createdBy ?? customer.created_by)} />
                <DetailRow label="Latest Activity" value={formatDate(getMetricDate(metrics, 'latestActivityDate', 'latest_activity_date'))} />
                <DetailRow label="Deleted At" value={formatValue(customer.deletedAt ?? customer.deleted_at)} />
              </DetailPanel>
            </div>

            <div className="customer-detail-activity-column">
              <section className="customer-detail-active-slips">
                <header>
                  <div>
                    <ActiveSlipIcon />
                    <h2>Active Pawn Slips</h2>
                  </div>
                  <div>
                    <Badge tone="info">{getMetric(metrics, 'activeSlips', 'active_slips')} Ongoing</Badge>
                    <Badge>{getMetric(metrics, 'completedSlips', 'completed_slips')} Completed</Badge>
                  </div>
                </header>

                {activeSlips.length === 0 ? (
                  <p className="muted">No active pawn slips for this customer.</p>
                ) : (
                  <>
                    <div className="customer-detail-slip-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Slip ID</th>
                            <th>Pawned Item</th>
                            <th>Loan Amount</th>
                            <th>Interest</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSlips.map((slip) => (
                            <tr key={slip.id} onClick={() => navigate(routePaths.slipDetail(getSlipNo(slip)))}>
                              <td><strong>{getSlipNo(slip)}</strong></td>
                              <td>{getSlipItemName(slip)}</td>
                              <td>{formatMoney(getSlipAmount(slip, 'loan'))}</td>
                              <td>{formatInterest(slip)}</td>
                              <td>{formatDate(getSlipDate(slip))}</td>
                              <td><Badge tone={getSlipStatusTone(slip.status)}>{slip.status ?? 'active'}</Badge></td>
                              <td><Button onClick={() => navigate(routePaths.slipDetail(getSlipNo(slip)))} variant="ghost">View</Button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="customer-detail-slip-cards">
                      {activeSlips.map((slip) => (
                        <button className="customer-detail-slip-card" key={slip.id} onClick={() => navigate(routePaths.slipDetail(getSlipNo(slip)))} type="button">
                          <strong>{getSlipNo(slip)}</strong>
                          <span>{getSlipItemName(slip)}</span>
                          <div>
                            <span>{formatMoney(getSlipAmount(slip, 'loan'))}</span>
                            <span>{formatDate(getSlipDate(slip))}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <footer>Showing {activeSlips.length} of {getMetric(metrics, 'activeSlips', 'active_slips')} active loans</footer>
              </section>

              <section className="customer-detail-unpaid-debts">
                <header>
                  <div>
                    <ActiveSlipIcon />
                    <h2>Unpaid Debts</h2>
                  </div>
                  <div>
                    <Badge tone="warning">{unpaidDebts.length} Unpaid</Badge>
                  </div>
                </header>

                {unpaidDebts.length === 0 ? (
                  <p className="muted">No unpaid debts for this customer.</p>
                ) : (
                  <>
                    <div className="customer-detail-debt-table">
                      <table>
                        <thead>
                          <tr>
                            <th>No.</th>
                            <th>Amount</th>
                            <th>Tag</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unpaidDebts.map((debt, index) => (
                            <tr key={debt.id}>
                              <td><strong>{index + 1}</strong></td>
                              <td>{formatMoney(getDebtAmount(debt))}</td>
                              <td>{getDebtTag(debt)}</td>
                              <td>{formatDate(getDebtCreatedAt(debt))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="customer-detail-debt-cards">
                      {unpaidDebts.map((debt, index) => (
                        <div className="customer-detail-debt-card" key={debt.id}>
                          <strong>{index + 1}</strong>
                          <span>{getDebtTag(debt)}</span>
                          <div>
                            <span>{formatMoney(getDebtAmount(debt))}</span>
                            <span>{formatDate(getDebtCreatedAt(debt))}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <footer>Showing {unpaidDebts.length} unpaid debts</footer>
              </section>
            </div>
          </div>

          <section className="customer-detail-stats">
            <StatPanel label="Total Interest Paid" value={formatMoney(getMetric(metrics, 'totalInterestPaid', 'total_interest_paid'))} />
            <StatPanel label="Average Loan Term" value={`${getMetric(metrics, 'averageLoanTermDays', 'average_loan_term_days')} Days`} />
            <StatPanel label="Redemption Rate" value={`${getMetric(metrics, 'redemptionRate', 'redemption_rate')}%`} />
          </section>
        </>
      ) : (
        <Alert message="Customer was not found." title="No customer" tone="warning" />
      )}
    </section>
  )
}

function SummaryMetric({ label, meta, value }: { label: string; meta: string; value: string }) {
  return (
    <div className="customer-detail-summary-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </div>
  )
}

function DetailPanel({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <section className="customer-detail-panel">
      <header>
        {icon}
        <h2>{title}</h2>
      </header>
      <div className="customer-detail-panel__body">{children}</div>
    </section>
  )
}

function DetailField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="customer-detail-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="customer-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StatPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="customer-detail-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <i />
    </div>
  )
}

function getLoanMetrics(customer: TenantCustomer | null) {
  return customer?.loanMetrics ?? customer?.loan_metrics ?? null
}

function getActiveSlips(customer: TenantCustomer | null) {
  return customer?.activeSlips ?? customer?.active_slips ?? []
}

function getUnpaidDebts(customer: TenantCustomer | null) {
  return customer?.unpaidDebts ?? customer?.unpaid_debts ?? []
}

function getMetric(metrics: TenantCustomerLoanMetrics | null, camelKey: keyof TenantCustomerLoanMetrics, snakeKey: keyof TenantCustomerLoanMetrics) {
  return Number(metrics?.[camelKey] ?? metrics?.[snakeKey] ?? 0)
}

function getMetricDate(metrics: TenantCustomerLoanMetrics | null, camelKey: keyof TenantCustomerLoanMetrics, snakeKey: keyof TenantCustomerLoanMetrics) {
  return (metrics?.[camelKey] ?? metrics?.[snakeKey] ?? null) as string | null
}

function getDisplayTrustScore(customer: TenantCustomer) {
  const displayScore = customer.displayTrustScore ?? customer.display_trust_score

  if (displayScore !== undefined) {
    return displayScore
  }

  return Math.min(100, Math.round((getTrustScore(customer) / 255) * 100))
}

function getTrustLabel(score: number) {
  if (score >= 80) {
    return 'Excellent'
  }

  if (score >= 50) {
    return 'Stable'
  }

  return 'Watch'
}

function getCustomerSinceText(customer: TenantCustomer, metrics: TenantCustomerLoanMetrics | null) {
  const date = customer.created_at ?? getMetricDate(metrics, 'firstSlipDate', 'first_slip_date')

  return date ? `Customer since ${formatDate(date)}` : 'Customer profile'
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C'
}

function getSlipNo(slip: TenantCustomerActiveSlip) {
  return slip.slipNo ?? slip.slip_no ?? '-'
}

function getSlipItemName(slip: TenantCustomerActiveSlip) {
  return slip.pawnedItem ?? slip.pawned_item ?? '-'
}

function getSlipAmount(slip: TenantCustomerActiveSlip, field: 'loan') {
  if (field === 'loan') {
    return slip.loanAmount ?? slip.loan_amount ?? 0
  }

  return 0
}

function getSlipDate(slip: TenantCustomerActiveSlip) {
  return slip.expire_at ?? null
}

function formatInterest(slip: TenantCustomerActiveSlip) {
  const rate = slip.interestRate ?? slip.interest_rate ?? 0
  const type = slip.interestTypeName ?? slip.interest_type_name

  return type ? `${rate}% ${type}` : `${rate}%`
}

function getSlipStatusTone(status?: string): 'success' | 'warning' | 'danger' | 'info' {
  const normalized = status?.toLowerCase() ?? ''

  if (normalized === 'active') {
    return 'info'
  }

  if (normalized === 'expired') {
    return 'danger'
  }

  if (normalized === 'redeemed') {
    return 'success'
  }

  return 'warning'
}

function getDebtAmount(debt: TenantCustomerUnpaidDebt) {
  return debt.amount ?? 0
}

function getDebtTag(debt: TenantCustomerUnpaidDebt) {
  return debt.tag || '-'
}

function getDebtCreatedAt(debt: TenantCustomerUnpaidDebt) {
  return debt.createdAt ?? debt.created_at ?? null
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
