import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from 'axios'

const defaultBaseUrl = 'https://loanpawn.1morebit.tech/api'
const csrfCookiePath = '/sanctum/csrf-cookie'

type RequestOptions = Omit<AxiosRequestConfig, 'data' | 'headers' | 'url' | 'method'> & {
  body?: unknown
  headers?: Record<string, string>
  idempotencyKey?: string
  method?: AxiosRequestConfig['method']
  token?: string
  tenantCode?: string
}

export class ApiClient {
  private readonly client
  private csrfRequest: Promise<void> | null = null

  constructor(baseURL = import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl) {
    this.client = axios.create({
      baseURL,
      headers: {
        Accept: 'application/json',
      },
      withCredentials: true,
      withXSRFToken: true,
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',
    })
  }

  async get<TData>(path: string, options: RequestOptions = {}) {
    return this.request<TData>(path, { ...options, method: 'GET' })
  }

  async post<TData>(path: string, body?: unknown, options: RequestOptions = {}) {
    return this.request<TData>(path, { ...options, body, method: 'POST' })
  }

  async put<TData>(path: string, body?: unknown, options: RequestOptions = {}) {
    return this.request<TData>(path, { ...options, body, method: 'PUT' })
  }

  async delete<TData>(path: string, options: RequestOptions = {}) {
    return this.request<TData>(path, { ...options, method: 'DELETE' })
  }

  async download(path: string, options: RequestOptions = {}) {
    return this.request<Blob>(path, { ...options, method: 'GET', responseType: 'blob' })
  }

  private async request<TData>(path: string, options: RequestOptions): Promise<TData> {
    if (this.requiresCsrf(options)) {
      await this.ensureCsrfCookie()
    }

    try {
      const response = await this.client.request<TData>({
        ...options,
        data: options.body,
        headers: this.buildHeaders(options),
        method: options.method,
        url: path,
        withCredentials: options.withCredentials ?? true,
      })

      return response.data
    } catch (error) {
      throw this.normalizeError(error)
    }
  }

  private async ensureCsrfCookie() {
    if (!this.csrfRequest) {
      this.csrfRequest = this.client.get(this.originUrl(csrfCookiePath), {
        withCredentials: true,
      }).then(() => undefined)
        .finally(() => {
          this.csrfRequest = null
        })
    }

    return this.csrfRequest
  }

  private buildHeaders(options: RequestOptions) {
    const headers = AxiosHeaders.from(options.headers)

    if (options.token) {
      headers.set('Authorization', `Bearer ${options.token}`)
    }

    if (options.tenantCode) {
      headers.set('X-Tenant-Code', options.tenantCode)
    }

    if (options.idempotencyKey) {
      headers.set('Idempotency-Key', options.idempotencyKey)
    }

    return headers
  }

  private requiresCsrf(options: RequestOptions) {
    const method = options.method?.toUpperCase() ?? 'GET'

    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && options.withCredentials !== false
  }

  private originUrl(path: string) {
    return `${this.client.defaults.baseURL?.replace(/\/api\/?$/, '') ?? ''}${path}`
  }

  private normalizeError(error: unknown) {
    if (error instanceof AxiosError) {
      const data = error.response?.data as { message?: string } | undefined

      return new Error(data?.message ?? error.message)
    }

    return error instanceof Error ? error : new Error('Request failed.')
  }
}

export const apiClient = new ApiClient()
