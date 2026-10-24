import type { InventoryBalance } from "../inventory/types";

export type OwnershipHolding = "all" | "current" | "depleted";
export type OwnershipTrackingMode = "UNIQUE" | "SERIALIZED" | "QUANTITY";

export type OwnedItem = {
  code: string;
  inventory_item_code: string;
  catalog_item_code: string | null;
  name: string;
  description: string | null;
  tracking_mode: OwnershipTrackingMode;
  unit_code: string | null;
  unit_name: string | null;
  quantity_scale: string;
  owned_quantity: string;
  reserved_quantity: string;
  pledged_quantity: string;
  available_quantity: string;
  physical_quantity: string;
  received_backed_quantity: string;
  awaiting_receipt_quantity: string;
  pending_link_quantity: string;
  lot_count: number;
  lifecycle_status: string;
  update_key: number;
  image_url: string | null;
  image_url_expires_at: string | null;
};

export type OwnershipDetail = OwnedItem & {
  locations: InventoryBalance[];
  receipt_link_state: "PENDING" | "LINKED";
};

export type AcquisitionLot = {
  code: string;
  source_module: string | null;
  source_type: string | null;
  source_code: string | null;
  acquired_at: string;
  acquired_quantity: string;
  owned_quantity: string;
  reserved_quantity: string;
  pledged_quantity: string;
  available_quantity: string;
  received_backed_quantity: string;
  awaiting_receipt_quantity: string;
  pending_link_quantity: string;
  unit_cost_basis: string;
  estimated_unit_value: string | null;
  currency_code: string;
  description: string | null;
};

export type OwnershipMovement = {
  code: string;
  lot_code: string | null;
  operation: string;
  quantity: string;
  owned_delta: string;
  reserved_delta: string;
  pledged_delta: string;
  source_module: string | null;
  source_type: string | null;
  source_code: string | null;
  occurred_at: string;
  recorded_at: string | null;
};

export type OwnershipReceiptCandidate = {
  purchase_receipt_line_code: string;
  purchase_order_line_code: string;
  received_at: string;
  inventory_item_code: string;
  received_quantity: string;
  linked_quantity: string;
  remaining_to_link_quantity: string;
};

export type OwnershipPieceCandidate = {
  code: string;
  identifier: string | null;
  purchase_receipt_line_code: string;
  location_code: string | null;
  location_name: string | null;
  link_state: "LINKED" | "UNLINKED";
  is_eligible: boolean;
};

export type OwnershipReceiptLinkPayload = {
  purchase_receipt_line_code: string;
  quantity: string;
  update_key: number;
  serialized_item_codes: string[];
};

export type OwnershipResult = {
  owned_item_code: string;
  update_key: number;
  lot_codes: string[];
  movement_codes: string[];
  receipt_link_codes: string[];
  serialized_item_codes: string[];
};
