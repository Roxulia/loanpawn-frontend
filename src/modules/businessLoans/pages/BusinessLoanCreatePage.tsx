import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Alert } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { createIdempotencyKey } from '../../../services/http/idempotency'
import { BusinessLoanForm, businessLoanPayload, emptyBusinessLoanForm, type BusinessLoanFormState } from '../components/BusinessLoanForm'
import { businessLoanService } from '../services/businessLoanService'

export function BusinessLoanCreatePage() {
  const navigate = useNavigate(); const [params] = useSearchParams(); const [form, setForm] = useState<BusinessLoanFormState>({ ...emptyBusinessLoanForm, lender_code: params.get('lender') ?? '' }); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null)
  function change<K extends keyof BusinessLoanFormState>(field: K, value: BusinessLoanFormState[K]) { setForm((current) => ({ ...current, [field]: value })) }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(null); try { const loan = await businessLoanService.create(businessLoanPayload(form), createIdempotencyKey()); navigate(routePaths.businessLoanDetail(loan.code)) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create business loan.') } finally { setSaving(false) } }
  return <section className="page business-loan-create-page"><SectionHeader title="Create Business Loan" subtitle="Record money received from a lender as a liability." /><BusinessLoanForm error={error ? <Alert message={error} onDismiss={() => setError(null)} title="Creation failed" tone="danger" /> : null} mode="create" onCancel={() => navigate(routePaths.businessLoans)} onChange={change} onSubmit={submit} saving={saving} value={form} /></section>
}
