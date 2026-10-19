import type { CatalogItem, CatalogTrackingMode, CatalogUnit } from "../catalog/types";
import type { PaginatedResult } from "../../dataobjects/common/api";

export type InventoryLocation = {
  code: string;
  update_key: number;
  name: string;
  type: "SHOP" | "STORAGE" | "VAULT" | "DISPLAY" | "LENDER" | "OTHER";
  is_active: boolean;
  is_sellable?: boolean;
  is_default: boolean;
};

export type InventorySerializedItem = {
  code: string;
  inventory_item_code: string;
  identifier: string | null;
  location: InventoryLocation | null;
  is_reserved: boolean;
  is_available: boolean;
  latest_movement_code: string | null;
};

export type InventoryBalance = {
  location: InventoryLocation;
  quantity: string;
  reserved_quantity: string;
  available_quantity: string;
};

export type InventoryItem = {
  code: string;
  update_key: number;
  name: string;
  description: string | null;
  catalog_item_code: string | null;
  tracking_mode: CatalogTrackingMode;
  unit_code: string;
  unit_name: string;
  quantity_scale: string;
  total_quantity: string;
  reserved_quantity: string;
  available_quantity: string;
  locations: InventoryBalance[];
  image_url: string | null;
  image_url_expires_at: string | null;
};

// List rows are bounded summaries; select an item to retrieve its operational detail.
export type InventoryItemSummary = Omit<InventoryItem, "locations">;

export type InventoryMovement = {
  inventory_item_code: string;
  serialized_item_code: string | null;
  code: string;
  type: string;
  quantity: string;
  from_location: InventoryLocation | null;
  to_location: InventoryLocation | null;
  source_type: string | null;
  source_code: string | null;
  created_by_code: string | null;
  reason: string | null;
  occurred_at: string;
};

// Shared flat metadata supplied by the typed Inventory read pages.
export type InventoryReadPage<T> = PaginatedResult<T>;

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
