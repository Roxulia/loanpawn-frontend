import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Input } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { Card, FormGroup, SectionHeader } from '../../../components/molecules'
import { DataTable } from '../../../components/organisms'
import { usePermissions } from '../../auth'
import { ExchangePairSearchField } from '../components/CurrencyFields'
import { currencyService } from '../currencyService'
import type { ExchangeRateEntry, ExchangeRatePair, ExchangeRateState, ExchangeRateTrend, ExchangeRateTrendPoint } from '../types'

export function DailyRateAssignmentPage() {
  const { hasPermission } = usePermissions()
  const [pairs, setPairs] = useState<ExchangeRatePair[]>([])
  const [rates, setRates] = useState<ExchangeRateEntry[]>([])
  const [selectedPair, setSelectedPair] = useState('')
  const [rateForm, setRateForm] = useState({ buying_rate: '', selling_rate: '' })
  const [rateState, setRateState] = useState<ExchangeRateState | null>(null)
  const [rateTrend, setRateTrend] = useState<ExchangeRateTrend | null>(null)
  const [rateTab, setRateTab] = useState<'observations' | 'trends'>('observations')
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const loadPairs = async () => {
      setLoading(true); setError(null)
      try { setPairs((await currencyService.listPairs()).items ?? []) }
      catch (reason) { setError(messageOf(reason)) }
      finally { setLoading(false) }
    }
    void loadPairs()
  }, [])

  const loadSelectedPair = useCallback(async () => {
    if (!selectedPair) { setRates([]); setRateState(null); setRateTrend(null); return }
    setLoading(true)
    try {
      const [page, state, trend] = await Promise.all([currencyService.listRates(selectedPair), currencyService.getRateState(selectedPair), currencyService.getRateTrend(selectedPair, trendDays)])
      setRates(page.items ?? []); setRateState(state); setRateTrend(trend)
    } catch (reason) { setError(messageOf(reason)) } finally { setLoading(false) }
  }, [selectedPair, trendDays])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadSelectedPair() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadSelectedPair])

  async function saveRate() {
    if (!selectedPair || !rateForm.buying_rate || !rateForm.selling_rate) { setError('Choose a pair and enter buying and selling prices.'); return }
    setSaving(true); setError(null)
    try { await currencyService.createRate({ pair_code: selectedPair, ...rateForm }); setRateForm({ buying_rate: '', selling_rate: '' }); setNotice(rateState?.opening_required ? 'Opening prices recorded.' : 'Exchange prices recorded.'); await loadSelectedPair() }
    catch (reason) { setError(messageOf(reason)) } finally { setSaving(false) }
  }

  async function correctRate(entry: ExchangeRateEntry) {
    const buyingRate = window.prompt(`Replacement buying price for ${entry.pair.display_code}`, entry.buying_rate); if (!buyingRate) return
    const sellingRate = window.prompt(`Replacement selling price for ${entry.pair.display_code}`, entry.selling_rate); if (!sellingRate) return
    const reason = window.prompt('Correction reason'); if (!reason) return
    try { await currencyService.correctRate(entry.code, { buying_rate: buyingRate, selling_rate: sellingRate, reason }); setNotice('Rate corrected with audit history.'); await loadSelectedPair() }
    catch (updateError) { setError(messageOf(updateError)) }
  }

  async function voidRate(entry: ExchangeRateEntry) {
    const reason = window.prompt('Reason for voiding this rate'); if (!reason) return
    try { await currencyService.voidRate(entry.code, { reason }); setNotice('Rate voided.'); await loadSelectedPair() }
    catch (updateError) { setError(messageOf(updateError)) }
  }

  return <section className="page daily-rate-assignment-page">
    <SectionHeader title="Daily Rate Assignment" subtitle="Assign buying and selling prices and review daily observations and trends." />
    {error && <Alert message={error} onDismiss={() => setError(null)} title="Exchange-rate action failed" tone="danger" />}
    {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Exchange rates updated" tone="success" />}
    <Card title="Exchange Prices" description="Record buying and selling prices for the selected pair.">
      <div className="exchange-rate-pair-selector"><ExchangePairSearchField id="rate-pair" pairs={pairs} value={selectedPair} onChange={setSelectedPair} /></div>
      {selectedPair && hasPermission('create_exchange_rate') && <div className="subform-panel exchange-rate-entry-form">
        <header className="subform-panel__header"><strong>{rateState?.opening_required ? "Set today's opening prices" : 'Update current prices'}</strong>{rateState && <Badge tone="info">{rateState.business_date} · {rateState.timezone}</Badge>}</header>
        <FormGroup columns={2}><FormPriceField id="buying-rate" label="Buying price" value={rateForm.buying_rate} onChange={(buying_rate) => setRateForm((current) => ({ ...current, buying_rate }))} /><FormPriceField id="selling-rate" label="Selling price" value={rateForm.selling_rate} onChange={(selling_rate) => setRateForm((current) => ({ ...current, selling_rate }))} /></FormGroup>
        <Button isLoading={saving} onClick={() => void saveRate()} variant="primary">{rateState?.opening_required ? 'Set Opening Prices' : 'Update Prices'}</Button>
      </div>}
      <div className="module-tabs exchange-rate-tabs" role="tablist" aria-label="Exchange price history"><Button aria-pressed={rateTab === 'observations'} onClick={() => setRateTab('observations')} variant={rateTab === 'observations' ? 'primary' : 'secondary'}>Rate Observations</Button><Button aria-pressed={rateTab === 'trends'} onClick={() => setRateTab('trends')} variant={rateTab === 'trends' ? 'primary' : 'secondary'}>Closing Price Trends</Button></div>
      {!selectedPair ? <p className="exchange-rate-empty-prompt">Choose an exchange pair to view its observations and trends.</p> : rateTab === 'observations' ? (
        <div className="exchange-rate-observations--desktop exchange-rate-observations--mobile"><DataTable columns={[{ key: 'buying', header: 'Buying', render: (item: ExchangeRateEntry) => formatRate(item.buying_rate) }, { key: 'selling', header: 'Selling', render: (item: ExchangeRateEntry) => formatRate(item.selling_rate) }, { key: 'effective', header: 'Effective Date', render: (item: ExchangeRateEntry) => item.effective_date ?? '—' }, { key: 'observed', header: 'Observed', render: (item: ExchangeRateEntry) => item.observed_at ? new Date(item.observed_at).toLocaleString() : '—' }, { key: 'status', header: 'Status', render: (item: ExchangeRateEntry) => <Badge tone={item.is_void ? 'danger' : 'success'}>{item.is_void ? 'Void' : 'Active'}</Badge> }]} actions={(item) => <div className="row-actions">{item.can_correct && hasPermission('correct_exchange_rate') && <Button onClick={() => void correctRate(item)} variant="secondary">Correct</Button>}{item.can_void && hasPermission('void_exchange_rate') && <Button onClick={() => void voidRate(item)} variant="danger">Void</Button>}</div>} emptyTitle="No tenant observations" getItemId={(item) => item.id} getItemTitle={(item) => `${item.pair.display_code} ${formatRate(item.buying_rate)} / ${formatRate(item.selling_rate)}`} isLoading={loading} items={rates} /></div>
      ) : <ClosingPriceTrends trend={rateTrend} days={trendDays} onDaysChange={setTrendDays} />}
    </Card>
  </section>
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'The request could not be completed.' }
function FormPriceField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) { return <div><label htmlFor={id}>{label}</label><Input id={id} inputMode="decimal" onChange={(event) => onChange(event.target.value)} value={value} /></div> }
function formatRate(value: string) { return value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value }

