import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Badge } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { routePaths } from '../../../app/routes/paths'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { createIdempotencyKey } from '../../../services/http/idempotency'
import type { ExpenseTypeOption } from '../../../dataobjects/tenant/finance'
import { ExpenseForm } from '../components/ExpenseForm'
import {
  emptyExpenseForm,
  expenseFormToPayload,
  validateExpenseForm,
  type ExpenseFormErrors,
  type ExpenseFormState,
} from '../components/expenseFormModel'

export function ExpenseCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<ExpenseFormState>(emptyExpenseForm)
  const [errors, setErrors] = useState<ExpenseFormErrors>({})
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([])
  const [isLoadingExpenseTypes, setIsLoadingExpenseTypes] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const createIdempotencyKeyRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoadingExpenseTypes(true)

    tenantResourceService.listExpenseTypes()
      .then((response) => {
        if (isMounted) {
          setExpenseTypes(response)
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load expense types.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingExpenseTypes(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  function updateField<TField extends keyof ExpenseFormState>(field: TField, value: ExpenseFormState[TField]) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (createIdempotencyKeyRef.current !== null) {
      return
    }

    const nextErrors = validateExpenseForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setError(null)
    createIdempotencyKeyRef.current = createIdempotencyKey()

    try {
      await tenantResourceService.createExpense(expenseFormToPayload(form), {
        idempotencyKey: createIdempotencyKeyRef.current,
      })
      navigate(routePaths.expenses)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create expense.')
    } finally {
      createIdempotencyKeyRef.current = null
      setIsSaving(false)
    }
  }

  return (
    <section className="page">
      <SectionHeader
        title="Add Expense"
        subtitle="Record a shop expense and create its outgoing accounting entry."
        action={<Badge tone="warning">Outgoing</Badge>}
      />

      <ExpenseForm
        errors={errors}
        expenseTypes={expenseTypes}
        isLoadingExpenseTypes={isLoadingExpenseTypes}
        isSaving={isSaving}
        onCancel={() => navigate(routePaths.expenses)}
        onChange={updateField}
        onSubmit={(event) => void handleSubmit(event)}
        operationAlert={error ? <Alert message={error} onDismiss={() => setError(null)} title="Expense action failed" tone="danger" /> : null}
        value={form}
      />
    </section>
  )
}
