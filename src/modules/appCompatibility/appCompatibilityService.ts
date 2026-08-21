import { apiClient } from '../../services/http/apiClient'
import { compatibilityStore } from './compatibilityStore'
import type { AppCompatibilityResponse } from './types'

export const appCompatibilityService = {
  check() {
    return apiClient.get<AppCompatibilityResponse>('/app/compatibility')
  },

  async checkAndStore() {
    const response = await this.check()

    compatibilityStore.setState({
      installedVersion: __APP_VERSION__,
      minimumSupportedVersion: response.minimum_supported_version,
      status: response.is_supported ? 'supported' : 'unsupported',
    })
  },
}