function ClosingPriceTrends({ trend, days, onDaysChange }: { trend: ExchangeRateTrend | null; days: 7 | 30 | 90; onDaysChange: (days: 7 | 30 | 90) => void }) {
  return <section className="exchange-rate-trends">
    <header className="exchange-rate-trends__header">
      <div>
        <span className="eyebrow">Daily close</span>
        <h3>{trend?.pair_code ?? 'Exchange-rate'} price movement</h3>
        <p>{trend ? `${formatChartDate(trend.from_date)} – ${formatChartDate(trend.to_date)}` : 'Select a period to review closing prices.'}</p>
      </div>
      <div className="exchange-rate-range-picker" role="group" aria-label="Trend period">
        {([7, 30, 90] as const).map((range) => <button aria-pressed={days === range} className={days === range ? 'is-active' : undefined} key={range} onClick={() => onDaysChange(range)} type="button">{range}D</button>)}
      </div>
    </header>
    <div className="exchange-rate-trend-grid">
      <PriceTrendPanel title="Tenant closing prices" source="Tenant rate" points={trend?.tenant_points ?? []} />
      {Boolean(trend?.platform_points.length) && <PriceTrendPanel title="Admin closing prices" source="Platform reference" points={trend?.platform_points ?? []} />}
    </div>
  </section>
}

