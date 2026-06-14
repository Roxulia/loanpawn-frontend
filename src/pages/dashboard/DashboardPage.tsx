import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../../components/atoms'
import { Alert, LoadingState } from '../../components/feedback'
import { Card, SectionHeader, StatCard } from '../../components/molecules'
import { DataTable, type DataTableColumn } from '../../components/organisms'
import type {
  DashboardCustomerLoanUsage,
  DashboardExpenseTypeTotal,
  DashboardNearlyExpiredSlip,
  DashboardRecentExpense,
  DashboardTrustedCustomer,
  TenantDashboardSummary,
} from '../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../services/tenant/tenantResourceService'
import { formatDate, formatMoney } from '../../modules/finance/financeFormat'

const nearlyExpiredColumns: Array<DataTableColumn<DashboardNearlyExpiredSlip>> = [
  {
    header: 'Slip',
    key: 'slipNo',
    render: (item) => <strong>{item.slipNo}</strong>,
  },
  {
    header: 'Customer',
    key: 'customerName',
    render: (item) => item.customerName,
  },
  {
    header: 'Loan amount',
    key: 'loanAmount',
    render: (item) => formatMoney(item.loanAmount),
  },
  {
    header: 'Expires',
    key: 'expireDate',
    render: (item) => formatDate(item.expireDate),
  },
  {
    header: 'Remaining',
    key: 'daysRemaining',
    render: (item) => <Badge tone={item.daysRemaining <= 2 ? 'danger' : 'warning'}>{`${item.daysRemaining} days`}</Badge>,
  },
]

const customerUsageColumns: Array<DataTableColumn<DashboardCustomerLoanUsage>> = [
  {
    header: 'Customer',
    key: 'customer',
    render: (item) => <strong>{item.name}</strong>,
  },
  {
    header: 'Active principal',
    key: 'activeLoanAmount',
    render: (item) => formatMoney(item.activeLoanAmount),
  },
  {
    header: 'Total loaned',
    key: 'totalLoanAmount',
    render: (item) => formatMoney(item.totalLoanAmount),
  },
  {
    header: 'Slips',
    key: 'slipCount',
    render: (item) => item.slipCount,
  },
  {
    header: 'Last loan',
    key: 'lastLoanDate',
    render: (item) => formatDate(item.lastLoanDate),
  },
]

const recentExpenseColumns: Array<DataTableColumn<DashboardRecentExpense>> = [
  {
    header: 'Description',
    key: 'description',
    render: (item) => <strong>{item.description}</strong>,
  },
  {
    header: 'Amount',
    key: 'amount',
    render: (item) => formatMoney(item.amount),
  },
  {
    header: 'Type',
    key: 'expenseTypeName',
    render: (item) => item.expenseTypeName || '-',
  },
  {
    header: 'Created',
    key: 'createdAt',
    render: (item) => formatDate(item.createdAt),
  },
]

