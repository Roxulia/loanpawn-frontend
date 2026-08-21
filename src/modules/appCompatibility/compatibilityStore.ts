import type { AppCompatibilityState } from './types'

const listeners = new Set<() => void>()

let state: AppCompatibilityState = {
  installedVersion: __APP_VERSION__,
  minimumSupportedVersion: null,
  status: 'checking',
}

export const compatibilityStore = {
  getSnapshot() {
    return state
  },

  setState(nextState: AppCompatibilityState) {
    state = nextState
    listeners.forEach((listener) => listener())
  },

  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
