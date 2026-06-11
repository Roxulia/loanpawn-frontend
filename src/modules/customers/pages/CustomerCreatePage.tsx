import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Alert } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { CustomerForm } from '../components/customerForm'
import {
  emptyCustomerForm,
  formToCustomerPayload,
  validateCustomerForm,
  type CustomerFormErrors,
  type CustomerFormState,
} from '../components/customerFormModel'
import { customerService } from '../services/customerService'

export function CustomerCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm)
  const [errors, setErrors] = useState<CustomerFormErrors>({})
  const [pageError, setPageError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function updateFormField<K extends keyof CustomerFormState>(field: K, value: CustomerFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateCustomerForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setPageError(null)

    try {
      await customerService.createCustomer(formToCustomerPayload(form))
      navigate(routePaths.customers, { state: { notice: 'Customer created successfully.' } })
    } catch (saveError) {
      setPageError(saveError instanceof Error ? saveError.message : 'Unable to create customer.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page">
      <SectionHeader
        title="Add Customer"
        subtitle="Create a customer record before using it in loan slip workflows."
      />

      <CustomerForm
        errors={errors}
        isSaving={isSaving}
        mode="create"
        onCancel={() => navigate(routePaths.customers)}
        onChange={updateFormField}
        onSubmit={handleSubmit}
        operationAlert={
          pageError ? (
            <Alert message={pageError} onDismiss={() => setPageError(null)} title="Create failed" tone="danger" />
          ) : null
        }
        value={form}
      />
    </section>
  )
}
