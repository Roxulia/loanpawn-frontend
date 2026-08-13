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
    try { await currencyService.createRate({ pair_code: selectedPair, ...rateForm }); setRateForm({ buying_rate: '', selling_rate: '' }); setNotice(rateState?.opening_required ? 'Opening prices recorded.' : 'Current prices updated.'); await loadSelectedPair() }
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
  return <section className="exchange-rate-trends"><div className="row-actions">{([7, 30, 90] as const).map((range) => <Button key={range} onClick={() => onDaysChange(range)} variant={days === range ? 'primary' : 'secondary'}>{range} days</Button>)}</div><div className="exchange-rate-trend-grid"><PriceTrendPanel title="Tenant closing prices" points={trend?.tenant_points ?? []} />{Boolean(trend?.platform_points.length) && <PriceTrendPanel title="Admin closing prices" points={trend?.platform_points ?? []} />}</div></section>
}

function PriceTrendPanel({ title, points }: { title: string; points: ExchangeRateTrendPoint[] }) {
  if (!points.length) return <div className="subform-panel"><h3>{title}</h3><p>No closing prices for this period.</p></div>
  const width = 640, height = 240, padding = 30
  const values = points.flatMap((point) => [Number(point.buying_close), Number(point.selling_close)]).filter(Number.isFinite)
  const min = Math.min(...values), max = Math.max(...values), spread = max - min || 1
  const coordinate = (index: number, value: string) => `${padding + (points.length === 1 ? 0 : index / (points.length - 1) * (width - padding * 2))},${height - padding - ((Number(value) - min) / spread) * (height - padding * 2)}`
  const segments = splitTrendSegments(points)
  return <div className="subform-panel exchange-rate-trend-panel"><h3>{title}</h3><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}><line className="exchange-rate-chart-axis" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />{segments.map((segment) => <polyline key={`buying-${segment[0].point.date}`} className="exchange-rate-chart-line exchange-rate-chart-line--buying" points={segment.map(({ point, index }) => coordinate(index, point.buying_close)).join(' ')} />)}{segments.map((segment) => <polyline key={`selling-${segment[0].point.date}`} className="exchange-rate-chart-line exchange-rate-chart-line--selling" points={segment.map(({ point, index }) => coordinate(index, point.selling_close)).join(' ')} />)}{points.map((point, index) => <g key={point.date}><circle className="exchange-rate-chart-point exchange-rate-chart-point--buying" cx={coordinate(index, point.buying_close).split(',')[0]} cy={coordinate(index, point.buying_close).split(',')[1]} r="4"><title>{`${point.date} Buying ${formatRate(point.buying_close)}`}</title></circle><circle className="exchange-rate-chart-point exchange-rate-chart-point--selling" cx={coordinate(index, point.selling_close).split(',')[0]} cy={coordinate(index, point.selling_close).split(',')[1]} r="4"><title>{`${point.date} Selling ${formatRate(point.selling_close)}`}</title></circle></g>)}</svg><div className="exchange-rate-chart-legend"><span><i className="is-buying" />Buying</span><span><i className="is-selling" />Selling</span></div></div>
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
