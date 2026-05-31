export type ApiSuccessResponse<TData> = {
  success: true
  code?: string
  message?: string
  data: TData
}

export type ApiErrorResponse = {
  success: false
  code?: string
  message: string
  errors?: Record<string, string[]>
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse

export type PaginatedResult<TItem> = {
  items: TItem[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
