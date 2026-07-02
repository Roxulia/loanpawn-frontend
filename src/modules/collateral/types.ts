export type CollateralType = 'Jewellery' | 'Normal' | 'jewellery' | 'normal'

export type CollateralItem = {
  id: number
  code: string
  update_key?: number
  itemType?: CollateralType
  itemStatus?: string
  imageUrl?: string | null
  createdAt?: string | null
  loanContractId?: number | null
  brandName?: string | null
  estimatedValue?: string
  materialTypeId?: number | null
  materialTypeName?: string | null
  itemCategoryTypeId?: number | null
  itemCategoryTypeName?: string | null
  containsGemstones?: boolean
  gemstoneDetails?: unknown[] | null
  minimumRetailPrice?: string
  isDeleted?: boolean
  updatedAt?: string | null
  tenant_id?: number
  loan_contract_id?: number | null
  type: CollateralType
  item_type?: CollateralType
  name: string
  description?: string | null
  brand_name?: string | null
  image_url?: string | null
  estimated_value?: string
  material_type_id?: number | null
  material_type_name?: string | null
  item_category_type_id?: number | null
  item_category_type_name?: string | null
  kyat?: string
  pal?: string
  yway?: string
  item_status: string
  contains_gemstones?: boolean
  gemstone_details?: unknown[] | null
  quantity?: number
  minimum_retail_price?: string
  is_deleted?: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type CollateralItemListPage = {
  items: CollateralItem[]
  currentPage?: number
  current_page?: number
  lastPage?: number
  last_page?: number
  perPage?: number
  per_page?: number
  total: number
}

export type CollateralItemPayload = {
  type: CollateralType
  name: string
  description?: string | null
  brand_name?: string | null
  image_url?: string | null
  estimated_value?: number
  material_type_id?: number | null
  item_category_type_id?: number | null
  kyat?: number
  pal?: number
  yway?: number
  item_status?: string
  contains_gemstones?: boolean
  gemstone_details?: unknown[] | null
  quantity?: number
  minimum_retail_price?: number
}
