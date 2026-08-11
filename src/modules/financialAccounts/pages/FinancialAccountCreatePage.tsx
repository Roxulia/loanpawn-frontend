import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Alert } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import type { Currency } from '../../currency/types'
import type { DefaultTypeOption } from '../../settings/services/settingsService'
import { FinancialAccountForm, type FinancialAccountFormState } from '../components/FinancialAccountForm'
import { financialAccountService } from '../financialAccountService'

const emptyForm: FinancialAccountFormState = { account_type: '', currency_type: '', account_name: '', balance: '', allow_negative_balance: false, account_number: '', is_active: true, is_default: false }

export function FinancialAccountCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [types, setTypes] = useState<DefaultTypeOption[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { Promise.all([financialAccountService.accountTypes(), financialAccountService.currencies()]).then(([typePage, currencyPage]) => { setTypes(typePage.items); setCurrencies(currencyPage.items) }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load account options.')) }, [])
  function update<K extends keyof FinancialAccountFormState>(field: K, value: FinancialAccountFormState[K]) { setForm((current) => ({ ...current, [field]: value })) }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(null); try { await financialAccountService.create({ account_type: form.account_type, currency_type: form.currency_type, account_name: form.account_name.trim(), balance: form.balance === '' ? 0 : Number(form.balance), allow_negative_balance: form.allow_negative_balance, account_number: form.account_number.trim() || null }); navigate(routePaths.financialAccounts, { state: { notice: 'Financial account created.' } }) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create financial account.') } finally { setSaving(false) } }

  return <section className="page"><SectionHeader title="Create Financial Account" subtitle="Add another cash, bank, or online payment account." /><FinancialAccountForm value={form} accountTypes={types} currencies={currencies} isSaving={saving} onChange={update} onCancel={() => navigate(routePaths.financialAccounts)} onSubmit={(event) => void submit(event)} alert={error ? <Alert message={error} title="Account action failed" tone="danger" /> : null} /></section>
}
