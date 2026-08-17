import { TenantSessionProvider } from '../../contexts/TenantSessionProvider'
import { AuthenticationGate } from './AuthenticationGate'
import { RouteProvider } from './RouteProvider'
import { TenantLicenseGate } from './TenantLicenseGate'
import { TenantResolverGate } from './TenantResolverGate'
import { TenantNotificationProvider } from '../../modules/notifications/TenantNotificationProvider'

export function AppProviders() {
  return (
    <TenantSessionProvider>
      <TenantResolverGate>
        <AuthenticationGate>
          <TenantNotificationProvider>
            <TenantLicenseGate>
              <RouteProvider />
            </TenantLicenseGate>
          </TenantNotificationProvider>
        </AuthenticationGate>
      </TenantResolverGate>
    </TenantSessionProvider>
  )
}
