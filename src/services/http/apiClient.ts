import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from 'axios'
import {
  ApiError,
  type ApiEnvelope,
  type ApiErrorData,
  type MessageResponse,
  type ValidationErrors,
} from '../../dataobjects/common/api'

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

  async postMessage(path: string, body?: unknown, options: RequestOptions = {}) {
    return this.requestMessage(path, { ...options, body, method: 'POST' })
  }

  async put<TData>(path: string, body?: unknown, options: RequestOptions = {}) {
    return this.request<TData>(path, { ...options, body, method: 'PUT' })
  }

  async putMessage(path: string, body?: unknown, options: RequestOptions = {}) {
    return this.requestMessage(path, { ...options, body, method: 'PUT' })
  }

  async delete<TData>(path: string, options: RequestOptions = {}) {
    return this.request<TData>(path, { ...options, method: 'DELETE' })
  }

  async deleteMessage(path: string, options: RequestOptions = {}) {
    return this.requestMessage(path, { ...options, method: 'DELETE' })
  }

  async download(path: string, options: RequestOptions = {}) {
    return this.request<Blob>(path, { ...options, method: 'GET', responseType: 'blob' })
  }

  private async request<TData>(path: string, options: RequestOptions): Promise<TData> {
    if (this.requiresCsrf(options)) {
      await this.ensureCsrfCookie()
    }

    try {
      const response = await this.client.request<TData | ApiEnvelope<TData>>({
        ...options,
        data: options.body,
        headers: this.buildHeaders(options),
        method: options.method,
        url: path,
        withCredentials: options.withCredentials ?? true,
      })

      return this.unwrapResponse<TData>(response.data, options)
    } catch (error) {
      throw this.normalizeError(error)
    }
  }

  private async requestMessage(path: string, options: RequestOptions): Promise<MessageResponse> {
    if (this.requiresCsrf(options)) {
      await this.ensureCsrfCookie()
    }

    try {
      const response = await this.client.request<MessageResponse | ApiEnvelope<unknown>>({
        ...options,
        data: options.body,
        headers: this.buildHeaders(options),
        method: options.method,
        url: path,
        withCredentials: options.withCredentials ?? true,
      })

      if (!this.isApiEnvelope(response.data)) {
        return response.data as MessageResponse
      }

      if (!response.data.success) {
        throw this.errorFromEnvelope(response.data)
      }

      return { message: response.data.message }
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

  private unwrapResponse<TData>(data: TData | ApiEnvelope<TData>, options: RequestOptions): TData {
    if (options.responseType && options.responseType !== 'json') {
      return data as TData
    }

    if (!this.isApiEnvelope<TData>(data)) {
      return data as TData
    }

    if (!data.success) {
      throw this.errorFromEnvelope(data)
    }

    return data.data
  }

  private isApiEnvelope<TData>(data: unknown): data is ApiEnvelope<TData> {
    return Boolean(
      data &&
        typeof data === 'object' &&
        'success' in data &&
        'message' in data &&
        'data' in data &&
        'statusCode' in data,
    )
  }

  private normalizeError(error: unknown) {
    if (error instanceof AxiosError) {
      const data = error.response?.data

      if (this.isApiEnvelope(data)) {
        return this.errorFromEnvelope(data)
      }

      if (data && typeof data === 'object' && 'message' in data) {
        return new ApiError(String(data.message), {
          data,
          statusCode: error.response?.status,
        })
      }

      return new ApiError(error.message, {
        data,
        statusCode: error.response?.status,
      })
    }

    return error instanceof Error ? error : new Error('Request failed.')
  }

  private errorFromEnvelope(envelope: ApiEnvelope<unknown>) {
    const data = envelope.data as ApiErrorData | null | undefined

    return new ApiError(envelope.message || 'Request failed.', {
      data: envelope.data,
      errors: this.readValidationErrors(data),
      statusCode: envelope.statusCode,
    })
  }

  private readValidationErrors(data: ApiErrorData | null | undefined): ValidationErrors | undefined {
    if (!data?.errors || typeof data.errors !== 'object') {
      return undefined
    }

    return data.errors
  }
}

export const apiClient = new ApiClient()
