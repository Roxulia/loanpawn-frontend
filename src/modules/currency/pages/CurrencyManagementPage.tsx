import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Badge, Button } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { EditIcon, TrashIcon } from '../../../components/icons/icon'
import { Card, DataCard, FormGroup, SectionHeader } from '../../../components/molecules'
import { DataTable } from '../../../components/organisms'
import { ResourceUsageBadge, usePermissions } from '../../auth'
import { CurrencyCodeField, CurrencyNameField, CurrencySymbolField } from '../components/CurrencyFields'
import { currencyService } from '../currencyService'
import type { Currency } from '../types'

const emptyCurrency = { code: '', name: '', symbol: '' }

export function CurrencyManagementPage() {
  const { hasPermission } = usePermissions()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currencyForm, setCurrencyForm] = useState(emptyCurrency)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setCurrencies((await currencyService.listCurrencies()).items ?? []) }
    catch (reason) { setError(messageOf(reason)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function saveCurrency() {
    if (!currencyForm.code.trim() || !currencyForm.name.trim()) { setError('Currency code and name are required.'); return }
    setSaving(true); setError(null)
    const payload = { code: currencyForm.code, name: currencyForm.name, symbol: currencyForm.symbol || null, is_active: editingCurrency?.is_active ?? true, ...(editingCurrency ? { update_key: editingCurrency.update_key } : {}) }
    try {
      if (editingCurrency) await currencyService.updateCurrency(editingCurrency.code, payload)
      else await currencyService.createCurrency(payload)
      setCurrencyForm(emptyCurrency); setEditingCurrency(null); setNotice(`Currency ${editingCurrency ? 'updated' : 'created'}.`); await load()
    } catch (reason) { setError(messageOf(reason)) } finally { setSaving(false) }
  }

  async function removeCurrency(currency: Currency) {
    if (!window.confirm(`Set ${currency.code} inactive? Historical references will be preserved.`)) return
    try { await currencyService.deleteCurrency(currency.code); setNotice('Currency set inactive.'); await load() }
    catch (reason) { setError(messageOf(reason)) }
  }

  return <section className="page currency-management-page">
    <SectionHeader title="Currency Management" subtitle="Manage platform and tenant currencies used throughout financial operations." action={<ResourceUsageBadge resource="currencies" />} />
    {error && <Alert message={error} onDismiss={() => setError(null)} title="Currency action failed" tone="danger" />}
    {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Currencies updated" tone="success" />}
    <Card title="Currencies" description="Built-in platform currencies are read-only. Tenant currencies can be maintained here.">
      {hasPermission(editingCurrency ? 'update_currency' : 'create_currency') && <div className="subform-panel currency-form">
        <FormGroup columns={3}><CurrencyCodeField value={currencyForm.code} onChange={(value) => setCurrencyForm((current) => ({ ...current, code: value }))} /><CurrencyNameField value={currencyForm.name} onChange={(value) => setCurrencyForm((current) => ({ ...current, name: value }))} /><CurrencySymbolField value={currencyForm.symbol} onChange={(value) => setCurrencyForm((current) => ({ ...current, symbol: value }))} /></FormGroup>
        <div className="row-actions">{editingCurrency && <Button onClick={() => { setEditingCurrency(null); setCurrencyForm(emptyCurrency) }} variant="secondary">Cancel</Button>}<Button isLoading={saving} onClick={() => void saveCurrency()} variant="primary">{editingCurrency ? 'Save Currency' : 'Add Currency'}</Button></div>
      </div>}
      <div className="currency-table--desktop currency-cards--mobile"><DataTable columns={[
        { key: 'currency', header: 'Currency', render: (item: Currency) => <><strong>{item.code}</strong> — {item.name}</> },
        { key: 'symbol', header: 'Symbol', render: (item: Currency) => item.symbol ?? '—' },
        { key: 'source', header: 'Source', render: (item: Currency) => item.is_default ? 'Built-in' : 'Tenant' },
        { key: 'status', header: 'Status', render: (item: Currency) => item.is_active ? 'Active' : 'Inactive' },
      ]} actions={(item) => <div className="row-actions">{item.can_update && hasPermission('update_currency') && <Button aria-label={`Edit ${item.code}`} className="ui-button--icon" onClick={() => { setEditingCurrency(item); setCurrencyForm({ code: item.code, name: item.name, symbol: item.symbol ?? '' }) }} title="Edit" variant="secondary"><EditIcon /></Button>}{item.can_delete && hasPermission('delete_currency') && <Button aria-label={`Set ${item.code} inactive`} className="ui-button--icon" onClick={() => void removeCurrency(item)} title="Set inactive" variant="danger"><TrashIcon /></Button>}</div>} emptyTitle="No currencies" getItemId={(item) => item.id} getItemTitle={(item) => item.code} isLoading={loading} items={currencies} renderMobileCard={(item, actions) => <CurrencyMobileCard actions={actions} currency={item} />} /></div>
    </Card>
  </section>
}

function CurrencyMobileCard({ currency, actions }: { currency: Currency; actions: ReactNode }) {
  return <DataCard
    actions={actions}
    className="currency-mobile-card"
    items={[
      { key: 'Name', value: currency.name },
      { key: 'Symbol', value: currency.symbol ?? '—' },
      { key: 'Source', value: currency.is_default ? 'Built-in' : 'Tenant currency' },
    ]}
    title={<div className="mobile-data-card__heading"><strong>{currency.code}</strong><Badge tone={currency.is_active ? 'success' : 'warning'}>{currency.is_active ? 'Active' : 'Inactive'}</Badge></div>}
  />
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'The request could not be completed.' }
