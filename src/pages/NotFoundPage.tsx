import { Link } from 'react-router'
import { routePaths } from '../app/routes/paths'
import { Card } from '../components/molecules'

export function NotFoundPage() {
  return (
    <main className="auth-shell">
      <Card title="Page not found" description="The requested LonePawn workspace route does not exist.">
        <Link className="ui-button ui-button--primary" to={routePaths.dashboard}>
          Back to dashboard
        </Link>
      </Card>
    </main>
  )
}
