import { useTenantSession } from '../../contexts/useTenantSession'

export function useFeatures() {
  const { tenantResolution } = useTenantSession()

  const hasEnabledFeature = (featureCode: string) => {
    const feature = tenantResolution.status === 'resolved'
      ? tenantResolution.tenant.tenant_features?.[featureCode]
      : null

    return Boolean(feature?.is_active && feature.is_enabled)
  }

  return {
    hasEnabledFeature,
    hasAllEnabledFeatures: (featureCodes: string[]) => featureCodes.every(hasEnabledFeature),
  }
}
