const ignoredSubdomains = new Set(['app', 'www'])
const defaultBaseDomain = 'loanpawn.1morebit.tech'

const baseDomain = (
  import.meta.env.VITE_PUBLIC_BASE_DOMAIN ?? defaultBaseDomain
).toLowerCase()

export function getTenantSubdomainFromHost(host: string) {
  const hostname = host.split(':')[0]?.toLowerCase() ?? ''

  if (!hostname || hostname === 'localhost' || isIpAddress(hostname)) {
    return null
  }

  if (!hostname.endsWith(`.${baseDomain}`)) {
    return null
  }

  const segments = hostname.split('.').filter(Boolean)
  const baseSegments = baseDomain.split('.').filter(Boolean)

  if (segments.length !== baseSegments.length + 1) {
    return null
  }

  const subdomain = segments[0]

  if (!subdomain || ignoredSubdomains.has(subdomain)) {
    return null
  }

  return subdomain
}

function isIpAddress(hostname: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')
}
