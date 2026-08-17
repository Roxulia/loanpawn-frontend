import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Button, Input, Select } from '../../components/atoms'
import { Alert, EmptyState, LoadingState } from '../../components/feedback'
import { FormField } from '../../components/molecules'
import { DataTable, Modal, type DataTableColumn } from '../../components/organisms'
import type {
  DashboardCurrency,
  DashboardCurrencyAmount,
  DashboardCollateralCategory,
  DashboardCollateralReviewItem,
  DashboardFinancialChartPoint,
  DashboardLoanAttention,
  DashboardTimeFilter,
  TenantDashboardSummary,
} from '../../dataobjects/tenant/finance'
import { formatCurrencyAmount, formatDate } from '../../modules/finance/financeFormat'
import { useTenantCurrencies } from '../../modules/finance/useTenantCurrencies'
import { settingsService, type DefaultTypeOption } from '../../modules/settings/services/settingsService'
import { tenantResourceService } from '../../services/tenant/tenantResourceService'
import { useTenantSession } from '../../contexts/useTenantSession'

type DashboardAmountFormatter = (value: string | number | null | undefined) => string
type SourceAmountFormatter = (value: string | number | null | undefined, currency: DashboardCurrency) => string

type MaterialPriceMap = Record<string, string>

type AdjustedCollateralItem = DashboardCollateralReviewItem & {
  currentMarketValue: number
  displayLtvRatio: number
}

type DashboardCurrencyRatio = {
  currency: DashboardCurrency
  ratio: number
}

const today = new Date().toISOString().slice(0, 10)
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

function makeLoanAttentionColumns(formatAmount: SourceAmountFormatter): Array<DataTableColumn<DashboardLoanAttention>> { return [
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
    render: (item) => formatAmount(item.loanAmount, item.currency),
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
] }

function makeCollateralColumns(formatAmount: SourceAmountFormatter): Array<DataTableColumn<AdjustedCollateralItem>> { return [
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
    render: (item) => formatAmount(item.currentMarketValue, item.currency),
  },
  {
    header: 'Loan Amount',
    key: 'loanAmount',
    render: (item) => formatAmount(item.loanAmount, item.currency),
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
] }

