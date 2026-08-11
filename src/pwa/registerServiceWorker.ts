import { registerSW } from 'virtual:pwa-register'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,

    onRegisteredSW(_swUrl, registration) {
      if (!registration) {
        return
      }

      const checkForUpdate = async () => {
        if (!navigator.onLine) {
          return
        }

        try {
          await registration.update()
        } catch (error) {
          console.error('PWA update check failed', error)
        }
      }

      // Check whenever the application starts.
      void checkForUpdate()

      // Important for installed PWAs:
      // opening the app may just foreground the existing window.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          void checkForUpdate()
        }
      })
    },

    onRegisterError(error) {
      console.error('PWA service worker registration failed', error)
    },
  })
}