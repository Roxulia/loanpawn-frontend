import type { CatalogItem, CatalogTrackingMode, CatalogUnit } from "../catalog/types";

export type InventoryLocation = {
  id: number;
  name: string;
  type: "SHOP" | "STORAGE" | "VAULT" | "DISPLAY" | "LENDER" | "OTHER";
  is_active: boolean;
};

export type InventoryUnit = {
  id: number;
  identifier: string | null;
  location_id: number | null;
  location: string | null;
};

export type InventoryBalance = {
  location_id: number;
  location: string | null;
  quantity: string;
};

export type InventoryItem = {
  id: number;
  name: string;
  description: string | null;
  catalog_item_id: number | null;
  tracking_mode: CatalogTrackingMode;
  unit_id: number;
  unit: string | null;
  total_quantity: string;
  locations: InventoryBalance[];
  units: InventoryUnit[];
};

export type InventoryMovement = {
  id: number;
  type: string;
  quantity: string;
  from: string | null;
  to: string | null;
  reason: string | null;
  occurred_at: string;
};

export type InventoryUnitOption = Pick<CatalogUnit, "id" | "name" | "symbol">;
export type InventoryCatalogOption = CatalogItem;
