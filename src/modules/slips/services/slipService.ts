import { apiClient } from '../../../services/http/apiClient'

type TenantAuth = {
  token?: string
  tenantCode?: string
}

type IdempotentRequestOptions = {
  idempotencyKey?: string
}

export type SlipCustomer = {
  id?: number
  name?: string
  nrc?: string | null
  nrc_citizen?: string | null
  nrc_number?: string | null
  nrc_state?: string | null
  nrc_township?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  note?: string | null
}

export type SlipCollateralItem = {
  id: number
  code?: string
  update_key?: number
  type: string
  name: string
  description?: string | null
  brand_name?: string | null
  estimated_value?: string | number
  material_type_name?: string | null
  item_category_type_id?: number | null
  item_category_type_name?: string | null
  kyat?: string | number
  pal?: string | number
  yway?: string | number
  item_status?: string
  quantity?: number
  minimum_retail_price?: string | number
}

export type LoanContractSlip = {
  id: number
  update_key?: number
  account_id?: number | null
  accountId?: number | null
  slip_no: string
  customer?: SlipCustomer | null
  customer_id?: number
  loan_amount: string | number
  interest_rate: string | number
  interest_type_id?: number | null
  interest_type_name?: string | null
  created_at?: string | null
  updated_at?: string | null
  expire_at?: string | null
  last_interest_added_at?: string | null
  last_interest_paid_at?: string | null
  status: string
  notes?: string | null
  expiry_quota?: number
  expiry_quota_type?: string
  items?: SlipCollateralItem[]
}

export type LoanContractSlipListPage = {
  items: LoanContractSlip[]
  current_page?: number
  currentPage?: number
  last_page?: number
  lastPage?: number
  per_page?: number
  perPage?: number
  total: number
}

export type InterestType = {
  id: number
  name: string
  code?: string
  duration_in_days: number
}

export type MaterialType = {
  id: number
  name: string
  code?: string
}

export type ItemCategoryType = {
  id: number
  name: string
  code?: string
}

export type SlipCollateralPayload = {
  type: 'Normal' | 'Jewellery'
  name: string
  description?: string
  brand_name?: string
  estimated_value?: number
  estimated_value_unit?: import('../../finance/financialUnits').FinancialUnitCode
  material_type_id?: number
  material_price_per_kyat?: number
  material_price_per_kyat_unit?: import('../../finance/financialUnits').FinancialUnitCode
  item_category_type_id?: number
  kyat?: number
  pal?: number
  yway?: number
  contains_gemstones?: boolean
  gemstone_details?: GemstoneDetailsPayload
  quantity?: number
  minimum_retail_price?: number
  minimum_retail_price_unit?: import('../../finance/financialUnits').FinancialUnitCode
  item_status?: string
  image_reference?: File
}

export type GemstoneDetailsPayload = {
  type?: string
  weight?: string
  quantity?: number
  grade?: string
}

export type SlipCreatePayload = {
  account_id?: number
  customer: {
    name: string
    nrc_citizen?: string
    nrc_number?: string
    nrc_state?: string
    nrc_township?: string
    email?: string
    phone?: string
    address?: string
    note?: string
  }
  collateral_items: SlipCollateralPayload[]
  loan_amount: number
  loan_amount_unit?: import('../../finance/financialUnits').FinancialUnitCode
  interest_rate: number
  interest_type_id: number
  expiry_quota: number
  expiry_quota_type: string
  notes?: string
}

function authOptions(auth: TenantAuth = {}) {
  return {
    tenantCode: auth.tenantCode,
    token: auth.token,
  }
}

export const slipService = {
  listSlips(params: { page?: number; perPage?: number } = {}, auth?: TenantAuth) {
    const searchParams = new URLSearchParams()

    if (params.page !== undefined) {
      searchParams.set('page', String(params.page))
    }

    if (params.perPage !== undefined) {
      searchParams.set('per_page', String(params.perPage))
    }

    const query = searchParams.toString()

    return apiClient.get<LoanContractSlipListPage>(
      `/tenant/loan-contract-slips${query ? `?${query}` : ''}`,
      authOptions(auth),
    )
  },

  createSlip(payload: SlipCreatePayload, auth?: TenantAuth, options: IdempotentRequestOptions = {}) {
    const requestBody = payload.collateral_items.some((item) => item.image_reference instanceof File)
      ? slipPayloadToFormData(payload)
      : payload

    return apiClient.post<LoanContractSlip>('/tenant/loan-contract-slips', requestBody, {
      ...authOptions(auth),
      idempotencyKey: options.idempotencyKey,
    })
  },

  getSlip(slipNo: string, auth?: TenantAuth) {
    return apiClient.get<LoanContractSlip>(`/tenant/loan-contract-slips/${encodeURIComponent(slipNo)}`, authOptions(auth))
  },

  deleteSlip(slipNo: string, auth?: TenantAuth) {
    return apiClient.deleteMessage(`/tenant/loan-contract-slips/${encodeURIComponent(slipNo)}`, authOptions(auth))
  },

  previewSlipDocument(slipNo: string,paperType:string, auth?: TenantAuth) {
    return apiClient.get<string>(`/tenant/loan-contract-slips/${encodeURIComponent(slipNo)}/document/preview`, {
      ...authOptions(auth),
      params: {
        orientation: 'portrait',
        paper_type: paperType,
      },
      responseType: 'text',
    })
  },

  listInterestTypes(auth?: TenantAuth) {
    return apiClient.get<InterestType[]>('/tenant/interest-types', authOptions(auth))
  },

  listMaterialTypes(auth?: TenantAuth) {
    return apiClient.get<MaterialType[]>('/tenant/material-types', authOptions(auth))
  },

  listItemCategoryTypes(auth?: TenantAuth) {
    return apiClient.get<ItemCategoryType[]>('/tenant/item-category-types', authOptions(auth))
  },
}

function slipPayloadToFormData(payload: SlipCreatePayload) {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => appendFormDataValue(formData, key, value))

  return formData
}

function appendFormDataValue(formData: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null) return

  if (value instanceof File) {
    formData.append(key, value)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendFormDataValue(formData, `${key}[${index}]`, item))
    return
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue]) => {
      appendFormDataValue(formData, `${key}[${childKey}]`, childValue)
    })
    return
  }

  formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
}
