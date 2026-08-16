import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Button, Input } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { Card, SectionHeader } from '../../../components/molecules'
import { ConfirmDialog } from '../../../components/organisms'
import { currencyService } from '../currencyService'
import type { HistoricalRateRequirement, HistoricalRateRequirements, HistoricalRateValues } from '../types'
import { settingsService } from '../../settings/services/settingsService'

export function ReportingCurrencyRatesPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<HistoricalRateRequirements | null>(null)
  const [rates, setRates] = useState<Record<string, HistoricalRateValues>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aborting, setAborting] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [confirmAbort, setConfirmAbort] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    currencyService.getHistoricalRateRequirements()
      .then((response) => {
        setData(response)
        setRates(Object.fromEntries(response.requirements.map((item) => [item.requirement_key, emptyRate(item.requirement_key)])))
      })
      .catch((reason) => setError(messageOf(reason)))
      .finally(() => setLoading(false))
  }, [])

  const values = useMemo(() => Object.values(rates), [rates])
  const canSubmit = Boolean(data?.requirements.length)
    && data!.requirements.every((item) => item.pair !== null)
    && values.length === data!.requirements.length
    && values.every((item) => item.buying_open && item.buying_close && item.selling_open && item.selling_close)

  function updateRate(key: string, field: keyof Omit<HistoricalRateValues, 'requirement_key'>, value: string) {
    setRates((current) => ({ ...current, [key]: { ...current[key], [field]: value } }))
  }

  async function submit() {
    if (!data || !canSubmit) return
    setSaving(true); setError(null)
    try {
      const response = await currencyService.submitHistoricalRates(data.recalculation_id, values)
      setData(response); setConfirmSubmit(false); setNotice('Historical rates saved. Reporting currency recalculation has been queued.')
    } catch (reason) { setError(messageOf(reason)); setConfirmSubmit(false) }
    finally { setSaving(false) }
  }

  async function abort() {
    if (!data) return
    setAborting(true); setError(null)
    try {
      await settingsService.abortReportingCurrencyChange({ recalculation_id: data.recalculation_id, update_key: data.currency_setting_update_key })
      navigate(routePaths.settings, { replace: true })
    } catch (reason) { setError(messageOf(reason)); setConfirmAbort(false) }
    finally { setAborting(false) }
  }

  if (loading) return <section className="page reporting-currency-rates-page"><LoadingState rows={6} /></section>

  return (
    <section className="page reporting-currency-rates-page">
      <SectionHeader title="Required Historical Rates" subtitle="Supply only the exact dates requested by the reporting currency recalculation." />
      {error && <Alert action={<Button onClick={() => navigate(routePaths.settings)}>Back to Settings</Button>} message={error} title="Historical rates unavailable" tone="danger" />}
      {notice && <Alert action={<Button onClick={() => navigate(routePaths.settings)}>Back to Settings</Button>} message={notice} title="Rates submitted" tone="success" />}
      {data && data.requirements.length > 0 && (
        <Card title={`${data.previous_currency.code} to ${data.requested_currency.code}`} description="Dates and currency pairs are locked by the system request. Submitted historical rates cannot be edited or removed.">
          {data.requirements.some((item) => item.pair === null) && <Alert action={<Button onClick={() => navigate(routePaths.exchangePairs)}>Manage Exchange Pairs</Button>} message="Create an active direct or reverse exchange pair for every requested currency direction." title="Exchange pair required" tone="warning" />}
          <div className="historical-rate-requirements historical-rate-requirements--desktop">
            {data.requirements.map((item) => <HistoricalRateRow key={item.requirement_key} item={item} rates={rates[item.requirement_key]} onChange={updateRate} />)}
          </div>
          <div className="historical-rate-requirements historical-rate-requirements--mobile">
            {data.requirements.map((item) => <HistoricalRateCard key={item.requirement_key} item={item} rates={rates[item.requirement_key]} onChange={updateRate} />)}
          </div>
          <div className="historical-rate-actions">
            <Button onClick={() => setConfirmAbort(true)} variant="danger">Abort Currency Change</Button>
            <Button disabled={!canSubmit} onClick={() => setConfirmSubmit(true)} variant="primary">Review and Submit All Rates</Button>
          </div>
        </Card>
      )}
      <ConfirmDialog confirmLabel="Submit Permanent Rates" isLoading={saving} isOpen={confirmSubmit} message="Submit all historical opening and closing rates? These entries are permanent and cannot be corrected or voided." onCancel={() => setConfirmSubmit(false)} onConfirm={() => void submit()} title="Confirm historical rates" />
      <ConfirmDialog confirmLabel="Abort Currency Change" isLoading={aborting} isOpen={confirmAbort} message={`Return reporting currency to ${data?.previous_currency.code ?? 'the previous currency'}? Historical rates already submitted will be retained.`} onCancel={() => setConfirmAbort(false)} onConfirm={() => void abort()} title="Abort reporting currency change" />
    </section>
  )
}

type RateFieldsProps = {
  item: HistoricalRateRequirement
  rates: HistoricalRateValues
  onChange: (key: string, field: keyof Omit<HistoricalRateValues, 'requirement_key'>, value: string) => void
}

function HistoricalRateRow(props: RateFieldsProps) {
  return <article className="historical-rate-row"><RequirementHeader item={props.item} /><RateFields {...props} idPrefix="desktop" /></article>
}

function HistoricalRateCard(props: RateFieldsProps) {
  return <article className="historical-rate-card"><RequirementHeader item={props.item} /><RateFields {...props} idPrefix="mobile" /></article>
}

function RequirementHeader({ item }: { item: HistoricalRateRequirement }) {
  return <header><strong>{item.date}</strong><span>{item.from_currency.code} → {item.to_currency.code}</span><small>{item.pair ? `${item.pair.display_code} (${item.pair.direction})` : 'Pair unavailable'}</small></header>
}

function RateFields({ idPrefix, item, rates, onChange }: RateFieldsProps & { idPrefix: string }) {
  return <div className="historical-rate-fields">{(['buying_open', 'buying_close', 'selling_open', 'selling_close'] as const).map((field) => <label key={field} htmlFor={`${idPrefix}-${item.requirement_key}-${field}`}><span>{field.replace('_', ' ')}</span><Input id={`${idPrefix}-${item.requirement_key}-${field}`} inputMode="decimal" onChange={(event) => onChange(item.requirement_key, field, event.target.value)} value={rates[field]} /></label>)}</div>
}

function emptyRate(requirement_key: string): HistoricalRateValues { return { requirement_key, buying_open: '', buying_close: '', selling_open: '', selling_close: '' } }
function messageOf(error: unknown) { return error instanceof Error ? error.message : 'The request could not be completed.' }
