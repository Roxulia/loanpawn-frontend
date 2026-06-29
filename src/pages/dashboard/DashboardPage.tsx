import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Button, Input, Select } from '../../components/atoms'
import { Alert, EmptyState, LoadingState } from '../../components/feedback'
import { FormField } from '../../components/molecules'
import { DataTable, Modal, type DataTableColumn } from '../../components/organisms'
import type {
  DashboardCollateralCategory,
  DashboardCollateralReviewItem,
  DashboardFinancialChartPoint,
  DashboardLoanAttention,
  DashboardTimeFilter,
  TenantDashboardSummary,
} from '../../dataobjects/tenant/finance'
import { formatDate, formatMoney } from '../../modules/finance/financeFormat'
import { settingsService, type DefaultTypeOption } from '../../modules/settings/services/settingsService'
import { tenantResourceService } from '../../services/tenant/tenantResourceService'

type MaterialPriceMap = Record<string, string>

type AdjustedCollateralItem = DashboardCollateralReviewItem & {
  currentMarketValue: number
  displayLtvRatio: number
}

const today = new Date().toISOString().slice(0, 10)
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

const loanAttentionColumns: Array<DataTableColumn<DashboardLoanAttention>> = [
  {
    header: 'Customer Name',
    key: 'customerName',
    render: (item) => <strong>{item.customerName}</strong>,
  },
  {
    header: 'Loan Code',
    key: 'loanCode',
    render: (item) => item.loanCode,
  },
  {
    header: 'Due Date',
    key: 'dueDate',
    render: (item) => formatDate(item.dueDate),
  },
  {
    header: 'Loan Amount',
    key: 'loanAmount',
    render: (item) => `${formatMoney(item.loanAmount)} MMK`,
  },
  {
    header: 'Overdue Days',
    key: 'overdueDays',
    render: (item) => item.overdueDays === 0 ? '-' : `${item.overdueDays} days`,
  },
  {
    header: 'Risk Level',
    key: 'riskLevel',
    render: (item) => <RiskBadge riskLevel={item.riskLevel} />,
  },
]

const collateralColumns: Array<DataTableColumn<AdjustedCollateralItem>> = [
  {
    header: 'Item Name',
    key: 'itemName',
    render: (item) => <strong>{item.itemName}</strong>,
  },
  {
    header: 'Category',
    key: 'category',
    render: (item) => item.category,
  },
  {
    header: 'Estimated Market Value',
    key: 'estimatedMarketValue',
    render: (item) => `${formatMoney(item.currentMarketValue)} MMK`,
  },
  {
    header: 'Loan Amount',
    key: 'loanAmount',
    render: (item) => `${formatMoney(item.loanAmount)} MMK`,
  },
  {
    header: 'LTV Ratio',
    key: 'ltvRatio',
    render: (item) => formatPercent(item.displayLtvRatio),
  },
  {
    header: 'Status',
    key: 'status',
    render: (item) => <CollateralStatusBadge status={item.status} />,
  },
]

