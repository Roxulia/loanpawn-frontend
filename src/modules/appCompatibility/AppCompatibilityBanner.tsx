import { Button } from '../../components/atoms'
import { useUiLocale } from '../../locales/UiLocale'
import { refreshToLatestAppVersion } from '../../pwa/registerServiceWorker'
import { appCompatibilityService } from './appCompatibilityService'
import { compatibilityStore } from './compatibilityStore'
import { useAppCompatibility } from './useAppCompatibility'

type BannerProps = ReturnType<typeof useAppCompatibility> & {
  onAction: () => void
}

export function AppCompatibilityBanner() {
  const compatibility = useAppCompatibility()

  if (compatibility.status === 'supported') return null

  const onAction = compatibility.status === 'unsupported'
    ? () => void refreshToLatestAppVersion()
    : () => void retryCompatibilityCheck()

  return (
    <>
      <DesktopAppCompatibilityBanner {...compatibility} onAction={onAction} />
      <MobileAppCompatibilityBanner {...compatibility} onAction={onAction} />
    </>
  )
}

function DesktopAppCompatibilityBanner(props: BannerProps) {
  return <CompatibilityBannerContent className="app-compatibility-banner--desktop" {...props} />
}

function MobileAppCompatibilityBanner(props: BannerProps) {
  return <CompatibilityBannerContent className="app-compatibility-banner--mobile" {...props} />
}

function CompatibilityBannerContent({ className, installedVersion, minimumSupportedVersion, onAction, status }: BannerProps & { className: string }) {
  const { t } = useUiLocale()
  const isUnsupported = status === 'unsupported'
  const title = status === 'checking' ? 'Checking app version' : isUnsupported ? 'App update required' : 'Read-only mode'
  const message = isUnsupported
    ? `${t('Installed version')} ${installedVersion}. ${t('Minimum supported version')} ${minimumSupportedVersion ?? '—'}.`
    : status === 'checking'
      ? t('Changes are disabled until the app version is confirmed.')
      : t('The server cannot confirm this app version. You can view data, but changes are disabled.')

  return (
    <section className={`app-compatibility-banner ${className}`} role="status">
      <div className="app-compatibility-banner__content">
        <strong>{t(title)}</strong>
        <span>{message}</span>
      </div>
      {status !== 'checking' && (
        <Button onClick={onAction} variant={isUnsupported ? 'primary' : 'secondary'}>
          {isUnsupported ? 'Refresh App' : 'Retry'}
        </Button>
      )}
    </section>
  )
}

async function retryCompatibilityCheck() {
  compatibilityStore.setState({
    installedVersion: __APP_VERSION__,
    minimumSupportedVersion: compatibilityStore.getSnapshot().minimumSupportedVersion,
    status: 'checking',
  })

  try {
    await appCompatibilityService.checkAndStore()
  } catch {
    compatibilityStore.setState({
      installedVersion: __APP_VERSION__,
      minimumSupportedVersion: compatibilityStore.getSnapshot().minimumSupportedVersion,
      status: 'unavailable',
    })
  }
}
