import { TenantSessionProvider } from '../../contexts/TenantSessionProvider'
import { AuthenticationGate } from './AuthenticationGate'
import { RouteProvider } from './RouteProvider'
import { TenantLicenseGate } from './TenantLicenseGate'
import { TenantResolverGate } from './TenantResolverGate'
import { TenantNotificationProvider } from '../../modules/notifications/TenantNotificationProvider'
import { AppCompatibilityProvider } from '../../modules/appCompatibility'

export function AppProviders() {
  return (
    <TenantSessionProvider>
      <AppCompatibilityProvider>
        <TenantResolverGate>
          <AuthenticationGate>
            <TenantNotificationProvider>
              <TenantLicenseGate>
                <RouteProvider />
              </TenantLicenseGate>
            </TenantNotificationProvider>
          </AuthenticationGate>
        </TenantResolverGate>
      </AppCompatibilityProvider>
    </TenantSessionProvider>
  )
}
