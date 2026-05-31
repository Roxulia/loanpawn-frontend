import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Badge } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { routePaths } from '../../../app/routes/paths'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { createIdempotencyKey } from '../../../services/http/idempotency'
import { DebtForm } from '../components/DebtForm'
import {
  debtFormToPayload,
  emptyDebtForm,
  validateDebtForm,
  type DebtFormErrors,
  type DebtFormState,
} from '../components/debtFormModel'

export function DebtCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<DebtFormState>(emptyDebtForm)
  const [errors, setErrors] = useState<DebtFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const createIdempotencyKeyRef = useRef<string | null>(null)

  function updateField(field: keyof DebtFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (createIdempotencyKeyRef.current !== null) {
      return
    }

    const nextErrors = validateDebtForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setError(null)
    createIdempotencyKeyRef.current = createIdempotencyKey()

    try {
      await tenantResourceService.createDebt(debtFormToPayload(form), {
        idempotencyKey: createIdempotencyKeyRef.current,
      })
      setForm(emptyDebtForm)
      setErrors({})
      navigate(routePaths.debts)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create debt.')
    } finally {
      createIdempotencyKeyRef.current = null
      setIsSaving(false)
    }
  }

  return (
    <section className="page">
      <SectionHeader
        title="Add Debt"
        subtitle="Create a debt record for unpaid interest or another tenant obligation."
        action={<Badge tone="warning">Debt</Badge>}
      />

      <DebtForm
        errors={errors}
        isSaving={isSaving}
        onCancel={() => navigate(routePaths.debts)}
        onChange={updateField}
        onSubmit={(event) => void handleSubmit(event)}
        operationAlert={error ? <Alert message={error} onDismiss={() => setError(null)} title="Debt action failed" tone="danger" /> : null}
        value={form}
      />
    </section>
  )
}
