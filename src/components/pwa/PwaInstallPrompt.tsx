import { useEffect, useState } from 'react'
import { Button } from '../atoms'
import { useTenantSession } from '../../contexts/useTenantSession'

const dismissedKey = 'lonepawn.pwaInstallPromptDismissed.v1'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaInstallPrompt() {
  const { isAuthenticated } = useTenantSession()
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isRunningStandalone)
  const [isDismissed, setIsDismissed] = useState(readDismissedState)
  const isIos = isIosBrowser()

  useEffect(() => {
    function captureInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    function markInstalled() {
      setIsInstalled(true)
      setInstallPrompt(null)
      clearDismissedState()
    }

    window.addEventListener('beforeinstallprompt', captureInstallPrompt)
    window.addEventListener('appinstalled', markInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
      window.removeEventListener('appinstalled', markInstalled)
    }
  }, [])

  if (!isAuthenticated || isInstalled || isDismissed || (!installPrompt && !isIos)) {
    return null
  }

  async function install() {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)

    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
      clearDismissedState()
      return
    }

    dismiss()
  }

  function dismiss() {
    writeDismissedState()
    setIsDismissed(true)
  }

  const promptProps = { isIos, install, dismiss }

  return (
    <>
      <InstallPromptCard className="pwa-install-prompt--desktop" {...promptProps} />
      <InstallPromptCard className="pwa-install-prompt--mobile" {...promptProps} />
    </>
  )
}

function InstallPromptCard({
  className,
  dismiss,
  install,
  isIos,
}: {
  className: string
  dismiss: () => void
  install: () => Promise<void>
  isIos: boolean
}) {
  return (
    <section
      aria-describedby={`${className}-description`}
      aria-labelledby={`${className}-title`}
      aria-modal="true"
      className={`pwa-install-prompt ${className}`}
      role="dialog"
    >
      <div className="pwa-install-prompt__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
        </svg>
      </div>
      <div className="pwa-install-prompt__content">
        <h2 id={`${className}-title`}>Add LonePawn to your home screen</h2>
        <p id={`${className}-description`}>
          {isIos
            ? 'Open the browser Share menu, then choose “Add to Home Screen”.'
            : 'Install the app for faster access and a full-screen workspace.'}
        </p>
      </div>
      <div className="pwa-install-prompt__actions">
        {!isIos && <Button onClick={() => void install()} variant="primary">Add to home page</Button>}
        <Button onClick={dismiss} variant="ghost">Not now</Button>
      </div>
    </section>
  )
}

function isRunningStandalone() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(display-mode: standalone)').matches
    || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
}

function isIosBrowser() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
}

function readDismissedState() {
  try {
    return window.sessionStorage.getItem(dismissedKey) === 'true'
  } catch {
    return false
  }
}

function writeDismissedState() {
  try {
    window.sessionStorage.setItem(dismissedKey, 'true')
  } catch {
    // Storage can be unavailable in private browsing; local state still dismisses the prompt.
  }
}

function clearDismissedState() {
  try {
    window.sessionStorage.removeItem(dismissedKey)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
