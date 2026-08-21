import { useSyncExternalStore } from 'react'
import { compatibilityStore } from './compatibilityStore'

export function useAppCompatibility() {
  const state = useSyncExternalStore(compatibilityStore.subscribe, compatibilityStore.getSnapshot)

  return {
    ...state,
    isReadOnly: state.status !== 'supported',
  }
}
