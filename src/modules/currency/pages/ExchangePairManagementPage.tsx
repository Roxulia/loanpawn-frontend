import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Badge, Button } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { CheckIcon, CloseIcon, TrashIcon } from '../../../components/icons/icon'
import { Card, DataCard, FormGroup, SectionHeader } from '../../../components/molecules'
import { DataTable } from '../../../components/organisms'
import { ResourceUsageBadge, usePermissions } from '../../auth'
import { ExchangeCurrencyField } from '../components/CurrencyFields'
import { currencyService } from '../currencyService'
import type { Currency, ExchangeRatePair } from '../types'

export function ExchangePairManagementPage() {
  const { hasPermission } = usePermissions()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [pairs, setPairs] = useState<ExchangeRatePair[]>([])
  const [pairForm, setPairForm] = useState({ base: '', quote: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [currencyPage, pairPage] = await Promise.all([currencyService.listCurrencies(), currencyService.listPairs()])
      setCurrencies(currencyPage.items ?? []); setPairs(pairPage.items ?? [])
    } catch (reason) { setError(messageOf(reason)) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function savePair() {
    if (!pairForm.base || !pairForm.quote) { setError('Choose base and quote currencies.'); return }
    setSaving(true); setError(null)
    try { await currencyService.createPair({ base_currency_code: pairForm.base, quote_currency_code: pairForm.quote }); setPairForm({ base: '', quote: '' }); setNotice('Exchange pair created.'); await load() }
    catch (reason) { setError(messageOf(reason)) } finally { setSaving(false) }
  }

  async function togglePair(pair: ExchangeRatePair) {
    try { await currencyService.updatePair(pair.code, { base_currency_code: pair.base_currency.code, quote_currency_code: pair.quote_currency.code, is_active: !pair.is_active, update_key: pair.update_key }); await load() }
    catch (reason) { setError(messageOf(reason)) }
  }

  async function removePair(pair: ExchangeRatePair) {
    if (!window.confirm(`Delete ${pair.display_code}?`)) return
    try { await currencyService.deletePair(pair.code); setNotice('Exchange pair deleted.'); await load() }
    catch (reason) { setError(messageOf(reason)) }
  }

  return <section className="page exchange-pair-management-page">
    <SectionHeader title="Exchange Pair Management" subtitle="Configure explicit base and quote currency directions." action={<ResourceUsageBadge resource="exchangePairs" />} />
    {error && <Alert message={error} onDismiss={() => setError(null)} title="Exchange-pair action failed" tone="danger" />}
    {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Exchange pairs updated" tone="success" />}
    <Card title="Exchange Pairs" description="Direction is explicit: one base currency equals the entered rate in quote currency.">
      {hasPermission('create_exchange_pair') && <div className="subform-panel exchange-pair-form"><FormGroup columns={2}><ExchangeCurrencyField currencies={currencies} id="pair-base" label="Base currency" onChange={(value) => setPairForm((current) => ({ ...current, base: value }))} value={pairForm.base} /><ExchangeCurrencyField currencies={currencies} id="pair-quote" label="Quote currency" onChange={(value) => setPairForm((current) => ({ ...current, quote: value }))} value={pairForm.quote} /></FormGroup><Button isLoading={saving} onClick={() => void savePair()} variant="primary">Add Pair</Button></div>}
      <div className="exchange-pair-table--desktop exchange-pair-cards--mobile"><DataTable columns={[{ key: 'pair', header: 'Pair', render: (item: ExchangeRatePair) => <strong>{item.display_code}</strong> }, { key: 'meaning', header: 'Meaning', render: (item: ExchangeRatePair) => `1 ${item.base_currency.code} = rate × ${item.quote_currency.code}` }, { key: 'source', header: 'Source', render: (item: ExchangeRatePair) => item.is_default ? 'Built-in' : 'Tenant' }, { key: 'status', header: 'Status', render: (item: ExchangeRatePair) => item.is_active ? 'Active' : 'Inactive' }]} actions={(item) => <div className="row-actions">{item.can_update && hasPermission('update_exchange_pair') && <Button aria-label={`${item.is_active ? 'Deactivate' : 'Activate'} ${item.display_code}`} className="ui-button--icon" onClick={() => void togglePair(item)} title={item.is_active ? 'Deactivate' : 'Activate'} variant="secondary">{item.is_active ? <CloseIcon /> : <CheckIcon />}</Button>}{item.can_delete && hasPermission('delete_exchange_pair') && <Button aria-label={`Delete ${item.display_code}`} className="ui-button--icon" onClick={() => void removePair(item)} title="Delete" variant="danger"><TrashIcon /></Button>}</div>} emptyTitle="No exchange pairs" getItemId={(item) => item.id} getItemTitle={(item) => item.display_code} isLoading={loading} items={pairs} renderMobileCard={(item, actions) => <ExchangePairMobileCard actions={actions} pair={item} />} /></div>
    </Card>
  </section>
}

function ExchangePairMobileCard({ actions, pair }: { actions: ReactNode; pair: ExchangeRatePair }) {
  return <DataCard
    actions={actions}
    className="exchange-pair-mobile-card"
    items={[
      { key: 'Direction', value: `1 ${pair.base_currency.code} = rate × ${pair.quote_currency.code}` },
      { key: 'Source', value: pair.is_default ? 'Built-in' : 'Tenant pair' },
    ]}
    title={<div className="mobile-data-card__heading"><strong>{pair.display_code}</strong><Badge tone={pair.is_active ? 'success' : 'warning'}>{pair.is_active ? 'Active' : 'Inactive'}</Badge></div>}
  />
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'The request could not be completed.' }
