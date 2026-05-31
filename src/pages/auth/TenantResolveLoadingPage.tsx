import { Card } from '../../components/molecules'
import { LoadingState } from '../../components/feedback'

type TenantResolveLoadingPageProps = {
  subdomain: string | null
}

export function TenantResolveLoadingPage({ subdomain }: TenantResolveLoadingPageProps) {
  return (
    <main className="auth-shell">
      <Card title="Checking shop" description={`Resolving tenant subdomain ${subdomain ?? 'current host'}.`}>
        <LoadingState rows={3} />
      </Card>
    </main>
  )
}
