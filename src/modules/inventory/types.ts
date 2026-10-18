import type { CatalogItem, CatalogTrackingMode, CatalogUnit } from "../catalog/types";

export type InventoryLocation = {
  code: string;
  update_key: number;
  name: string;
  type: "SHOP" | "STORAGE" | "VAULT" | "DISPLAY" | "LENDER" | "OTHER";
  is_active: boolean;
  is_sellable?: boolean;
};

export type InventorySerializedItem = {
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
  update_key: number;
  name: string;
  description: string | null;
  catalog_item_code: string | null;
  tracking_mode: CatalogTrackingMode;
  unit_code: string;
  unit: string | null;
  total_quantity: string;
  locations: InventoryBalance[];
  // Individually tracked physical items, separate from measurement-unit options.
  serialized_items: InventorySerializedItem[];
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

export type InventoryMeasurementUnitOption = Pick<CatalogUnit, "code" | "name" | "symbol">;
export type InventoryCatalogOption = CatalogItem;

// Affected references returned by the activated receipt and move workflows.
export type InventoryMutationResult = {
  inventory_item_code: string;
  update_key: number;
  quantity: string;
  movement_codes: string[];
  serialized_item_codes: string[];
  reservation_code: string | null;
  remaining_quantity: string | null;
};
