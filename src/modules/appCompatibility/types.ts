export type AppCompatibilityStatus = 'checking' | 'supported' | 'unsupported' | 'unavailable'

export type AppCompatibilityResponse = {
  installed_version: string | null
  minimum_supported_version: string
  is_supported: boolean
}

export type AppCompatibilityState = {
  installedVersion: string
  minimumSupportedVersion: string | null
  status: AppCompatibilityStatus
}
