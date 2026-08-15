import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Alert, LoadingState } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { FinancialAccountForm, type FinancialAccountFormState } from '../components/FinancialAccountForm'
import { financialAccountService } from '../financialAccountService'

const emptyForm: FinancialAccountFormState = { account_type: '', currency_type: '', account_name: '', balance: '', balance_unit: 'UNIT', allow_negative_balance: false, account_number: '', is_active: true, is_default: false }

export function FinancialAccountEditPage() {
  const navigate = useNavigate(); const { accountCode = '' } = useParams()
  const [form, setForm] = useState(emptyForm); const [updateKey, setUpdateKey] = useState(0)
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (!accountCode) return; financialAccountService.get(accountCode).then((account) => { setForm({ ...emptyForm, account_name: account.account_name, account_number: account.account_number ?? '', is_active: account.is_active, is_default: account.is_default }); setUpdateKey(account.update_key) }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load financial account.')).finally(() => setLoading(false)) }, [accountCode])
  if (!accountCode) return <Navigate replace to={routePaths.financialAccounts} />
  function update<K extends keyof FinancialAccountFormState>(field: K, value: FinancialAccountFormState[K]) { setForm((current) => ({ ...current, [field]: value })) }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(null); try { await financialAccountService.update(accountCode, { name: form.account_name.trim(), account_number: form.account_number.trim() || null, is_active: form.is_active, is_default: form.is_default, update_key: updateKey }); navigate(routePaths.financialAccounts, { state: { notice: 'Financial account updated.' } }) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update financial account.') } finally { setSaving(false) } }
  return <section className="page"><SectionHeader title="Update Financial Account" subtitle={accountCode} />{loading ? <LoadingState rows={5} /> : <FinancialAccountForm editing value={form} accountTypes={[]} currencies={[]} isSaving={saving} onChange={update} onCancel={() => navigate(routePaths.financialAccounts)} onSubmit={(event) => void submit(event)} alert={error ? <Alert message={error} title="Account action failed" tone="danger" /> : null} />}</section>
}
