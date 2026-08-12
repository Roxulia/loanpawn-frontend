import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Button, Input, Select, Textarea } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ActionBar, Card, FormField, FormGroup, KeyValueList, SectionHeader } from '../../../components/molecules'
import { createIdempotencyKey } from '../../../services/http/idempotency'
import { formatDate, formatMoney } from '../../finance/financeFormat'
import { financialAccountService } from '../financialAccountService'
import type { FinancialAccount, FinancialAccountTransfer } from '../types'

export function FinancialAccountTransferPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [transfers, setTransfers] = useState<FinancialAccountTransfer[]>([])
  const [form, setForm] = useState({ from: '', to: '', amount: '', rate: '', fee: '', note: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'danger' | 'success'; text: string } | null>(null)
  const idempotency = useRef<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [accountPage, transferPage] = await Promise.all([financialAccountService.list({ perPage: 100 }), financialAccountService.listTransfers({ perPage: 20 })])
      const active = accountPage.items.filter((account) => account.is_active && !account.is_deleted)
      setAccounts(active); setTransfers(transferPage.items)
      setForm((current) => ({ ...current, from: current.from || String(active.find((account) => account.is_default)?.id ?? active[0]?.id ?? '') }))
    } catch (reason) {
      setMessage({ tone: 'danger', text: reason instanceof Error ? reason.message : 'Unable to load transfer data.' })
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])
  const from = accounts.find((account) => String(account.id) === form.from)
  const to = accounts.find((account) => String(account.id) === form.to)
  const crossCurrency = Boolean(from && to && from.currency.id !== to.currency.id)
  const destinationAmount = crossCurrency ? Number(form.amount || 0) * Number(form.rate || 0) : Number(form.amount || 0)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!from || !to || from.id === to.id || Number(form.amount) <= 0 || (crossCurrency && Number(form.rate) <= 0)) {
      setMessage({ tone: 'danger', text: 'Choose different accounts and enter valid transfer values.' }); return
    }
    if (idempotency.current) return
    idempotency.current = createIdempotencyKey(); setSaving(true); setMessage(null)
    try {
      await financialAccountService.transfer({ from_account_id: from.id, to_account_id: to.id, from_amount: Number(form.amount), exchange_rate: crossCurrency ? Number(form.rate) : undefined, fee_amount: Number(form.fee || 0), note: form.note.trim() || undefined }, idempotency.current)
      setForm((current) => ({ ...current, to: '', amount: '', rate: '', fee: '', note: '' })); setMessage({ tone: 'success', text: 'Account transfer completed.' }); await load()
    } catch (reason) {
      setMessage({ tone: 'danger', text: reason instanceof Error ? reason.message : 'Unable to complete transfer.' })
    } finally { idempotency.current = null; setSaving(false) }
  }

  return <section className="page">
    <SectionHeader title="Transfer Between Accounts" subtitle="Move funds safely between active financial accounts." />
    {message && <Alert message={message.text} onDismiss={() => setMessage(null)} title={message.tone === 'success' ? 'Transfer complete' : 'Transfer failed'} tone={message.tone} />}
    {loading ? <LoadingState rows={5} /> : <div className="workflow-stack">
      <Card title="Transfer Details"><form className="ui-form" onSubmit={(event) => void submit(event)}>
        <FormGroup columns={2}>
          <FormField id="transfer-from" label="Source Account"><Select id="transfer-from" value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value, to: '' })}><option value="">Select source</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name} · {account.currency.code} · {formatMoney(account.balance)}</option>)}</Select></FormField>
          <FormField id="transfer-to" label="Destination Account"><Select id="transfer-to" value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })}><option value="">Select destination</option>{accounts.filter((account) => String(account.id) !== form.from).map((account) => <option key={account.id} value={account.id}>{account.account_name} · {account.currency.code} · {formatMoney(account.balance)}</option>)}</Select></FormField>
          <FormField id="transfer-amount" label={`Amount${from ? ` (${from.currency.code})` : ''}`}><Input id="transfer-amount" min="0.0001" step="0.0001" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></FormField>
          {crossCurrency && <FormField id="transfer-rate" label={`Rate (${from?.currency.code} → ${to?.currency.code})`}><Input id="transfer-rate" min="0.00000001" step="0.00000001" type="number" value={form.rate} onChange={(event) => setForm({ ...form, rate: event.target.value })} /></FormField>}
          <FormField id="transfer-fee" label={`Fee${from ? ` (${from.currency.code})` : ''}`} helperText="Deducted from the source account."><Input id="transfer-fee" min="0" step="0.0001" type="number" value={form.fee} onChange={(event) => setForm({ ...form, fee: event.target.value })} /></FormField>
          <FormField id="transfer-note" label="Note"><Textarea id="transfer-note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></FormField>
        </FormGroup>
        <KeyValueList items={[{ key: 'Destination receives', value: to ? `${to.currency.code} ${formatMoney(destinationAmount)}` : '-' }, { key: 'Total source deduction', value: from ? `${from.currency.code} ${formatMoney(Number(form.amount || 0) + Number(form.fee || 0))}` : '-' }]} />
        <ActionBar><Button onClick={() => navigate(routePaths.financialAccounts)} variant="secondary">Cancel</Button><Button isLoading={saving} type="submit" variant="primary">Transfer Funds</Button></ActionBar>
      </form></Card>
      <Card title="Recent Transfers"><div className="financial-transfer-list">{transfers.length === 0 ? <p className="muted">No account transfers.</p> : transfers.map((item) => <article key={item.id}><div><strong>{item.from_account.name} → {item.to_account.name}</strong><small>{formatDate(item.transferred_at)}</small></div><span>{item.from_account.currency.code} {formatMoney(item.from_amount)} → {item.to_account.currency.code} {formatMoney(item.to_amount)}</span></article>)}</div></Card>
    </div>}
  </section>
}
