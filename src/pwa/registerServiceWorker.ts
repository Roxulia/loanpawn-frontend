import { registerSW } from 'virtual:pwa-register'

const pwaReloadStorageKey = `lonepawn-pwa-reloaded-${__APP_BUILD_ID__}`

function shouldReloadForUpdate() {
  try {
    if (sessionStorage.getItem(pwaReloadStorageKey) === 'true') {
      return false
    }

    sessionStorage.setItem(pwaReloadStorageKey, 'true')
  } catch {
    return true
  }

  return true
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedReload() {
      if (!shouldReloadForUpdate()) {
        return
      }

      window.location.reload()
    },
    onRegisterError(error) {
      console.error('PWA service worker registration failed', error)
    },
  })
}