export function DashboardPage() {
  const [summary, setSummary] = useState<TenantDashboardSummary | null>(null)
  const [materialTypes, setMaterialTypes] = useState<DefaultTypeOption[]>([])
  const [materialPrices, setMaterialPrices] = useState<MaterialPriceMap>({})
  const [timeFilter, setTimeFilter] = useState<DashboardTimeFilter>('this_month')
  const [startDate, setStartDate] = useState(monthStart)
  const [endDate, setEndDate] = useState(today)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      const response = await tenantResourceService.getDashboardSummary({
        endDate: timeFilter === 'custom' ? endDate : undefined,
        startDate: timeFilter === 'custom' ? startDate : undefined,
        timeFilter,
      })

      setSummary(response)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard summary.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [endDate, startDate, timeFilter])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    let isMounted = true

    settingsService.listMaterialTypes()
      .then((response) => {
        if (isMounted) {
          setMaterialTypes(response ?? [])
        }
      })
      .catch(() => {
        if (isMounted) {
          setMaterialTypes([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const adjustedCollateral = useMemo(
    () => adjustCollateralItems(summary?.collateral.items ?? [], materialPrices),
    [materialPrices, summary],
  )
  const adjustedCollateralSummary = useMemo(
    () => summarizeAdjustedCollateral(adjustedCollateral),
    [adjustedCollateral],
  )
  const reviewItems = useMemo(
    () => adjustedCollateral
      .filter((item) => item.status === 'Expired' || item.status === 'Low Margin')
      .sort((first, second) => second.displayLtvRatio - first.displayLtvRatio)
      .slice(0, 8),
    [adjustedCollateral],
  )

  if (isLoading) {
    return (
      <section className="page dashboard-situation-page">
        <DashboardHeader
          endDate={endDate}
          isRefreshing={false}
          onEndDateChange={setEndDate}
          onRefresh={() => undefined}
          onStartDateChange={setStartDate}
          onTimeFilterChange={setTimeFilter}
          startDate={startDate}
          timeFilter={timeFilter}
        />
        <LoadingState rows={10} />
      </section>
    )
  }

  return (
    <section className="page dashboard-situation-page">
      <DashboardHeader
        endDate={endDate}
        isRefreshing={isRefreshing}
        onEndDateChange={setEndDate}
        onRefresh={() => void loadDashboard(true)}
        onStartDateChange={setStartDate}
        onTimeFilterChange={setTimeFilter}
        startDate={startDate}
        timeFilter={timeFilter}
      />

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Dashboard failed to load" tone="danger" />}

      {summary ? (
        <>
          <section className="dashboard-situation-kpis" aria-label="Shop situation summary">
            <SituationKpiCard
              label="Cash Available"
              tone="primary"
              trend="Live ledger balance"
              value={`${formatMoney(summary.financial.cashAvailable)} MMK`}
            />
            <SituationKpiCard
              label="Active Loan Amount"
              tone="info"
              trend={`${summary.financial.activeLoanCount} active pawn contracts`}
              value={`${formatMoney(summary.financial.activeLoanAmount)} MMK`}
            />
            <SituationKpiCard
              label="Interest Collected"
              tone="success"
              trend={trendText(summary.financial.interestCollected, summary.financial.previousInterestCollected, 'monthly comparison')}
              value={`${formatMoney(summary.financial.interestCollected)} MMK`}
            />
            <SituationKpiCard
              label="Net Profit"
              tone={summary.financial.netProfit >= 0 ? 'success' : 'danger'}
              trend={summary.financial.netProfit >= 0 ? 'Positive period result' : 'Negative period result'}
              value={`${formatMoney(summary.financial.netProfit)} MMK`}
            />
          </section>

          <DashboardSection
            description="Loan amount, returned amount, interest, expenses, and available cash for the selected period."
            title="Financial Situation"
          >
            <div className="dashboard-financial-grid">
              <div className="dashboard-metric-grid">
                <DashboardMetric label="Cash Available" value={`${formatMoney(summary.financial.cashAvailable)} MMK`} />
                <DashboardMetric label="Active Loan Amount" value={`${formatMoney(summary.financial.activeLoanAmount)} MMK`} />
                <DashboardMetric label="Interest Collected" value={`${formatMoney(summary.financial.interestCollected)} MMK`} />
                <DashboardMetric label="Total Income" value={`${formatMoney(summary.financial.totalIncome)} MMK`} />
                <DashboardMetric label="Total Expenses" tone="warning" value={`${formatMoney(summary.financial.totalExpenses)} MMK`} />
                <DashboardMetric label="Net Profit" tone={summary.financial.netProfit >= 0 ? 'success' : 'danger'} value={`${formatMoney(summary.financial.netProfit)} MMK`} />
              </div>
              <div className="dashboard-chart-card">
                <div className="dashboard-chart-card__header">
                  <div>
                    <h3>Financial Movement</h3>
                    <p>Loans, returns, interest, and expenses over time.</p>
                  </div>
                  <Badge tone="info">{summary.filters.startDate} to {summary.filters.endDate}</Badge>
                </div>
                <LineChart points={summary.financial.chart} />
                <p className="dashboard-summary-message">{financialSummary(summary)}</p>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection
            description="Loans and customers that need owner attention."
            title="Risk Situation"
          >
            <div className="dashboard-risk-cards">
              <DashboardMetric label="Due Today" tone="warning" value={`${summary.risk.dueToday} loans`} />
              <DashboardMetric label="Due This Week" tone="warning" value={`${summary.risk.dueThisWeek} loans`} />
              <DashboardMetric label="Overdue Loans" tone="danger" value={`${summary.risk.overdueLoans} loans`} />
              <DashboardMetric label="Overdue Amount" tone="danger" value={`${formatMoney(summary.risk.overdueAmount)} MMK`} />
              <DashboardMetric label="High-Risk Customers" tone="danger" value={summary.risk.highRiskCustomers} />
              <DashboardMetric label="Bad Repayment History Count" tone="warning" value={summary.risk.badRepaymentHistoryCount} />
            </div>
            <div className="dashboard-table-card">
              <TableHeader count={summary.risk.loansRequiringAttention.length} title="Loans Requiring Attention" />
              <DataTable
                actions={() => (
                  <div className="dashboard-table-actions">
                    <Button variant="secondary">View Detail</Button>
                    <Button variant="ghost">Contact Customer</Button>
                  </div>
                )}
                columns={loanAttentionColumns}
                emptyDescription="No due or overdue loans need attention for this period."
                emptyTitle="No loans requiring attention"
                getItemId={(item) => item.loanCode}
                getItemTitle={(item) => item.loanCode}
                items={summary.risk.loansRequiringAttention}
              />
            </div>
          </DashboardSection>

          <DashboardSection
            action={<Button onClick={() => setIsPriceModalOpen(true)} variant="secondary">Material Prices</Button>}
            description="Collateral values, LTV, and items that need review."
            title="Collateral Situation"
          >
            <div className="dashboard-collateral-cards">
              <DashboardMetric label="Total Collateral Value" value={`${formatMoney(adjustedCollateralSummary.totalValue)} MMK`} />
              <DashboardMetric label="Average Loan-to-Value Ratio" tone={adjustedCollateralSummary.averageLtv >= 85 ? 'danger' : 'success'} value={formatPercent(adjustedCollateralSummary.averageLtv)} />
              <DashboardMetric label="Gold / Jewelry Value" value={`${formatMoney(adjustedCollateralSummary.jewelleryValue)} MMK`} />
              <DashboardMetric label="Expired Collateral Count" tone="danger" value={adjustedCollateralSummary.expiredCount} />
              <DashboardMetric label="Low-Margin Collateral Items" tone="warning" value={adjustedCollateralSummary.lowMarginCount} />
            </div>
            <div className="dashboard-collateral-layout">
              <div className="dashboard-chart-card">
                <div className="dashboard-chart-card__header">
                  <div>
                    <h3>Collateral Categories</h3>
                    <p>Jewelry by material, normal items as Other.</p>
                  </div>
                </div>
                <DonutChart categories={adjustedCollateralSummary.categories} />
              </div>
              <div className="dashboard-table-card">
                <TableHeader count={reviewItems.length} title="Collateral Items Needing Review" />
                <DataTable
                  actions={() => <Button variant="secondary">View Detail</Button>}
                  columns={collateralColumns}
                  emptyDescription="No expired or low-margin collateral items need review."
                  emptyTitle="No collateral needing review"
                  getItemId={(item) => item.code}
                  getItemTitle={(item) => item.itemName}
                  items={reviewItems}
                />
              </div>
            </div>
          </DashboardSection>

          <MaterialPriceModal
            isOpen={isPriceModalOpen}
            materialPrices={materialPrices}
            materialTypes={materialTypes}
            onChange={setMaterialPrices}
            onClose={() => setIsPriceModalOpen(false)}
          />
        </>
      ) : (
        <EmptyState description="Dashboard data is not available yet." title="No dashboard data" />
      )}
    </section>
  )
}

function DashboardHeader({
  endDate,
  isRefreshing,
  onEndDateChange,
  onRefresh,
  onStartDateChange,
  onTimeFilterChange,
  startDate,
  timeFilter,
}: {
  endDate: string
  isRefreshing: boolean
  onEndDateChange: (value: string) => void
  onRefresh: () => void
  onStartDateChange: (value: string) => void
  onTimeFilterChange: (value: DashboardTimeFilter) => void
  startDate: string
  timeFilter: DashboardTimeFilter
}) {
  return (
    <header className="dashboard-situation-header">
      <div>
        <span className="eyebrow">LonePawn</span>
        <h1>Shop Situation Dashboard</h1>
        <p>Financial, risk, and collateral overview</p>
      </div>
      <div className="dashboard-situation-controls">
        <Select
          aria-label="Date range"
          id="dashboard-date-range"
          onChange={(event) => onTimeFilterChange(event.target.value as DashboardTimeFilter)}
          value={timeFilter}
        >
          <option value="this_day">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="custom">Custom</option>
        </Select>
        {timeFilter === 'custom' && (
          <>
            <Input aria-label="Start date" onChange={(event) => onStartDateChange(event.target.value)} type="date" value={startDate} />
            <Input aria-label="End date" onChange={(event) => onEndDateChange(event.target.value)} type="date" value={endDate} />
          </>
        )}
        <Button isLoading={isRefreshing} onClick={onRefresh} variant="primary">Refresh</Button>
      </div>
    </header>
  )
}

function DashboardSection({ action, children, description, title }: { action?: ReactNode; children: ReactNode; description: string; title: string }) {
  return (
    <section className="dashboard-situation-section">
      <header className="dashboard-section-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

function SituationKpiCard({ label, tone, trend, value }: { label: string; tone: 'primary' | 'info' | 'success' | 'danger'; trend: string; value: string }) {
  return (
    <article className={`dashboard-kpi-card dashboard-kpi-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </article>
  )
}

function DashboardMetric({ label, tone = 'default', value }: { label: string; tone?: 'default' | 'success' | 'warning' | 'danger'; value: number | string }) {
  return (
    <article className={`dashboard-metric dashboard-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function TableHeader({ count, title }: { count: number; title: string }) {
  return (
    <header className="dashboard-table-card__header">
      <h3>{title}</h3>
      <Badge tone={count > 0 ? 'warning' : 'success'}>{count} items</Badge>
    </header>
  )
}

function RiskBadge({ riskLevel }: { riskLevel: DashboardLoanAttention['riskLevel'] }) {
  const tone = riskLevel === 'High' ? 'danger' : riskLevel === 'Medium' ? 'warning' : 'success'

  return <Badge tone={tone}>{riskLevel}</Badge>
}

function CollateralStatusBadge({ status }: { status: AdjustedCollateralItem['status'] }) {
  const tone = status === 'Expired' ? 'danger' : status === 'Low Margin' ? 'warning' : 'success'

  return <Badge tone={tone}>{status}</Badge>
}

function LineChart({ points }: { points: DashboardFinancialChartPoint[] }) {
  if (points.length === 0) {
    return <EmptyState description="No financial movement is available for this period." title="No chart data" />
  }

  const width = 720
  const height = 240
  const padding = 28
  const maxValue = Math.max(...points.flatMap((point) => [point.loanAmount, point.returnedAmount, point.interest, point.expenses]), 1)
  const series = [
    { color: '#00677f', key: 'loanAmount' as const, label: 'Loan Amount' },
    { color: '#0ea5e9', key: 'returnedAmount' as const, label: 'Returned Amount' },
    { color: '#10b981', key: 'interest' as const, label: 'Interest' },
    { color: '#ef4444', key: 'expenses' as const, label: 'Expense' },
  ]

  function coordinate(index: number, value: number) {
    const x = padding + (points.length === 1 ? 0 : (index / (points.length - 1)) * (width - padding * 2))
    const y = height - padding - (value / maxValue) * (height - padding * 2)

    return `${x},${y}`
  }

  return (
    <div className="dashboard-line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Financial movement line chart">
        <line className="dashboard-chart-axis" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        <line className="dashboard-chart-axis" x1={padding} x2={padding} y1={padding} y2={height - padding} />
        {series.map((item) => (
          <polyline
            fill="none"
            key={item.key}
            points={points.map((point, index) => coordinate(index, point[item.key])).join(' ')}
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        ))}
      </svg>
      <div className="dashboard-chart-legend">
        {series.map((item) => (
          <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ categories }: { categories: DashboardCollateralCategory[] }) {
  const validCategories = categories.filter((category) => category.value > 0)
  const total = validCategories.reduce((sum, category) => sum + category.value, 0)
  const colors = ['#00677f', '#0ea5e9', '#10b981', '#f59e0b', '#1f5161', '#64748b']
  let offset = 25

  if (total <= 0) {
    return <EmptyState description="No collateral value is available yet." title="No collateral categories" />
  }

  return (
    <div className="dashboard-donut">
      <svg viewBox="0 0 42 42" role="img" aria-label="Collateral category donut chart">
        <circle className="dashboard-donut__track" cx="21" cy="21" fill="transparent" r="15.915" strokeWidth="5" />
        {validCategories.map((category, index) => {
          const percent = (category.value / total) * 100
          const segment = (
            <circle
              cx="21"
              cy="21"
              fill="transparent"
              key={category.category}
              r="15.915"
              stroke={colors[index % colors.length]}
              strokeDasharray={`${percent} ${100 - percent}`}
              strokeDashoffset={offset}
              strokeWidth="5"
            />
          )

          offset -= percent

          return segment
        })}
      </svg>
      <div className="dashboard-donut__legend">
        {validCategories.map((category, index) => (
          <div key={category.category}>
            <span><i style={{ background: colors[index % colors.length] }} />{category.category}</span>
            <strong>{formatMoney(category.value)} MMK</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function MaterialPriceModal({
  isOpen,
  materialPrices,
  materialTypes,
  onChange,
  onClose,
}: {
  isOpen: boolean
  materialPrices: MaterialPriceMap
  materialTypes: DefaultTypeOption[]
  onChange: (prices: MaterialPriceMap) => void
  onClose: () => void
}) {
  function updatePrice(materialId: number, value: string) {
    onChange({
      ...materialPrices,
      [String(materialId)]: value,
    })
  }

  return (
    <Modal
      footer={(
        <>
          <Button onClick={() => onChange({})} variant="secondary">Clear Prices</Button>
          <Button onClick={onClose} variant="primary">Apply</Button>
        </>
      )}
      isOpen={isOpen}
      onClose={onClose}
      title="Material Prices"
    >
      <div className="dashboard-material-price-modal">
        <p>Enter current market price in MMK per kyat. Values are used only for this dashboard session.</p>
        {materialTypes.length === 0 ? (
          <EmptyState description="Material list is not available." title="No materials" />
        ) : materialTypes.map((material) => (
          <FormField helperText="MMK per kyat" id={`material-price-${material.id}`} key={material.id} label={material.name}>
            <Input
              id={`material-price-${material.id}`}
              min="0"
              onChange={(event) => updatePrice(material.id, event.target.value)}
              placeholder="0"
              type="number"
              value={materialPrices[String(material.id)] ?? ''}
            />
          </FormField>
        ))}
      </div>
    </Modal>
  )
}

function adjustCollateralItems(items: DashboardCollateralReviewItem[], materialPrices: MaterialPriceMap): AdjustedCollateralItem[] {
  return items.map((item) => {
    const materialPrice = item.materialTypeId === null ? 0 : Number(materialPrices[String(item.materialTypeId)] ?? 0)
    const jewelleryWeight = item.kyat + (item.pal / 16) + (item.yway / 128)
    const currentMarketValue = item.isJewellery && materialPrice > 0 && jewelleryWeight > 0
      ? jewelleryWeight * materialPrice
      : item.estimatedMarketValue
    const displayLtvRatio = currentMarketValue <= 0 ? 0 : (item.loanAmount / currentMarketValue) * 100
    const status = item.status === 'Expired' ? item.status : displayLtvRatio >= 85 ? 'Low Margin' : 'Safe'

    return {
      ...item,
      currentMarketValue,
      displayLtvRatio,
      status,
    }
  })
}

function summarizeAdjustedCollateral(items: AdjustedCollateralItem[]) {
  const validValueItems = items.filter((item) => item.currentMarketValue > 0)
  const totalValue = items.reduce((sum, item) => sum + item.currentMarketValue, 0)
  const jewelleryValue = items.filter((item) => item.isJewellery).reduce((sum, item) => sum + item.currentMarketValue, 0)
  const loanTotal = validValueItems.reduce((sum, item) => sum + item.loanAmount, 0)
  const valueTotal = validValueItems.reduce((sum, item) => sum + item.currentMarketValue, 0)
  const categoryMap = new Map<string, DashboardCollateralCategory>()

  items.forEach((item) => {
    const current = categoryMap.get(item.category) ?? { category: item.category, count: 0, value: 0 }

    current.count += 1
    current.value += item.currentMarketValue
    categoryMap.set(item.category, current)
  })

  return {
    averageLtv: valueTotal <= 0 ? 0 : (loanTotal / valueTotal) * 100,
    categories: Array.from(categoryMap.values()).sort((first, second) => second.value - first.value),
    expiredCount: items.filter((item) => item.status === 'Expired').length,
    jewelleryValue,
    lowMarginCount: items.filter((item) => item.status === 'Low Margin').length,
    totalValue,
  }
}

function financialSummary(summary: TenantDashboardSummary) {
  const interestImproved = summary.financial.interestCollected >= summary.financial.previousInterestCollected
  const loanLabel = `${summary.financial.activeLoanCount} active pawn contracts`

  return interestImproved
    ? `Your interest income is higher than last period, with ${loanLabel} currently open.`
    : `Your interest income is lower than last period, with ${loanLabel} currently open.`
}

function trendText(current: number, previous: number, suffix: string) {
  const difference = current - previous
  const sign = difference >= 0 ? '+' : '-'

  return `${sign}${formatMoney(Math.abs(difference))} MMK ${suffix}`
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`
}
