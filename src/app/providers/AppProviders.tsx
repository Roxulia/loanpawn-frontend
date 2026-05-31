import { TenantSessionProvider } from '../../contexts/TenantSessionProvider'
import { AuthenticationGate } from './AuthenticationGate'
import { RouteProvider } from './RouteProvider'
import { TenantResolverGate } from './TenantResolverGate'

export function AppProviders() {
  return (
    <TenantSessionProvider>
      <TenantResolverGate>
        <AuthenticationGate>
          <RouteProvider />
        </AuthenticationGate>
      </TenantResolverGate>
    </TenantSessionProvider>
  )
}
