
export const planTypes = [
    'trial','basic','premium'
]as const

export type PlanType = (typeof planTypes)[number]

const planTypeSet = new Set<string>(planTypes)

export function isPlanType(value: string): value is PlanType {
    return planTypeSet.has(value)
}

export function isPremiumPlan(planType: PlanType) {
    return planType === 'premium'
}

export function isBasicPlan(planType: PlanType) {
    return planType === 'basic'
}

export function isTrialPlan(planType: PlanType) {
    return planType === 'trial'
}