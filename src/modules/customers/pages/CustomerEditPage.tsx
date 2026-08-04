import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Alert, LoadingState } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { CustomerForm } from '../components/customerForm'
import {
  customerToForm,
  emptyCustomerForm,
  formToCustomerPayload,
  validateCustomerForm,
  type CustomerFormErrors,
  type CustomerFormState,
} from '../components/customerFormModel'
import { customerService } from '../services/customerService'

export function CustomerEditPage() {
  const navigate = useNavigate()
  const { customerId } = useParams()
  const customerCode = customerId?.trim() ?? ''
  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm)
  const [errors, setErrors] = useState<CustomerFormErrors>({})
  const [pageError, setPageError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadCustomer = useCallback(async (code: string) => {
    setIsLoading(true)
    setPageError(null)

    try {
      const response = await customerService.getCustomer(code)
      setForm(customerToForm(response))
    } catch (loadError) {
      setPageError(loadError instanceof Error ? loadError.message : 'Unable to load customer.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!customerCode) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadCustomer(customerCode)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [customerCode, loadCustomer])

  if (!customerCode) {
    return <Navigate to={routePaths.customers} replace />
  }

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
      await customerService.updateCustomer(customerCode, formToCustomerPayload(form))
      navigate(routePaths.customers, {
        state: {
          notice: {
            message: 'Customer updated successfully.',
            title: 'Customer updated',
          },
        },
      })
    } catch (saveError) {
      setPageError(saveError instanceof Error ? saveError.message : 'Unable to update customer.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page">
      <SectionHeader
        title="Edit Customer"
        subtitle="Update contact details, trust score, and internal notes."
      />

      {isLoading ? (
        <>
          {pageError && <Alert message={pageError} onDismiss={() => setPageError(null)} title="Customer action failed" tone="danger" />}
          <LoadingState rows={5} />
        </>
      ) : (
        <CustomerForm
          errors={errors}
          isSaving={isSaving}
          mode="edit"
          onCancel={() => navigate(routePaths.customers)}
          onChange={updateFormField}
          onSubmit={handleSubmit}
          operationAlert={
            pageError ? (
              <Alert message={pageError} onDismiss={() => setPageError(null)} title="Customer action failed" tone="danger" />
            ) : null
          }
          value={form}
        />
      )}
    </section>
  )
}
