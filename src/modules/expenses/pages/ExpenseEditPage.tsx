import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Alert, LoadingState } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import type { ExpenseTypeOption } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { getNumberField, getStringField } from '../../finance/financeFormat'
import { ExpenseForm } from '../components/ExpenseForm'
import {
  emptyExpenseForm,
  expenseUpdateToPayload,
  validateExpenseForm,
  type ExpenseFormErrors,
  type ExpenseFormState,
} from '../components/expenseFormModel'

export function ExpenseEditPage() {
  const navigate = useNavigate()
  const { expenseCode = '' } = useParams()
  const [form, setForm] = useState<ExpenseFormState>(emptyExpenseForm)
  const [errors, setErrors] = useState<ExpenseFormErrors>({})
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([])
  const [updateKey, setUpdateKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!expenseCode) return
    let active = true

    Promise.all([
      tenantResourceService.getExpense(expenseCode),
      tenantResourceService.listExpenseTypes(),
    ]).then(([expense, types]) => {
      if (!active) return

      setExpenseTypes(types)
      setUpdateKey(getNumberField(expense, 'update_key', 'updateKey') ?? 0)
      setForm({
        account_id: String(expense.account_id ?? expense.accountId ?? ''),
        amount: expense.amount,
        amount_unit: 'UNIT',
        description: expense.description,
        expense_type_id: String(getNumberField(expense, 'expense_type_id', 'expenseTypeId') ?? ''),
        has_existing_image: Boolean(
          expense.has_image_reference
          ?? expense.hasImageReference
          ?? getStringField(expense, 'image_reference_url', 'imageReferenceUrl'),
        ),
        image_reference: null,
        remove_image_reference: false,
      })
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load expense.')
    }).finally(() => {
      if (active) setIsLoading(false)
    })

    return () => { active = false }
  }, [expenseCode])

  if (!expenseCode) return <Navigate replace to={routePaths.expenses} />

  function updateField<TField extends keyof ExpenseFormState>(field: TField, value: ExpenseFormState[TField]) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateExpenseForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const payload = expenseUpdateToPayload(form)
      payload.set('update_key', String(updateKey))
      await tenantResourceService.updateExpense(expenseCode, payload)
      navigate(routePaths.expenses, { state: { notice: 'Expense updated successfully.' } })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update expense.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page expense-edit-page">
      <SectionHeader title="Edit Expense" subtitle="Update expense details and reference information." />
      {isLoading
        ? <LoadingState rows={5} />
        : <ExpenseForm
          editing
          errors={errors}
          expenseTypes={expenseTypes}
          isLoadingExpenseTypes={false}
          isSaving={isSaving}
          onCancel={() => navigate(routePaths.expenses)}
          onChange={updateField}
          onSubmit={(event) => void handleSubmit(event)}
          operationAlert={error ? <Alert message={error} onDismiss={() => setError(null)} title="Expense action failed" tone="danger" /> : null}
          value={form}
        />}
    </section>
  )
}
