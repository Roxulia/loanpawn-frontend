import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { Card } from '../../components/molecules'
import { useTenantSession } from '../../contexts/useTenantSession'
import {  type PlanType } from './plantypes'
import { usePlanType } from './usePlanType'
import { Button } from '../../components'

export function PackageRoute({
  children,
  plan_type,
}: {
  children: ReactNode
  plan_type: PlanType
}) {
  const location = useLocation()
  const { authStatus, isAuthenticated} = useTenantSession()
  const planFeatures = usePlanType()

  if (authStatus !== 'checking' && !isAuthenticated) {
    return <Navigate to={routePaths.login} replace state={{ from: location }} />
  }

  const allowed = planFeatures.hasPlan(plan_type)

  if (!allowed) {
    return (
      <section className="page">
        <Card title="Access denied" description="Upgrade your plan to access this feature.">
          <div className="status-pill">Plan Upgrade required</div>
          <Button variant="primary" onClick={() => window.location.href = "http://loanpawn.1morebit.tech:8000/login"}>
            Upgrade Plan
          </Button>
        </Card>
      </section>
    )
  }

  return children
}
