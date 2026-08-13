import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { EditIcon, TrashIcon } from '../../../components/icons/icon'
import { Card, FormGroup, SectionHeader } from '../../../components/molecules'
import { DataTable } from '../../../components/organisms'
import { usePermissions } from '../../auth'
import { CurrencyAdjustmentField, CurrencyCodeField, CurrencyNameField, CurrencyPrecisionField, CurrencyRoundingField, CurrencySymbolField } from '../components/CurrencyFields'
import { currencyService } from '../currencyService'
import type { Currency } from '../types'

const emptyCurrency = { code: '', name: '', symbol: '', decimal_precision: '2', rounding_mode: 'HALF_UP' as Currency['rounding_mode'], adjustment_step: '' }

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
    const payload = { code: currencyForm.code, name: currencyForm.name, symbol: currencyForm.symbol || null, decimal_precision: Number(currencyForm.decimal_precision), rounding_mode: currencyForm.rounding_mode, adjustment_step: currencyForm.adjustment_step || null, is_active: editingCurrency?.is_active ?? true, ...(editingCurrency ? { update_key: editingCurrency.update_key } : {}) }
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
    <SectionHeader title="Currency Management" subtitle="Manage platform and tenant currencies used throughout financial operations." />
    {error && <Alert message={error} onDismiss={() => setError(null)} title="Currency action failed" tone="danger" />}
    {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Currencies updated" tone="success" />}
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
      ]} actions={(item) => <div className="row-actions">{item.can_update && hasPermission('update_currency') && <Button aria-label={`Edit ${item.code}`} className="ui-button--icon" onClick={() => { setEditingCurrency(item); setCurrencyForm({ code: item.code, name: item.name, symbol: item.symbol ?? '', decimal_precision: String(item.decimal_precision), rounding_mode: item.rounding_mode, adjustment_step: item.adjustment_step ?? '' }) }} title="Edit" variant="secondary"><EditIcon /></Button>}{item.can_delete && hasPermission('delete_currency') && <Button aria-label={`Set ${item.code} inactive`} className="ui-button--icon" onClick={() => void removeCurrency(item)} title="Set inactive" variant="danger"><TrashIcon /></Button>}</div>} emptyTitle="No currencies" getItemId={(item) => item.id} getItemTitle={(item) => item.code} isLoading={loading} items={currencies} /></div>
    </Card>
  </section>
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : 'The request could not be completed.' }