export function DashboardPage() {
  const [summary, setSummary] = useState<TenantDashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    setIsLoading(true)
    setError(null)

    tenantResourceService.getDashboardSummary()
      .then((response) => {
        if (isMounted) {
          setSummary(response)
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard summary.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const financialTone = useMemo(() => {
    if (!summary) {
      return 'info'
    }

    return summary.financial.netToday >= 0 ? 'success' : 'danger'
  }, [summary])

  if (isLoading) {
    return (
      <section className="page dashboard-page">
        <SectionHeader title="Dashboard" subtitle="Financial, collateral, customer, and expense overview." />
        <LoadingState rows={8} />
      </section>
    )
  }

  return (
    <section className="page dashboard-page">
      <SectionHeader
        title="Dashboard"
        subtitle="Financial, collateral, customer, and expense overview."
        action={summary ? <Badge tone={financialTone}>{summary.financial.netToday >= 0 ? 'Net positive today' : 'Net negative today'}</Badge> : null}
      />

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Dashboard failed to load" tone="danger" />}

      {summary && (
        <>
          <div className="dashboard-page__stats">
            <StatCard label="Today income" value={formatMoney(summary.financial.todayIncome)} trend="Incoming accounting entries" />
            <StatCard label="Today expenses" value={formatMoney(summary.financial.todayExpense)} trend="Outgoing accounting entries" />
            <StatCard label="Net today" value={formatMoney(summary.financial.netToday)} trend="Income minus expenses" />
            <StatCard label="Active principal" value={formatMoney(summary.financial.activeLoanPrincipal)} trend="Open loan exposure" />
          </div>

          <div className="dashboard-page__overview">
            <Card title="Collateral Exposure" description="Current collateral counts and value.">
              <div className="dashboard-page__metric-grid">
                <DashboardMetric label="Estimated value" value={formatMoney(summary.collateral.estimatedValue)} />
                <DashboardMetric label="Total items" value={summary.collateral.totalItems} />
                <DashboardMetric label="Jewellery" value={summary.collateral.jewelleryItems} />
                <DashboardMetric label="Normal items" value={summary.collateral.normalItems} />
                <DashboardMetric label="Active" value={summary.collateral.activeItems} />
                <DashboardMetric label="Redeemed" value={summary.collateral.redeemedItems} />
                <DashboardMetric label="Confiscated" value={summary.collateral.confiscatedItems} />
              </div>
            </Card>

            <Card title="Loan Health" description="Slip status and unpaid debt.">
              <div className="dashboard-page__metric-grid">
                <DashboardMetric label="Active slips" value={summary.loans.activeSlips} />
                <DashboardMetric label="Expired slips" value={summary.loans.expiredSlips} />
                <DashboardMetric label="Redeemed slips" value={summary.loans.redeemedSlips} />
                <DashboardMetric label="Outstanding debt" value={formatMoney(summary.financial.outstandingDebt)} />
                <DashboardMetric label="Customers" value={summary.customers.totalCustomers} />
                <DashboardMetric label="Month expenses" value={formatMoney(summary.expenses.monthTotal)} />
              </div>
            </Card>
          </div>

          <div className="dashboard-page__tables">
            <Card
              title="Nearly Expired Slips"
              description="Active slips expiring within the next 7 days."
              action={<Badge tone="warning">{summary.loans.nearlyExpiredSlips.length} slips</Badge>}
            >
              <DataTable
                columns={nearlyExpiredColumns}
                emptyDescription="No active slips are expiring in the next 7 days."
                emptyTitle="No nearly expired slips"
                getItemId={(item) => item.slipNo}
                getItemTitle={(item) => item.slipNo}
                items={summary.loans.nearlyExpiredSlips}
              />
            </Card>

            <Card
              title="Customer Loan Usage"
              description="Customers ranked by current and historical loan usage."
              action={<Badge tone="info">{summary.customers.totalCustomers} customers</Badge>}
            >
              <DataTable
                columns={customerUsageColumns}
                emptyDescription="No customer loan usage is available yet."
                emptyTitle="No loan usage"
                getItemId={(item) => item.code}
                getItemTitle={(item) => item.name}
                items={summary.customers.topLoanUsage}
              />
            </Card>
          </div>

          <div className="dashboard-page__overview">
            <Card
              title="Trusted Customers"
              description="Highest trust score customers."
              action={<Badge tone="success">{summary.customers.trustedCustomers.length} trusted</Badge>}
            >
              <TrustedCustomerList items={summary.customers.trustedCustomers} />
            </Card>

            <Card
              title="Expense Breakdown"
              description="Current month expenses by type."
              action={<Badge tone="warning">Today {formatMoney(summary.expenses.todayTotal)}</Badge>}
            >
              <ExpenseTypeList items={summary.expenses.byType} />
            </Card>
          </div>

          <Card title="Recent Expenses" description="Latest shop expenses recorded.">
            <DataTable
              columns={recentExpenseColumns}
              emptyDescription="No expenses have been recorded yet."
              emptyTitle="No recent expenses"
              getItemId={(item) => item.code}
              getItemTitle={(item) => item.description}
              items={summary.expenses.recent}
            />
          </Card>
        </>
      )}
    </section>
  )
}

function DashboardMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="dashboard-page__metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function TrustedCustomerList({ items }: { items: DashboardTrustedCustomer[] }) {
  if (items.length === 0) {
    return <p className="muted">No trusted customers found.</p>
  }

  return (
    <div className="dashboard-page__list">
      {items.map((item) => (
        <div className="dashboard-page__list-row" key={item.code}>
          <div>
            <strong>{item.name}</strong>
            <span>{formatMoney(item.activeLoanAmount)} active principal</span>
          </div>
          <Badge tone="success">{`Trust ${item.trustScore ?? 0}`}</Badge>
        </div>
      ))}
    </div>
  )
}

function ExpenseTypeList({ items }: { items: DashboardExpenseTypeTotal[] }) {
  if (items.length === 0) {
    return <p className="muted">No expenses found for this month.</p>
  }

  return (
    <div className="dashboard-page__list">
      {items.map((item) => (
        <div className="dashboard-page__list-row" key={item.name}>
          <strong>{item.name}</strong>
          <span>{formatMoney(item.total)}</span>
        </div>
      ))}
    </div>
  )
}
