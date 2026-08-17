import axios from 'axios'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

type EchoSession = {
  tenantCode: string
  token?: string
}

export function createTenantEcho(session: EchoSession) {
  const key = import.meta.env.VITE_REVERB_APP_KEY
  const host = import.meta.env.VITE_REVERB_HOST

  if (!key || !host) {
    return null
  }

  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https'
  const forceTLS = scheme === 'https'
  const port = Number(import.meta.env.VITE_REVERB_PORT ?? (forceTLS ? 443 : 80))
  const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL ?? 'https://loanpawn.1morebit.tech/api')
  const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, '')
  const authEndpoint = `${backendOrigin}/broadcasting/auth`
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Tenant-Code': session.tenantCode,
  }

  if (session.token) {
    headers.Authorization = `Bearer ${session.token}`
  }

  return new Echo<'reverb'>({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: ['ws', 'wss'],
    authEndpoint,
    auth: { headers },
    client: new Pusher(key, {
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS,
      enabledTransports: ['ws', 'wss'],
      cluster: '',
      channelAuthorization: {
        customHandler: (params, callback) => {
          void axios.get(`${backendOrigin}/sanctum/csrf-cookie`, { withCredentials: true })
            .then(() => axios.post<{ auth: string; channel_data?: string }>(
              authEndpoint,
              new URLSearchParams({
                socket_id: params.socketId,
                channel_name: params.channelName,
              }),
              {
                headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
                withCredentials: true,
                withXSRFToken: true,
              },
            ))
            .then((response) => callback(null, response.data))
            .catch((error: unknown) => callback(
              error instanceof Error ? error : new Error('Channel authorization failed.'),
              null,
            ))
        },
      },
    }),
  })
}
