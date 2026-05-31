import { Alert } from '../../components/feedback'
import { Card } from '../../components/molecules'

type TenantResolveErrorPageProps = {
  subdomain: string | null
  error: string
}

export function TenantResolveErrorPage({ subdomain, error }: TenantResolveErrorPageProps) {
  return (
    <main className="auth-shell">
      <Card title="Shop not available" description={`Subdomain ${subdomain ?? 'current host'} could not be verified.`}>
        <Alert tone="danger" title="Tenant resolver" message={error} />
      </Card>
    </main>
  )
}
