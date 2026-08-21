import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { appCompatibilityService } from './appCompatibilityService'
import { compatibilityStore } from './compatibilityStore'

export function AppCompatibilityProvider({ children }: { children: ReactNode }) {
  const isChecking = useRef(false)

  const checkCompatibility = useCallback(async () => {
    if (isChecking.current) return

    if (!navigator.onLine) {
      compatibilityStore.setState({
        installedVersion: __APP_VERSION__,
        minimumSupportedVersion: compatibilityStore.getSnapshot().minimumSupportedVersion,
        status: 'unavailable',
      })
      return
    }

    isChecking.current = true

    try {
      await appCompatibilityService.checkAndStore()
    } catch {
      compatibilityStore.setState({
        installedVersion: __APP_VERSION__,
        minimumSupportedVersion: compatibilityStore.getSnapshot().minimumSupportedVersion,
        status: 'unavailable',
      })
    } finally {
      isChecking.current = false
    }
  }, [])

  useEffect(() => {
    void checkCompatibility()

    const handleOnline = () => void checkCompatibility()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkCompatibility()
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkCompatibility])

  return children
}
