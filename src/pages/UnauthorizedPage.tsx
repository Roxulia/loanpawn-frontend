import { Link } from 'react-router'
import { routePaths } from '../app/routes/paths'
import { SecurityIcon } from '../components/icons/icon'

export function UnauthorizedPage() {
  return (
    <section className="page unauthorized-page" aria-labelledby="unauthorized-title">
      <div className="unauthorized-panel">
        <div className="unauthorized-panel__icon" aria-hidden="true">
          <SecurityIcon />
        </div>
        <div className="unauthorized-panel__content">
          <span className="unauthorized-panel__eyebrow">Restricted workspace</span>
          <h1 id="unauthorized-title">You don&apos;t have access to this page</h1>
          <p>Your signed-in account does not have the permission required to open this workspace.</p>
          <span className="unauthorized-panel__status">Permission required</span>
        </div>
        <Link className="ui-button ui-button--primary unauthorized-panel__action" to={routePaths.dashboard}>
          Back to dashboard
        </Link>
      </div>
    </section>
  )
}