export function DashboardPage() {
  const { defaultFinancialUnit, effectiveReportingCurrencySymbol, reportingCurrencyRecalculation } = useTenantCurrencies()
  const { locale } = useTenantSession()
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
    const timeoutId = window.setTimeout(() => void loadDashboard(), 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadDashboard])

  useEffect(() => {
    let isMounted = true

    settingsService.listMaterialTypeOptions()
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
  const formatReportingAmount = useCallback(
    (value: string | number | null | undefined) => formatCurrencyAmount(value, effectiveReportingCurrencySymbol, defaultFinancialUnit, locale),
    [defaultFinancialUnit, effectiveReportingCurrencySymbol, locale],
  )
  const formatSourceAmount = useCallback(
    (value: string | number | null | undefined, currency: DashboardCurrency) => formatPlainCurrencyAmount(value, currency, locale),
    [locale],
  )
  const loanAttentionColumns = useMemo(() => makeLoanAttentionColumns(formatSourceAmount), [formatSourceAmount])
  const collateralColumns = useMemo(() => makeCollateralColumns(formatSourceAmount), [formatSourceAmount])

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
      {reportingCurrencyRecalculation && (
        <Alert
          message={`Reporting currency recalculation is ${reportingCurrencyRecalculation.status.replaceAll('_', ' ')}. Totals remain in ${effectiveReportingCurrencySymbol || 'the previous reporting currency'}.`}
          title="Reporting currency update pending"
          tone="warning"
        />
      )}

      {summary ? (
        <>
          <section className="dashboard-situation-kpis" aria-label="Shop situation summary">
            <SituationKpiCard
              label="Cash Available"
              tone="primary"
              trend="Live ledger balance"
              value={formatReportingAmount(summary.financial.cashAvailable)}
            />
            <SituationKpiCard
              label="Active Loan Amount"
              tone="info"
              trend={`${summary.financial.activeLoanCount} active pawn contracts`}
              value={<CurrencyAmountList amounts={summary.financial.activeLoanAmounts} formatAmount={formatSourceAmount} />}
            />
            <SituationKpiCard
              label="Interest Collected"
              tone="success"
              trend={trendText(summary.financial.interestCollected, summary.financial.previousInterestCollected, 'monthly comparison', formatReportingAmount)}
              value={formatReportingAmount(summary.financial.interestCollected)}
            />
            <SituationKpiCard
              label="Net Profit"
              tone={summary.financial.netProfit >= 0 ? 'success' : 'danger'}
              trend={summary.financial.netProfit >= 0 ? 'Positive period result' : 'Negative period result'}
              value={formatReportingAmount(summary.financial.netProfit)}
            />
          </section>

          <DashboardSection
            description="Loan amount, returned amount, interest, expenses, and available cash for the selected period."
            title="Financial Situation"
          >
            <div className="dashboard-financial-grid">
              <div className="dashboard-metric-grid">
                <DashboardMetric label="Cash Available" value={formatReportingAmount(summary.financial.cashAvailable)} />
                <DashboardMetric label="Active Loan Amount" value={<CurrencyAmountList amounts={summary.financial.activeLoanAmounts} formatAmount={formatSourceAmount} />} />
                <DashboardMetric label="Interest Collected" value={formatReportingAmount(summary.financial.interestCollected)} />
                <DashboardMetric label="Total Income" value={formatReportingAmount(summary.financial.totalIncome)} />
                <DashboardMetric label="Total Expenses" tone="warning" value={formatReportingAmount(summary.financial.totalExpenses)} />
                <DashboardMetric label="Net Profit" tone={summary.financial.netProfit >= 0 ? 'success' : 'danger'} value={formatReportingAmount(summary.financial.netProfit)} />
              </div>
              <div className="dashboard-chart-card">
                <div className="dashboard-chart-card__header">
                  <div>
                    <h3>Financial Movement</h3>
                    <p>Loans, returns, interest, and expenses over time.</p>
                  </div>
                  <Badge tone="info">{formatDate(summary.filters.start_at)} to {formatDate(summary.filters.end_at)}</Badge>
                </div>
                <LineChart formatSourceAmount={formatSourceAmount} points={summary.financial.chart} />
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
              <DashboardMetric label="Overdue Amount" tone="danger" value={<CurrencyAmountList amounts={summary.risk.overdueAmounts} formatAmount={formatSourceAmount} />} />
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
              <DashboardMetric label="Total Collateral Value" value={<CurrencyAmountList amounts={adjustedCollateralSummary.totalValues} formatAmount={formatSourceAmount} />} />
              <DashboardMetric label="Loan-to-Value Ratio" value={<CurrencyRatioList ratios={adjustedCollateralSummary.ltvByCurrency} />} />
              <DashboardMetric label="Gold / Jewelry Value" value={<CurrencyAmountList amounts={adjustedCollateralSummary.jewelleryValues} formatAmount={formatSourceAmount} />} />
              <DashboardMetric label="Expired Collateral Count" tone="danger" value={adjustedCollateralSummary.expiredCount} />
              <DashboardMetric label="Low-Margin Collateral Items" tone="warning" value={adjustedCollateralSummary.lowMarginCount} />
            </div>
            <div className="dashboard-collateral-layout">
              <div className="dashboard-chart-card">
                <div className="dashboard-chart-card__header">
                  <div>
                    <h3>Collateral Categories</h3>
                    <p>Jewelry by material, normal items by category.</p>
                  </div>
                </div>
                <DonutChart categories={adjustedCollateralSummary.categories} formatAmount={formatSourceAmount} />
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
            collateralItems={summary.collateral.items}
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

function SituationKpiCard({ label, tone, trend, value }: { label: string; tone: 'primary' | 'info' | 'success' | 'danger'; trend: string; value: ReactNode }) {
  return (
    <article className={`dashboard-kpi-card dashboard-kpi-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </article>
  )
}

function DashboardMetric({ label, tone = 'default', value }: { label: string; tone?: 'default' | 'success' | 'warning' | 'danger'; value: ReactNode }) {
  return (
    <article className={`dashboard-metric dashboard-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function CurrencyAmountList({ amounts, formatAmount }: { amounts: DashboardCurrencyAmount[]; formatAmount: SourceAmountFormatter }) {
  if (amounts.length === 0) {
    return <>-</>
  }

  return <span className="dashboard-currency-values">{amounts.map((item) => (
    <span key={currencyKey(item.currency)}>{formatAmount(item.amount, item.currency)}</span>
  ))}</span>
}

function CurrencyRatioList({ ratios }: { ratios: DashboardCurrencyRatio[] }) {
  if (ratios.length === 0) {
    return <>-</>
  }

  return <span className="dashboard-currency-values">{ratios.map((item) => (
    <span key={currencyKey(item.currency)}>{item.currency.code || 'Unknown'} · {formatPercent(item.ratio)}</span>
  ))}</span>
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

function LineChart({ formatSourceAmount, points }: { formatSourceAmount: SourceAmountFormatter; points: DashboardFinancialChartPoint[] }) {
  if (points.length === 0) {
    return <EmptyState description="No financial movement is available for this period." title="No chart data" />
  }

  const width = 720
  const height = 240
  const padding = 28
  const maxValue = Math.max(...points.flatMap((point) => [point.debt, point.returnedAmount, point.interest, point.expenses]), 1)
  const series = [
    { color: '#00677f', key: 'debt' as const, label: 'Debt (reporting)' },
    { color: '#0ea5e9', key: 'returnedAmount' as const, label: 'Returned Amount' },
    { color: '#10b981', key: 'interest' as const, label: 'Interest' },
    { color: '#ef4444', key: 'expenses' as const, label: 'Expense' },
  ]
  const loanTotals = summarizeCurrencyAmounts(points.flatMap((point) => point.loanAmounts))

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
      <div className="dashboard-chart-source-totals">
        <span>Loan principal by source currency</span>
        <CurrencyAmountList amounts={loanTotals} formatAmount={formatSourceAmount} />
      </div>
    </div>
  )
}

function DonutChart({ categories, formatAmount }: { categories: DashboardCollateralCategory[]; formatAmount: SourceAmountFormatter }) {
  const validCategories = categories.filter((category) => category.value > 0)

  if (validCategories.length === 0) {
    return <EmptyState description="No collateral value is available yet." title="No collateral categories" />
  }

  const groups = validCategories.reduce((map, category) => {
    const key = currencyKey(category.currency)
    map.set(key, [...(map.get(key) ?? []), category])
    return map
  }, new Map<string, DashboardCollateralCategory[]>())

  return <div className="dashboard-donut-groups">{Array.from(groups.values()).map((group) => (
    <CurrencyDonut categories={group} formatAmount={formatAmount} key={currencyKey(group[0].currency)} />
  ))}</div>
}

function CurrencyDonut({ categories, formatAmount }: { categories: DashboardCollateralCategory[]; formatAmount: SourceAmountFormatter }) {
  const total = categories.reduce((sum, category) => sum + category.value, 0)
  const currency = categories[0].currency
  const colors = ['#00677f', '#0ea5e9', '#10b981', '#f59e0b', '#1f5161', '#64748b']

  return <div className="dashboard-donut">
      <strong className="dashboard-donut__currency">{currency.code || 'Unknown currency'}</strong>
      <svg viewBox="0 0 42 42" role="img" aria-label="Collateral category donut chart">
        <circle className="dashboard-donut__track" cx="21" cy="21" fill="transparent" r="15.915" strokeWidth="5" />
        {categories.map((category, index) => {
          const percent = (category.value / total) * 100
          const offset = 25 - categories.slice(0, index).reduce((sum, previous) => sum + ((previous.value / total) * 100), 0)

          return <circle
              cx="21"
              cy="21"
              fill="transparent"
              key={`${category.category}-${currencyKey(category.currency)}`}
              r="15.915"
              stroke={colors[index % colors.length]}
              strokeDasharray={`${percent} ${100 - percent}`}
              strokeDashoffset={offset}
              strokeWidth="5"
            />
        })}
      </svg>
      <div className="dashboard-donut__legend">
        {categories.map((category, index) => (
          <div key={`${category.category}-${currencyKey(category.currency)}`}>
            <span><i style={{ background: colors[index % colors.length] }} />{category.category}</span>
            <strong>{formatAmount(category.value, category.currency)}</strong>
          </div>
        ))}
      </div>
    </div>
}

function MaterialPriceModal({
  collateralItems,
  isOpen,
  materialPrices,
  materialTypes,
  onChange,
  onClose,
}: {
  collateralItems: DashboardCollateralReviewItem[]
  isOpen: boolean
  materialPrices: MaterialPriceMap
  materialTypes: DefaultTypeOption[]
  onChange: (prices: MaterialPriceMap) => void
  onClose: () => void
}) {
  const priceFields = Array.from(new Map(collateralItems
    .filter((item) => item.isJewellery && item.materialTypeId !== null)
    .map((item) => {
      const material = materialTypes.find((option) => option.id === item.materialTypeId)
        ?? { id: item.materialTypeId as number, name: item.materialTypeName ?? 'Material' }

      return [materialPriceKey(material.id, item.currency), { currency: item.currency, material }] as const
    })).values())

  function updatePrice(materialId: number, currency: DashboardCurrency, value: string) {
    onChange({
      ...materialPrices,
      [materialPriceKey(materialId, currency)]: value,
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
        <p>Enter a price per kyat for each source currency. Values are used only for this dashboard session.</p>
        {priceFields.length === 0 ? (
          <EmptyState description="No jewellery collateral with a source currency is available." title="No material prices needed" />
        ) : priceFields.map(({ currency, material }) => (
          <FormField helperText={`${currency.code || 'Unknown currency'} per kyat`} id={`material-price-${material.id}-${currencyKey(currency)}`} key={`${material.id}-${currencyKey(currency)}`} label={`${material.name} · ${currency.code || 'Unknown'}`}>
            <Input
              id={`material-price-${material.id}-${currencyKey(currency)}`}
              min="0"
              onChange={(event) => updatePrice(material.id, currency, event.target.value)}
              placeholder="0"
              type="number"
              value={materialPrices[materialPriceKey(material.id, currency)] ?? ''}
            />
          </FormField>
        ))}
      </div>
    </Modal>
  )
}

function adjustCollateralItems(items: DashboardCollateralReviewItem[], materialPrices: MaterialPriceMap): AdjustedCollateralItem[] {
  return items.map((item) => {
    const materialPrice = item.materialTypeId === null ? 0 : Number(materialPrices[materialPriceKey(item.materialTypeId, item.currency)] ?? 0)
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
  const totalValues = summarizeCurrencyAmounts(items.map((item) => ({ amount: item.currentMarketValue, currency: item.currency })))
  const jewelleryValues = summarizeCurrencyAmounts(items.filter((item) => item.isJewellery).map((item) => ({ amount: item.currentMarketValue, currency: item.currency })))
  const categoryMap = new Map<string, DashboardCollateralCategory>()
  const ltvMap = new Map<string, { currency: DashboardCurrency; loanTotal: number; valueTotal: number }>()

  items.forEach((item) => {
    const key = `${item.category}:${currencyKey(item.currency)}`
    const current = categoryMap.get(key) ?? { category: item.category, count: 0, value: 0, currency: item.currency }

    current.count += 1
    current.value += item.currentMarketValue
    categoryMap.set(key, current)

    if (item.currentMarketValue > 0) {
      const currencyLtv = ltvMap.get(currencyKey(item.currency)) ?? { currency: item.currency, loanTotal: 0, valueTotal: 0 }
      currencyLtv.loanTotal += item.loanAmount
      currencyLtv.valueTotal += item.currentMarketValue
      ltvMap.set(currencyKey(item.currency), currencyLtv)
    }
  })

  return {
    ltvByCurrency: Array.from(ltvMap.values()).map((item) => ({ currency: item.currency, ratio: (item.loanTotal / item.valueTotal) * 100 })),
    categories: Array.from(categoryMap.values()).sort((first, second) => second.value - first.value),
    expiredCount: items.filter((item) => item.status === 'Expired').length,
    jewelleryValues,
    lowMarginCount: items.filter((item) => item.status === 'Low Margin').length,
    totalValues,
  }
}

function summarizeCurrencyAmounts(amounts: DashboardCurrencyAmount[]) {
  const totals = new Map<string, DashboardCurrencyAmount>()

  amounts.forEach((item) => {
    const key = currencyKey(item.currency)
    const current = totals.get(key) ?? { amount: 0, currency: item.currency }
    current.amount += item.amount
    totals.set(key, current)
  })

  return Array.from(totals.values())
}

function currencyKey(currency: DashboardCurrency) {
  return currency.id === null ? `unknown:${currency.code}` : String(currency.id)
}

function materialPriceKey(materialId: number, currency: DashboardCurrency) {
  return `${materialId}:${currencyKey(currency)}`
}

function formatPlainCurrencyAmount(value: string | number | null | undefined, currency: DashboardCurrency, locale?: string) {
  const amount = Number(value ?? 0)

  if (!Number.isFinite(amount)) {
    return '-'
  }

  const formatted = amount.toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: 0 })
  const label = currency.symbol || currency.code

  return label ? `${formatted} ${label}` : formatted
}

function financialSummary(summary: TenantDashboardSummary) {
  const interestImproved = summary.financial.interestCollected >= summary.financial.previousInterestCollected
  const loanLabel = `${summary.financial.activeLoanCount} active pawn contracts`

  return interestImproved
    ? `Your interest income is higher than last period, with ${loanLabel} currently open.`
    : `Your interest income is lower than last period, with ${loanLabel} currently open.`
}

function trendText(current: number, previous: number, suffix: string, formatAmount: DashboardAmountFormatter) {
  const difference = current - previous
  const sign = difference >= 0 ? '+' : '-'

  return `${sign}${formatAmount(Math.abs(difference))} ${suffix}`
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`
}
