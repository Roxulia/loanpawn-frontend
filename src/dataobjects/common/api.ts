export type ValidationErrors = Record<string, string[]>

export type ApiEnvelope<TData> = {
  success: boolean
  message: string
  data: TData
  statusCode: number
}

export type MessageResponse = {
  message: string
}

export type ApiErrorData = {
  code?: string
  errors?: ValidationErrors
  [key: string]: unknown
}

export class ApiError extends Error {
  readonly data?: unknown
  readonly errors?: ValidationErrors
  readonly statusCode?: number

  constructor(message: string, options: { data?: unknown; errors?: ValidationErrors; statusCode?: number } = {}) {
    super(message)
    this.name = 'ApiError'
    this.data = options.data
    this.errors = options.errors
    this.statusCode = options.statusCode
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export type PaginatedResult<TItem> = {
  items: TItem[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
