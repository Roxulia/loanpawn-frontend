import { useCallback, useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { Card, KeyValueList, SectionHeader } from '../../../components/molecules'
import { LocalizedText } from '../../../locales/UiLocale'
import { formatDate, formatMoney, getSlipCustomerName, getStatusTone } from '../slipFormat'
import { slipService, type LoanContractSlip, type SlipCollateralItem } from '../services/slipService'

export function SlipDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { slipNo } = useParams()
  const [slip, setSlip] = useState<LoanContractSlip | null>(null)
  const [notice, setNotice] = useState<string | null>(() => getRouteNotice(location.state))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSlip = useCallback(async (nextSlipNo: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await slipService.getSlip(nextSlipNo)
      setSlip(response)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load loan slip.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!slipNo?.trim()) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadSlip(slipNo)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadSlip, slipNo])

  useEffect(() => {
    if (getRouteNotice(location.state)) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  if (!slipNo?.trim()) {
    return <Navigate to={routePaths.slips} replace />
  }

  return (
    <section className="page">
      <SectionHeader
        title="Slip Detail"
        subtitle="Read-only loan contract information for lookup and audit."
        action={
          <Button onClick={() => navigate(routePaths.slips)} variant="secondary">
            Back
          </Button>
        }
      />

      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Loan slip created" tone="success" />}
      {error && <Alert message={error} onDismiss={() => setError(null)} title="Loan slip lookup failed" tone="danger" />}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : slip ? (
        <div className="workflow-stack">
          <Card
            title={slip.slip_no}
            description={slip.notes || 'No internal note recorded.'}
            action={<Badge tone={getStatusTone(slip.status)}>{slip.status}</Badge>}
          >
            <KeyValueList items={[
              { key: 'Customer', value: getSlipCustomerName(slip) },
              { key: 'Loan Amount', value: formatMoney(slip.loan_amount) },
              { key: 'Interest Rate', value: `${slip.interest_rate}%` },
              { key: 'Interest Type', value: slip.interest_type_name ?? '-' },
              { key: 'Created', value: formatDate(slip.created_at) },
              { key: 'Expire Date', value: formatDate(slip.expire_at) },
              { key: 'Expiry Quota', value: formatExpiry(slip.expiry_quota, slip.expiry_quota_type) },
            ]} />
          </Card>

          <Card title="Collateral Items" description={`${(slip.items ?? []).length} item${(slip.items ?? []).length === 1 ? '' : 's'}`}>
            {(slip.items ?? []).length === 0 ? <p className="muted"><LocalizedText text="No collateral items returned." /></p> : (
              <div className="workflow-stack">
                {(slip.items ?? []).map((item) => <SlipItemCard item={item} key={item.id} />)}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Alert message="Loan slip was not found." title="No slip" tone="warning" />
      )}
    </section>
  )
}

function SlipItemCard({ item }: { item: SlipCollateralItem }) {
  const isJewellery = item.type.toLowerCase() === 'jewellery'

  return (
    <section className="subform-panel">
      <header className="subform-panel__header">
        <strong>{item.name}</strong>
        <Badge tone={item.item_status === 'active' ? 'success' : 'info'}>{item.item_status ?? '-'}</Badge>
      </header>
      <KeyValueList items={[
        { key: 'Type', value: item.type },
        { key: 'Brand', value: item.brand_name ?? '-' },
        { key: 'Quantity', value: item.quantity ?? '-' },
        { key: 'Estimated Value', value: formatMoney(item.estimated_value) },
        { key: 'Minimum Retail Price', value: formatMoney(item.minimum_retail_price) },
        { key: 'Description', value: item.description || '-' },
        ...(isJewellery ? [
          { key: 'Material', value: item.material_type_name ?? '-' },
          { key: 'Kyat', value: item.kyat ?? '-' },
          { key: 'Pal', value: item.pal ?? '-' },
          { key: 'Yway', value: item.yway ?? '-' },
        ] : []),
      ]} />
    </section>
  )
}

function formatExpiry(quota?: number, type?: string) {
  if (!quota || !type) {
    return '-'
  }

  return `${quota} ${type}${quota === 1 ? '' : 's'}`
}

function getRouteNotice(state: unknown) {
  if (typeof state === 'object' && state && 'notice' in state && typeof state.notice === 'string') {
    return state.notice
  }

  return null
}