function PriceTrendPanel({ title, source, points }: { title: string; source: string; points: ExchangeRateTrendPoint[] }) {
  const orderedPoints = [...points].sort((left, right) => left.date.localeCompare(right.date))
  const [focusedDate, setFocusedDate] = useState<string | null>(orderedPoints.at(-1)?.date ?? null)

  if (!orderedPoints.length) return <div className="subform-panel exchange-rate-trend-panel exchange-rate-trend-panel--empty"><div><span className="eyebrow">{source}</span><h3>{title}</h3></div><p>No closing prices were recorded for this period.</p></div>

  const width = 760
  const height = 330
  const plot = { top: 24, right: 24, bottom: 48, left: 76 }
  const plotWidth = width - plot.left - plot.right
  const plotHeight = height - plot.top - plot.bottom
  const values = orderedPoints.flatMap((point) => [Number(point.buying_close), Number(point.selling_close)]).filter(Number.isFinite)
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const dataSpread = dataMax - dataMin
  const domainPadding = dataSpread > 0 ? dataSpread * 0.12 : Math.max(Math.abs(dataMax) * 0.02, 1)
  const domainMin = Math.max(0, dataMin - domainPadding)
  const domainMax = dataMax + domainPadding
  const domainSpread = domainMax - domainMin || 1
  const timestamps = orderedPoints.map((point) => Date.parse(`${point.date}T00:00:00Z`))
  const timeMin = Math.min(...timestamps)
  const timeMax = Math.max(...timestamps)
  const x = (index: number) => plot.left + (timeMax === timeMin ? plotWidth / 2 : ((timestamps[index] - timeMin) / (timeMax - timeMin)) * plotWidth)
  const y = (value: string | number) => plot.top + (1 - ((Number(value) - domainMin) / domainSpread)) * plotHeight
  const yTicks = Array.from({ length: 5 }, (_, index) => domainMin + (domainSpread * index) / 4).reverse()
  const xTickIndexes = chartTickIndexes(orderedPoints.length)
  const segments = splitTrendSegments(orderedPoints)
  const matchedFocusedIndex = orderedPoints.findIndex((point) => point.date === focusedDate)
  const focusedIndex = matchedFocusedIndex >= 0 ? matchedFocusedIndex : orderedPoints.length - 1
  const focusedPoint = orderedPoints[focusedIndex] ?? orderedPoints.at(-1)!
  const latestPoint = orderedPoints.at(-1)!
  const previousPoint = orderedPoints.at(-2)
  const buyingChange = previousPoint ? percentageChange(Number(latestPoint.buying_close), Number(previousPoint.buying_close)) : null
  const sellingChange = previousPoint ? percentageChange(Number(latestPoint.selling_close), Number(previousPoint.selling_close)) : null
  const hitWidth = Math.max(18, Math.min(48, plotWidth / orderedPoints.length))

  function focusPoint(index: number) {
    setFocusedDate(orderedPoints[index].date)
  }

  return <article className="subform-panel exchange-rate-trend-panel">
    <header className="exchange-rate-trend-panel__header">
      <div><span className="eyebrow">{source}</span><h3>{title}</h3><p>{orderedPoints.length} daily close{orderedPoints.length === 1 ? '' : 's'}</p></div>
      <div className="exchange-rate-chart-legend" aria-label="Chart series"><span><i className="is-buying" />Buying</span><span><i className="is-selling" />Selling</span></div>
    </header>
    <div className="exchange-rate-chart-summary">
      <ChartMetric label="Latest buying" value={formatChartRate(Number(latestPoint.buying_close))} change={buyingChange} tone="buying" />
      <ChartMetric label="Latest selling" value={formatChartRate(Number(latestPoint.selling_close))} change={sellingChange} tone="selling" />
      <ChartMetric label="Latest spread" value={formatChartRate(Number(latestPoint.selling_close) - Number(latestPoint.buying_close))} />
    </div>
    <div className="exchange-rate-chart-canvas">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. Buying and selling closing prices from ${orderedPoints[0].date} to ${latestPoint.date}.`}>
        <desc>Choose or focus a date to inspect its buying and selling closing prices.</desc>
        {yTicks.map((tick) => <g key={tick}><line className="exchange-rate-chart-gridline" x1={plot.left} x2={width - plot.right} y1={y(tick)} y2={y(tick)} /><text className="exchange-rate-chart-axis-label exchange-rate-chart-axis-label--y" x={plot.left - 12} y={y(tick)}>{formatChartRate(tick)}</text></g>)}
        {xTickIndexes.map((index) => <text className="exchange-rate-chart-axis-label exchange-rate-chart-axis-label--x" key={orderedPoints[index].date} x={x(index)} y={height - 14}>{formatShortChartDate(orderedPoints[index].date)}</text>)}
        <line className="exchange-rate-chart-focus-line" x1={x(focusedIndex)} x2={x(focusedIndex)} y1={plot.top} y2={height - plot.bottom} />
        {segments.map((segment) => <polyline key={`buying-${segment[0].point.date}`} className="exchange-rate-chart-line exchange-rate-chart-line--buying" points={segment.map(({ point, index }) => `${x(index)},${y(point.buying_close)}`).join(' ')} />)}
        {segments.map((segment) => <polyline key={`selling-${segment[0].point.date}`} className="exchange-rate-chart-line exchange-rate-chart-line--selling" points={segment.map(({ point, index }) => `${x(index)},${y(point.selling_close)}`).join(' ')} />)}
        {orderedPoints.map((point, index) => <g aria-label={`${formatChartDate(point.date)}. Buying ${formatChartRate(Number(point.buying_close))}. Selling ${formatChartRate(Number(point.selling_close))}.`} className="exchange-rate-chart-hit-target" key={point.date} onClick={() => focusPoint(index)} onFocus={() => focusPoint(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); focusPoint(index) } }} role="button" tabIndex={0}>
          <rect fill="transparent" height={plotHeight} width={hitWidth} x={x(index) - hitWidth / 2} y={plot.top} />
          <circle className={`exchange-rate-chart-point exchange-rate-chart-point--buying${index === focusedIndex ? ' is-focused' : ''}`} cx={x(index)} cy={y(point.buying_close)} r={index === focusedIndex ? 6 : 3.5} />
          <circle className={`exchange-rate-chart-point exchange-rate-chart-point--selling${index === focusedIndex ? ' is-focused' : ''}`} cx={x(index)} cy={y(point.selling_close)} r={index === focusedIndex ? 6 : 3.5} />
        </g>)}
      </svg>
    </div>
    <div className="exchange-rate-chart-focus" aria-live="polite">
      <div><span>Selected date</span><strong>{formatChartDate(focusedPoint.date)}</strong></div>
      <div><span>Buying close</span><strong className="is-buying">{formatChartRate(Number(focusedPoint.buying_close))}</strong></div>
      <div><span>Selling close</span><strong className="is-selling">{formatChartRate(Number(focusedPoint.selling_close))}</strong></div>
      <div><span>Spread</span><strong>{formatChartRate(Number(focusedPoint.selling_close) - Number(focusedPoint.buying_close))}</strong></div>
    </div>
  </article>
}

function ChartMetric({ label, value, change, tone }: { label: string; value: string; change?: number | null; tone?: 'buying' | 'selling' }) {
  const changeTone = change === null || change === undefined || change === 0 ? 'is-flat' : change > 0 ? 'is-up' : 'is-down'
  return <div className={`exchange-rate-chart-metric${tone ? ` exchange-rate-chart-metric--${tone}` : ''}`}><span>{label}</span><strong>{value}</strong>{change !== null && change !== undefined && <small className={changeTone}>{change > 0 ? '+' : ''}{change.toFixed(2)}% vs prior close</small>}</div>
}

function chartTickIndexes(length: number) {
  if (length <= 1) return [0]
  const tickCount = Math.min(5, length)
  return Array.from(new Set(Array.from({ length: tickCount }, (_, index) => Math.round((index * (length - 1)) / (tickCount - 1)))))
}

function percentageChange(current: number, previous: number) {
  return previous === 0 ? 0 : ((current - previous) / previous) * 100
}

function formatChartRate(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value)
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function formatShortChartDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function splitTrendSegments(points: ExchangeRateTrendPoint[]) {
  return points.reduce<Array<Array<{ point: ExchangeRateTrendPoint; index: number }>>>((segments, point, index) => {
    const previous = points[index - 1]
    const hasGap = previous && new Date(`${point.date}T00:00:00Z`).getTime() - new Date(`${previous.date}T00:00:00Z`).getTime() > 86_400_000
    if (!segments.length || hasGap) segments.push([])
    segments[segments.length - 1].push({ point, index })
    return segments
  }, [])
}
