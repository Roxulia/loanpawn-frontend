import { TenantSessionProvider } from '../../contexts/TenantSessionProvider'
import { AuthenticationGate } from './AuthenticationGate'
import { RouteProvider } from './RouteProvider'
import { TenantLicenseGate } from './TenantLicenseGate'
import { TenantResolverGate } from './TenantResolverGate'

export function AppProviders() {
  return (
    <TenantSessionProvider>
      <TenantResolverGate>
        <AuthenticationGate>
          <TenantLicenseGate>
            <RouteProvider />
          </TenantLicenseGate>
        </AuthenticationGate>
      </TenantResolverGate>
    </TenantSessionProvider>
  )
}
