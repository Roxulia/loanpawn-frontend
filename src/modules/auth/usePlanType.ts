import { useTenantSession } from '../../contexts/useTenantSession'
import { isPlanType,isBasicPlan,isPremiumPlan,isTrialPlan, type PlanType } from './plantypes'

export function usePlanType() {
  const { tenantResolution} = useTenantSession()
  const currentPlan = tenantResolution.tenant?.tenant_license?.plan_type
  const plan: PlanType | null = currentPlan && isPlanType(currentPlan) ? currentPlan : null

  return {
    currentPlan: plan,
    isBasicPlan: () => plan !== null && isBasicPlan(plan),
    isPremiumPlan: () => plan !== null && isPremiumPlan(plan),
    isTrialPlan: () => plan !== null && isTrialPlan(plan),
    hasPlan: (requiredPlan: PlanType) => plan === requiredPlan
  }
}
