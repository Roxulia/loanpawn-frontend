import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { Card, KeyValueList, SectionHeader } from '../../../components/molecules'
import { formatDate, formatMoney, getItemStatus, getItemType, getStatusTone } from '../collateralFormat'
import { collateralService } from '../services/collateralService'
import type { CollateralItem } from '../types'

export function CollateralDetailPage() {
  const navigate = useNavigate()
  const { itemId } = useParams()
  const itemCode = itemId?.trim() ?? ''
  const [item, setItem] = useState<CollateralItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadItem = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await collateralService.getCollateral(code)
      setItem(response.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load collateral item.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!itemCode) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadItem(itemCode)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [itemCode, loadItem])

  if (!itemCode) {
    return <Navigate to={routePaths.collateral} replace />
  }

  return (
    <section className="page">
      <SectionHeader
        title="Collateral Detail"
        subtitle="Read-only collateral information for audit and lookup."
        action={
          <Button onClick={() => navigate(routePaths.collateral)} variant="secondary">
            Back
          </Button>
        }
      />

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Collateral lookup failed" tone="danger" />}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : item ? (
        <>
          <Card
            title={item.name}
            description={item.description || 'No description recorded.'}
            action={<Badge tone={getStatusTone(getItemStatus(item))}>{getItemStatus(item)}</Badge>}
          >
            <KeyValueList
              items={[
                { key: 'Type', value: getItemType(item) },
                { key: 'Brand', value: item.brand_name ?? item.brandName ?? '-' },
                { key: 'Quantity', value: item.quantity ?? '-' },
                { key: 'Estimated Value', value: formatMoney(item.estimated_value ?? item.estimatedValue) },
                { key: 'Minimum Retail Price', value: formatMoney(item.minimum_retail_price ?? item.minimumRetailPrice) },
                { key: 'Loan Contract ID', value: item.loan_contract_id ?? item.loanContractId ?? '-' },
                { key: 'Created', value: formatDate(item.createdAt ?? item.created_at) },
                { key: 'Updated', value: formatDate(item.updatedAt ?? item.updated_at) },
              ]}
            />
          </Card>

          {getItemType(item).toLowerCase() === 'jewellery' && (
            <Card title="Jewellery Details">
              <KeyValueList
                items={[
                  { key: 'Material', value: item.material_type_name ?? item.materialTypeName ?? '-' },
                  { key: 'Kyat', value: item.kyat ?? '-' },
                  { key: 'Pal', value: item.pal ?? '-' },
                  { key: 'Yway', value: item.yway ?? '-' },
                  { key: 'Contains Gemstones', value: item.contains_gemstones ?? item.containsGemstones ? 'Yes' : 'No' },
                  { key: 'Gemstone Details', value: formatGemstoneDetails(item.gemstone_details ?? item.gemstoneDetails) },
                ]}
              />
            </Card>
          )}
        </>
      ) : (
        <Alert message="Collateral item was not found." title="No item" tone="warning" />
      )}
    </section>
  )
}

function formatGemstoneDetails(value: unknown) {
  if (!value) {
    return '-'
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '-'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}
