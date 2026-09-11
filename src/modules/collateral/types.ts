export const collateralTypes = ["Jewellery", "Normal", "Pack of Jewellery"] as const;
export type CollateralType = typeof collateralTypes[number] | "jewellery" | "normal";

export type PackItem = {
  id?: number;
  name: string;
  quantity: number;
  kyat?: string | number | null;
  pal?: string | number | null;
  yway?: string | number | null;
  material_type_id?: number | null;
  material_type_name?: string | null;
  image_url?: string | null;
  has_image_reference?: boolean;
};

export type PackItemForm = PackItem & {
  key: string;
  image_reference?: File;
  remove_image?: boolean;
};

export type CollateralItem = {
  id: number;
  code: string;
  update_key?: number;
  material_price_per_kyat?: string | number | null;
  sub_items?: PackItem[];
  itemType?: CollateralType;
  itemStatus?: string;
  imageUrl?: string | null;
  imageUrlExpiresAt?: string | null;
  hasImageReference?: boolean;
  createdAt?: string | null;
  loanContractId?: number | null;
  brandName?: string | null;
  estimatedValue?: string;
  materialTypeId?: number | null;
  materialTypeName?: string | null;
  itemCategoryTypeId?: number | null;
  itemCategoryTypeName?: string | null;
  containsGemstones?: boolean;
  gemstoneDetails?: import("../slips/services/slipService").GemstoneDetailsPayload | unknown[] | null;
  minimumRetailPrice?: string;
  isDeleted?: boolean;
  updatedAt?: string | null;
  tenant_id?: number;
  loan_contract_id?: number | null;
  type: CollateralType;
  item_type?: CollateralType;
  name: string;
  description?: string | null;
  brand_name?: string | null;
  image_url?: string | null;
  image_url_expires_at?: string | null;
  has_image_reference?: boolean;
  estimated_value?: string;
  material_type_id?: number | null;
  material_type_name?: string | null;
  item_category_type_id?: number | null;
  item_category_type_name?: string | null;
  kyat?: string;
  pal?: string;
  yway?: string;
  item_status: string;
  contains_gemstones?: boolean;
  gemstone_details?: import("../slips/services/slipService").GemstoneDetailsPayload | unknown[] | null;
  quantity?: number;
  minimum_retail_price?: string;
  is_deleted?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CollateralItemListPage = {
  items: CollateralItem[];
  currentPage?: number;
  current_page?: number;
  lastPage?: number;
  last_page?: number;
  perPage?: number;
  per_page?: number;
  total: number;
};

export type CollateralItemPayload = {
  type: CollateralType;
  name: string;
  description?: string | null;
  brand_name?: string | null;
  image_url?: string | null;
  estimated_value?: number;
  material_type_id?: number | null;
  item_category_type_id?: number | null;
  kyat?: number;
  pal?: number;
  yway?: number;
  item_status?: string;
  contains_gemstones?: boolean;
  gemstone_details?: import("../slips/services/slipService").GemstoneDetailsPayload | null;
  quantity?: number;
  minimum_retail_price?: number;
};

export type CollateralUpdatePayload = Omit<Partial<CollateralItemPayload>, "type" | "item_status" | "image_url" | "minimum_retail_price"> & {
  update_key: number;
  material_price_per_kyat?: number;
  material_price_per_kyat_unit?: import("../finance/financialUnits").FinancialUnitCode;
  estimated_value_unit?: import("../finance/financialUnits").FinancialUnitCode;
  image_reference?: File;
  remove_image?: boolean;
  sub_items?: Array<Omit<PackItemForm, "key" | "image_url" | "has_image_reference" | "material_type_name">>;
};
