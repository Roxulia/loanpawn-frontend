import type { CatalogItem, CatalogTrackingMode, CatalogUnit } from "../catalog/types";

export type InventoryLocation = {
  code: string;
  name: string;
  type: "SHOP" | "STORAGE" | "VAULT" | "DISPLAY" | "LENDER" | "OTHER";
  is_active: boolean;
};

export type InventoryUnit = {
  code: string;
  identifier: string | null;
  location_code: string | null;
  location: string | null;
};

export type InventoryBalance = {
  location_code: string | null;
  location: string | null;
  quantity: string;
};

export type InventoryItem = {
  code: string;
  name: string;
  description: string | null;
  catalog_item_code: string | null;
  tracking_mode: CatalogTrackingMode;
  unit_code: string;
  unit: string | null;
  total_quantity: string;
  locations: InventoryBalance[];
  units: InventoryUnit[];
};

export type InventoryMovement = {
  code: string;
  type: string;
  quantity: string;
  from_location_code: string | null;
  to_location_code: string | null;
  from: string | null;
  to: string | null;
  reason: string | null;
  occurred_at: string;
};

export type InventoryUnitOption = Pick<CatalogUnit, "code" | "name" | "symbol">;
export type InventoryCatalogOption = CatalogItem;
