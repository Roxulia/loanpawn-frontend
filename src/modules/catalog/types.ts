export type CatalogTrackingMode = "UNIQUE" | "SERIALIZED" | "QUANTITY";

export type CatalogUnit = {
  id: number;
  tenant_id?: number | null;
  code: string;
  name: string;
  symbol: string | null;
  is_active: boolean;
  is_system?: boolean;
};

export type CatalogCategory = {
  id: number;
  name: string;
  is_active: boolean;
  update_key: number;
};

export type CatalogItem = {
  id: number;
  business_code: string;
  name: string;
  description: string | null;
  category_id: number | null;
  category: string | null;
  sku: string | null;
  barcode: string | null;
  tracking_mode: CatalogTrackingMode;
  unit_id: number;
  unit_code: string;
  unit: Pick<CatalogUnit, "id" | "name" | "symbol"> | null;
  is_active: boolean;
  update_key: number;
};
