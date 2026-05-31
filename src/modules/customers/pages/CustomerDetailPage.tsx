import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { Card, KeyValueList, SectionHeader } from '../../../components/molecules'
import { formatCustomerDeletedState, formatValue, getTrustScore, getTrustTone } from '../customerFormat'
import { customerService, type TenantCustomer } from '../services/customerService'

export function CustomerDetailPage() {
  const navigate = useNavigate()
  const { customerId } = useParams()
  const customerCode = customerId?.trim() ?? ''
  const [customer, setCustomer] = useState<TenantCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCustomer = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await customerService.getCustomer(code)
      setCustomer(response.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load customer.')
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

  return (
    <section className="page">
      <SectionHeader
        title="Customer Detail"
        subtitle="Read-only customer profile for lookup and audit."
        action={
          <div className="row-actions">
            <Button onClick={() => navigate(routePaths.customers)} variant="secondary">
              Back
            </Button>
            <Button onClick={() => navigate(routePaths.customerEdit(customerCode))} variant="primary">
              Edit
            </Button>
          </div>
        }
      />

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Customer lookup failed" tone="danger" />}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : customer ? (
        <Card
          title={customer.name}
          description={customer.note || 'No internal note recorded.'}
          action={<Badge tone={getTrustTone(getTrustScore(customer))}>Trust {getTrustScore(customer)}</Badge>}
        >
          <KeyValueList
            items={[
              { key: 'Phone', value: formatValue(customer.phone) },
              { key: 'Email', value: formatValue(customer.email) },
              { key: 'Address', value: formatValue(customer.address) },
              { key: 'Status', value: formatCustomerDeletedState(customer) },
              { key: 'Created By', value: formatValue(customer.createdBy ?? customer.created_by) },
              { key: 'Deleted At', value: formatValue(customer.deletedAt ?? customer.deleted_at) },
            ]}
          />
        </Card>
      ) : (
        <Alert message="Customer was not found." title="No customer" tone="warning" />
      )}
    </section>
  )
}
