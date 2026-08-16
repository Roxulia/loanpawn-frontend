import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Button, Select, Textarea } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ActionBar, Card, FinancialAmountInput, FormField, FormGroup, KeyValueList, SectionHeader } from '../../../components/molecules'
import { createIdempotencyKey } from '../../../services/http/idempotency'
import { formatDate, formatMoney } from '../../finance/financeFormat'
import { financialAmountToBase } from '../../finance/financialUnits'
import { ReportingExchangeRateField } from '../../finance/ReportingExchangeRateField'
import type { FinancialUnitCode } from '../../finance/financialUnits'
import { financialAccountService } from '../financialAccountService'
import type { FinancialAccount, FinancialAccountTransfer } from '../types'

export function FinancialAccountTransferPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [transfers, setTransfers] = useState<FinancialAccountTransfer[]>([])
  const [form, setForm] = useState<{ from: string; to: string; amount: string; amountUnit: FinancialUnitCode; rate: string; rateInversed: boolean; resolvedRate: number | null; fee: string; feeUnit: FinancialUnitCode; feeReportingRate: string; feeReportingRateInversed: boolean; note: string }>({ from: '', to: '', amount: '', amountUnit: 'UNIT', rate: '', rateInversed: false, resolvedRate: null, fee: '', feeUnit: 'UNIT', feeReportingRate: '', feeReportingRateInversed: false, note: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'danger' | 'success'; text: string } | null>(null)
  const idempotency = useRef<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [accountPage, transferPage] = await Promise.all([financialAccountService.list({ perPage: 100, assignedOnly: true }), financialAccountService.listTransfers({ perPage: 20 })])
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
  const sourceAmount = financialAmountToBase({ amount: form.amount, unit: form.amountUnit })
  const sourceFee = financialAmountToBase({ amount: form.fee, unit: form.feeUnit })
  const enteredRate = Number(form.rate || 0)
  const manualMultiplier = enteredRate > 0 ? (form.rateInversed ? 1 / enteredRate : enteredRate) : 0
  const destinationAmount = crossCurrency ? sourceAmount * (form.resolvedRate ?? manualMultiplier) : sourceAmount

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!from || !to || from.id === to.id || sourceAmount <= 0 || (crossCurrency && (form.resolvedRate ?? Number(form.rate)) <= 0)) {
      setMessage({ tone: 'danger', text: 'Choose different accounts and enter valid transfer values.' }); return
    }
    if (idempotency.current) return
    idempotency.current = createIdempotencyKey(); setSaving(true); setMessage(null)
    try {
      await financialAccountService.transfer({ from_account_id: from.id, to_account_id: to.id, from_amount: Number(form.amount), from_amount_unit: form.amountUnit, exchange_rate: form.rate ? Number(form.rate) : undefined, exchange_rate_inversed: form.rate ? form.rateInversed : undefined, fee_amount: Number(form.fee || 0), fee_amount_unit: form.feeUnit, fee_reporting_exchange_rate: form.feeReportingRate ? Number(form.feeReportingRate) : undefined, fee_reporting_exchange_rate_inversed: form.feeReportingRate ? form.feeReportingRateInversed : undefined, note: form.note.trim() || undefined }, idempotency.current)
      setForm((current) => ({ ...current, to: '', amount: '', amountUnit: 'UNIT', rate: '', rateInversed: false, resolvedRate: null, fee: '', feeUnit: 'UNIT', feeReportingRate: '', feeReportingRateInversed: false, note: '' })); setMessage({ tone: 'success', text: 'Account transfer completed.' }); await load()
    } catch (reason) {
      setMessage({ tone: 'danger', text: reason instanceof Error ? reason.message : 'Unable to complete transfer.' })
    } finally { idempotency.current = null; setSaving(false) }
  }

  return <section className="page financial-account-transfer-page">
    <SectionHeader title="Transfer Between Accounts" subtitle="Move funds safely between active financial accounts." />
    {message && <Alert message={message.text} onDismiss={() => setMessage(null)} title={message.tone === 'success' ? 'Transfer complete' : 'Transfer failed'} tone={message.tone} />}
    {loading ? <LoadingState rows={5} /> : <div className="workflow-stack">
      <Card title="Transfer Details"><form className="ui-form" onSubmit={(event) => void submit(event)}>
        <FormGroup columns={2}>
          <FormField id="transfer-from" label="Source Account"><Select id="transfer-from" value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value, to: '' })}><option value="">Select source</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name} · {account.currency.code} · {formatMoney(account.balance)}</option>)}</Select></FormField>
          <FormField id="transfer-to" label="Destination Account"><Select id="transfer-to" value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })}><option value="">Select destination</option>{accounts.filter((account) => String(account.id) !== form.from).map((account) => <option key={account.id} value={account.id}>{account.account_name} · {account.currency.code} · {formatMoney(account.balance)}</option>)}</Select></FormField>
          <FormField id="transfer-amount" label={`Amount${from ? ` (${from.currency.code})` : ''}`}><FinancialAmountInput id="transfer-amount" min="0.0001" step="0.0001" value={{ amount: form.amount, unit: form.amountUnit }} onChange={(next) => setForm({ ...form, amount: next.amount, amountUnit: next.unit })} /></FormField>
          {crossCurrency && <ReportingExchangeRateField accountId={form.from} inversed={form.rateInversed} label="Exchange rate" manualRate={form.rate} onInversedChange={(rateInversed) => setForm((current) => ({ ...current, rateInversed }))} onManualRateChange={(rate) => setForm((current) => ({ ...current, rate }))} onResolvedMultiplier={(resolvedRate) => setForm((current) => current.resolvedRate === resolvedRate ? current : { ...current, resolvedRate })} toCurrencyId={to?.currency.id} />}
          <FormField id="transfer-fee" label={`Fee${from ? ` (${from.currency.code})` : ''}`} helperText="Deducted from the source account."><FinancialAmountInput id="transfer-fee" min="0" step="0.0001" value={{ amount: form.fee, unit: form.feeUnit }} onChange={(next) => setForm({ ...form, fee: next.amount, feeUnit: next.unit })} /></FormField>
          {sourceFee > 0 && <ReportingExchangeRateField accountId={form.from} inversed={form.feeReportingRateInversed} label="Fee reporting exchange rate" manualRate={form.feeReportingRate} onInversedChange={(feeReportingRateInversed) => setForm((current) => ({ ...current, feeReportingRateInversed }))} onManualRateChange={(feeReportingRate) => setForm((current) => ({ ...current, feeReportingRate }))} />}
          <FormField id="transfer-note" label="Note"><Textarea id="transfer-note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></FormField>
        </FormGroup>
        <KeyValueList items={[{ key: 'Destination receives', value: to ? `${to.currency.code} ${formatMoney(destinationAmount)}` : '-' }, { key: 'Total source deduction', value: from ? `${from.currency.code} ${formatMoney(sourceAmount + sourceFee)}` : '-' }]} />
        <ActionBar><Button onClick={() => navigate(routePaths.financialAccounts)} variant="secondary">Cancel</Button><Button isLoading={saving} type="submit" variant="primary">Transfer Funds</Button></ActionBar>
      </form></Card>
      <Card title="Recent Transfers"><div className="financial-transfer-list">{transfers.length === 0 ? <p className="muted">No account transfers.</p> : transfers.map((item) => <article key={item.id}><div><strong>{item.from_account.name} → {item.to_account.name}</strong><small>{formatDate(item.transferred_at)}</small></div><span>{item.from_account.currency.code} {formatMoney(item.from_amount)} → {item.to_account.currency.code} {formatMoney(item.to_amount)}</span></article>)}</div></Card>
    </div>}
  </section>
}
