import { Navigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'

export function SettingsPage() {
  return <Navigate replace to={routePaths.settingsPersonal} />
}
