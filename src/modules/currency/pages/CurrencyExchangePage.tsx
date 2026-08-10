import { useCallback, useEffect, useState } from 'react'
import { Alert } from '../../../components/feedback'
import { Button } from '../../../components/atoms'
import { Card, FormGroup, SectionHeader } from '../../../components/molecules'
import { DataTable } from '../../../components/organisms'
import { usePermissions } from '../../auth'
import { CurrencyAdjustmentField, CurrencyCodeField, CurrencyNameField, CurrencyPrecisionField, CurrencyRoundingField, CurrencySymbolField, ExchangeCurrencyField, ExchangeRateValueField } from '../components/CurrencyFields'
import { currencyService } from '../currencyService'
import type { Currency, DailyExchangeRateSummary, ExchangeRateEntry, ExchangeRatePair } from '../types'

const emptyCurrency = { code: '', name: '', symbol: '', decimal_precision: '2', rounding_mode: 'HALF_UP' as Currency['rounding_mode'], adjustment_step: '' }

export function CurrencyExchangePage() {
  const { hasPermission } = usePermissions()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [pairs, setPairs] = useState<ExchangeRatePair[]>([])
  const [rates, setRates] = useState<ExchangeRateEntry[]>([])
  const [dailyRates, setDailyRates] = useState<DailyExchangeRateSummary[]>([])
  const [currencyForm, setCurrencyForm] = useState(emptyCurrency)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [pairForm, setPairForm] = useState({ base: '', quote: '' })
  const [rateForm, setRateForm] = useState({ pair: '', rate: '', observed_at: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const canListCurrencies = hasPermission('list_currency')
  const canListPairs = hasPermission('list_exchange_pair')
  const canListRates = hasPermission('list_exchange_rate')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [currencyPage, pairPage, ratePage, dailyPage] = await Promise.all([
        canListCurrencies ? currencyService.listCurrencies() : Promise.resolve(null),
        canListPairs ? currencyService.listPairs() : Promise.resolve(null),
        canListRates ? currencyService.listRates() : Promise.resolve(null),
        canListRates ? currencyService.listDailyRates() : Promise.resolve(null),
      ])
      setCurrencies(currencyPage?.items ?? [])
      setPairs(pairPage?.items ?? [])
      setRates(ratePage?.items ?? [])
      setDailyRates(dailyPage?.items ?? [])
    } catch (loadError) { setError(messageOf(loadError)) } finally { setLoading(false) }
  }, [canListCurrencies, canListPairs, canListRates])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function saveCurrency() {
    if (!currencyForm.code.trim() || !currencyForm.name.trim()) { setError('Currency code and name are required.'); return }
    setSaving(true); setError(null)
    const payload = { code: currencyForm.code, name: currencyForm.name, symbol: currencyForm.symbol || null, decimal_precision: Number(currencyForm.decimal_precision), rounding_mode: currencyForm.rounding_mode, adjustment_step: currencyForm.adjustment_step || null, is_active: editingCurrency?.is_active ?? true, ...(editingCurrency ? { update_key: editingCurrency.update_key } : {}) }
    try {
      if (editingCurrency) await currencyService.updateCurrency(editingCurrency.code, payload)
      else await currencyService.createCurrency(payload)
      setCurrencyForm(emptyCurrency); setEditingCurrency(null); setNotice(`Currency ${editingCurrency ? 'updated' : 'created'}.`); await load()
    } catch (saveError) { setError(messageOf(saveError)) } finally { setSaving(false) }
  }

  async function removeCurrency(currency: Currency) {
    if (!window.confirm(`Delete ${currency.code}? Historical references will be preserved.`)) return
    try { await currencyService.deleteCurrency(currency.code); setNotice('Currency deleted.'); await load() } catch (deleteError) { setError(messageOf(deleteError)) }
  }

  async function savePair() {
    if (!pairForm.base || !pairForm.quote) { setError('Choose base and quote currencies.'); return }
    setSaving(true); setError(null)
    try { await currencyService.createPair({ base_currency_code: pairForm.base, quote_currency_code: pairForm.quote }); setPairForm({ base: '', quote: '' }); setNotice('Exchange pair created.'); await load() } catch (saveError) { setError(messageOf(saveError)) } finally { setSaving(false) }
  }

  async function togglePair(pair: ExchangeRatePair) {
    try { await currencyService.updatePair(pair.code, { base_currency_code: pair.base_currency.code, quote_currency_code: pair.quote_currency.code, is_active: !pair.is_active, update_key: pair.update_key }); await load() } catch (updateError) { setError(messageOf(updateError)) }
  }

  async function removePair(pair: ExchangeRatePair) {
    if (!window.confirm(`Delete ${pair.display_code}?`)) return
    try { await currencyService.deletePair(pair.code); setNotice('Exchange pair deleted.'); await load() } catch (deleteError) { setError(messageOf(deleteError)) }
  }

  async function saveRate() {
    if (!rateForm.pair || !rateForm.rate) { setError('Choose a pair and enter its rate.'); return }
    setSaving(true); setError(null)
    try { await currencyService.createRate({ pair_code: rateForm.pair, rate: rateForm.rate, observed_at: rateForm.observed_at || null }); setRateForm({ pair: '', rate: '', observed_at: '' }); setNotice('Exchange rate recorded.'); await load() } catch (saveError) { setError(messageOf(saveError)) } finally { setSaving(false) }
  }

  async function correctRate(entry: ExchangeRateEntry) {
    const rate = window.prompt(`Replacement rate for ${entry.pair.display_code}`, entry.rate); if (!rate) return
    const reason = window.prompt('Correction reason'); if (!reason) return
    try { await currencyService.correctRate(entry.code, { rate, reason }); setNotice('Rate corrected with audit history.'); await load() } catch (updateError) { setError(messageOf(updateError)) }
  }

  async function voidRate(entry: ExchangeRateEntry) {
    const reason = window.prompt('Reason for voiding this rate'); if (!reason) return
    try { await currencyService.voidRate(entry.code, { reason }); setNotice('Rate voided.'); await load() } catch (updateError) { setError(messageOf(updateError)) }
  }

  return <section className="page currency-exchange-page">
    <SectionHeader title="Currencies & Exchange Rates" subtitle="Manage tenant currencies, explicit rate directions, and sequential daily observations." />
    {error && <Alert message={error} onDismiss={() => setError(null)} title="Currency action failed" tone="danger" />}
    {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Finance updated" tone="success" />}

    <Card title="Currencies" description="Built-in platform currencies are read-only. Tenant currencies can be maintained here.">
      {hasPermission(editingCurrency ? 'update_currency' : 'create_currency') && <div className="subform-panel currency-form">
        <FormGroup columns={3}><CurrencyCodeField value={currencyForm.code} onChange={(value) => setCurrencyForm((current) => ({ ...current, code: value }))} /><CurrencyNameField value={currencyForm.name} onChange={(value) => setCurrencyForm((current) => ({ ...current, name: value }))} /><CurrencySymbolField value={currencyForm.symbol} onChange={(value) => setCurrencyForm((current) => ({ ...current, symbol: value }))} /></FormGroup>
        <FormGroup columns={3}><CurrencyPrecisionField value={currencyForm.decimal_precision} onChange={(value) => setCurrencyForm((current) => ({ ...current, decimal_precision: value }))} /><CurrencyRoundingField value={currencyForm.rounding_mode} onChange={(value) => setCurrencyForm((current) => ({ ...current, rounding_mode: value }))} /><CurrencyAdjustmentField value={currencyForm.adjustment_step} onChange={(value) => setCurrencyForm((current) => ({ ...current, adjustment_step: value }))} /></FormGroup>
        <div className="row-actions">{editingCurrency && <Button onClick={() => { setEditingCurrency(null); setCurrencyForm(emptyCurrency) }} variant="secondary">Cancel</Button>}<Button isLoading={saving} onClick={() => void saveCurrency()} variant="primary">{editingCurrency ? 'Save Currency' : 'Add Currency'}</Button></div>
      </div>}
      <div className="currency-table--desktop currency-cards--mobile"><DataTable columns={[
        { key: 'currency', header: 'Currency', render: (item: Currency) => <><strong>{item.code}</strong> — {item.name}</> },
        { key: 'precision', header: 'Precision', render: (item: Currency) => `${item.decimal_precision} decimals · ${item.rounding_mode}${item.adjustment_step ? ` · step ${item.adjustment_step}` : ''}` },
        { key: 'source', header: 'Source', render: (item: Currency) => item.is_default ? 'Built-in' : 'Tenant' },
        { key: 'status', header: 'Status', render: (item: Currency) => item.is_active ? 'Active' : 'Inactive' },
        ]} actions={(item) => <div className="row-actions">{item.can_update && hasPermission('update_currency') && <Button onClick={() => { setEditingCurrency(item); setCurrencyForm({ code: item.code, name: item.name, symbol: item.symbol ?? '', decimal_precision: String(item.decimal_precision), rounding_mode: item.rounding_mode, adjustment_step: item.adjustment_step ?? '' }) }} variant="secondary">Edit</Button>}{item.can_delete && hasPermission('delete_currency') && <Button onClick={() => void removeCurrency(item)} variant="danger">Delete</Button>}</div>} emptyTitle="No currencies" getItemId={(item) => item.id} getItemTitle={(item) => item.code} isLoading={loading} items={currencies} /></div>
    </Card>

    <Card title="Exchange Pairs" description="Direction is explicit: 1 base currency equals the entered rate in quote currency.">
      {hasPermission('create_exchange_pair') && <div className="subform-panel"><FormGroup columns={2}><ExchangeCurrencyField currencies={currencies} id="pair-base" label="Base currency" onChange={(value) => setPairForm((current) => ({ ...current, base: value }))} value={pairForm.base} /><ExchangeCurrencyField currencies={currencies} id="pair-quote" label="Quote currency" onChange={(value) => setPairForm((current) => ({ ...current, quote: value }))} value={pairForm.quote} /></FormGroup><Button isLoading={saving} onClick={() => void savePair()} variant="primary">Add Pair</Button></div>}
      <DataTable columns={[{ key: 'pair', header: 'Pair', render: (item: ExchangeRatePair) => <strong>{item.display_code}</strong> }, { key: 'meaning', header: 'Meaning', render: (item: ExchangeRatePair) => `1 ${item.base_currency.code} = rate × ${item.quote_currency.code}` }, { key: 'source', header: 'Source', render: (item: ExchangeRatePair) => item.is_default ? 'Built-in' : 'Tenant' }, { key: 'status', header: 'Status', render: (item: ExchangeRatePair) => item.is_active ? 'Active' : 'Inactive' }]} actions={(item) => <div className="row-actions">{item.can_update && hasPermission('update_exchange_pair') && <Button onClick={() => void togglePair(item)} variant="secondary">{item.is_active ? 'Deactivate' : 'Activate'}</Button>}{item.can_delete && hasPermission('delete_exchange_pair') && <Button onClick={() => void removePair(item)} variant="danger">Delete</Button>}</div>} emptyTitle="No exchange pairs" getItemId={(item) => item.id} getItemTitle={(item) => item.display_code} isLoading={loading} items={pairs} />
    </Card>

    <Card title="Daily Exchange Rates" description="Each insert is an immutable observation used to calculate daily OHLC.">
      {hasPermission('create_exchange_rate') && <div className="subform-panel"><FormGroup columns={3}><div><label htmlFor="rate-pair">Exchange pair</label><select id="rate-pair" onChange={(event) => setRateForm((current) => ({ ...current, pair: event.target.value }))} value={rateForm.pair}><option value="">Select pair</option>{pairs.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.code}>{item.display_code}</option>)}</select></div><ExchangeRateValueField value={rateForm.rate} onChange={(value) => setRateForm((current) => ({ ...current, rate: value }))} /><div><label htmlFor="rate-observed">Observed at</label><input id="rate-observed" onChange={(event) => setRateForm((current) => ({ ...current, observed_at: event.target.value }))} type="datetime-local" value={rateForm.observed_at} /></div></FormGroup><Button isLoading={saving} onClick={() => void saveRate()} variant="primary">Record Rate</Button></div>}
      <DataTable columns={[{ key: 'pair', header: 'Pair', render: (item: ExchangeRateEntry) => item.pair.display_code }, { key: 'rate', header: 'Rate', render: (item: ExchangeRateEntry) => item.rate }, { key: 'observed', header: 'Observed', render: (item: ExchangeRateEntry) => new Date(item.observed_at).toLocaleString() }, { key: 'source', header: 'Source', render: (item: ExchangeRateEntry) => item.source }, { key: 'status', header: 'Status', render: (item: ExchangeRateEntry) => item.is_void ? 'Void' : 'Active' }]} actions={(item) => <div className="row-actions">{item.can_correct && hasPermission('correct_exchange_rate') && <Button onClick={() => void correctRate(item)} variant="secondary">Correct</Button>}{item.can_void && hasPermission('void_exchange_rate') && <Button onClick={() => void voidRate(item)} variant="danger">Void</Button>}</div>} emptyTitle="No exchange rates" getItemId={(item) => item.id} getItemTitle={(item) => `${item.pair.display_code} ${item.rate}`} isLoading={loading} items={rates} />
      <h3>Daily OHLC</h3>
      <DataTable columns={[{ key: 'date', header: 'Date', render: (item: DailyExchangeRateSummary) => item.rate_date }, { key: 'pair', header: 'Pair', render: (item: DailyExchangeRateSummary) => item.pair.display_code ?? `${item.pair.base_currency.code}/${item.pair.quote_currency.code}` }, { key: 'open', header: 'Open', render: (item: DailyExchangeRateSummary) => item.open_rate }, { key: 'high', header: 'High', render: (item: DailyExchangeRateSummary) => item.high_rate }, { key: 'low', header: 'Low', render: (item: DailyExchangeRateSummary) => item.low_rate }, { key: 'close', header: 'Close', render: (item: DailyExchangeRateSummary) => item.close_rate }, { key: 'count', header: 'Entries', render: (item: DailyExchangeRateSummary) => item.entry_count }]} emptyTitle="No daily summaries" getItemId={(item) => item.id} getItemTitle={(item) => `${item.rate_date} ${item.pair.display_code}`} isLoading={loading} items={dailyRates} />
    </Card>
  </section>
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'The request could not be completed.' }
