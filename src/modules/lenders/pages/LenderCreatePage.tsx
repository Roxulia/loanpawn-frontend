import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Alert } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { CustomerForm } from '../../customers/components/customerForm'
import { emptyCustomerForm, formToCustomerPayload, validateCustomerForm, type CustomerFormErrors, type CustomerFormState } from '../../customers/components/customerFormModel'
import { lenderService } from '../services/lenderService'

export function LenderCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm)
  const [errors, setErrors] = useState<CustomerFormErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function change<K extends keyof CustomerFormState>(field: K, value: CustomerFormState[K]) { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })) }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const next = validateCustomerForm(form); if (Object.keys(next).length) { setErrors(next); return } setSaving(true); setError(null); try { const lender = await lenderService.create(formToCustomerPayload(form)); navigate(routePaths.lenderDetail(lender.code)) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create lender.') } finally { setSaving(false) } }

  return <section className="page lender-create-page"><SectionHeader title="Add Lender" subtitle="Create a shared person profile for business loan funding." />
    <CustomerForm errors={errors} formDescription="Keep lender identity and contact data accurate for business loan workflows." formTitle="Lender details" isSaving={saving} mode="create" onCancel={() => navigate(routePaths.lenders)} onChange={change} onSubmit={submit} operationAlert={error ? <Alert message={error} onDismiss={() => setError(null)} title="Create failed" tone="danger" /> : null} submitLabel="Create Lender" value={form} />
  </section>
}
