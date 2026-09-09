import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Alert, LoadingState } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { CustomerForm } from '../../customers/components/customerForm'
import { customerToForm, formToCustomerPayload, validateCustomerForm, type CustomerFormErrors, type CustomerFormState } from '../../customers/components/customerFormModel'
import { lenderService } from '../services/lenderService'

export function LenderUpdatePage() {
  const { lenderCode = '' } = useParams(); const navigate = useNavigate()
  const [form, setForm] = useState<CustomerFormState | null>(null); const [errors, setErrors] = useState<CustomerFormErrors>({}); const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false)
  useEffect(() => { if (lenderCode) void lenderService.get(lenderCode).then((item) => setForm(customerToForm(item as unknown as Parameters<typeof customerToForm>[0]))).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load lender.')) }, [lenderCode])
  if (!lenderCode) return <Navigate replace to={routePaths.lenders} />
  function change<K extends keyof CustomerFormState>(field: K, value: CustomerFormState[K]) { setForm((current) => current ? { ...current, [field]: value } : current); setErrors((current) => ({ ...current, [field]: undefined })) }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!form) return; const next = validateCustomerForm(form); if (Object.keys(next).length) { setErrors(next); return } setSaving(true); try { await lenderService.update(lenderCode, formToCustomerPayload(form)); navigate(routePaths.lenderDetail(lenderCode)) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update lender.') } finally { setSaving(false) } }
  return <section className="page lender-update-page"><SectionHeader title="Edit Lender" subtitle={lenderCode} />{error && <Alert message={error} onDismiss={() => setError(null)} title="Lender action failed" tone="danger" />}{form ? <CustomerForm errors={errors} formDescription="Changes update the shared customer and lender identity." formTitle="Edit lender details" isSaving={saving} mode="edit" onCancel={() => navigate(routePaths.lenderDetail(lenderCode))} onChange={change} onSubmit={submit} value={form} /> : !error && <LoadingState rows={5} />}</section>
}
