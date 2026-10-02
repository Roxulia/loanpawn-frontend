export type AcquisitionLot = {
  code: string;
  source_module: string | null;
  source_type: string | null;
  source_code: string | null;
  acquired_at: string;
  acquired_quantity: string;
  remaining_quantity: string;
  pledged_quantity: string;
  available_quantity: string;
  unit_cost_basis: string;
  estimated_unit_value: string | null;
  currency_code: string;
  description: string | null;
};

export type OwnedItem = {
  code: string;
  inventory_item_code: string;
  catalog_item_code: string | null;
  name: string;
  description: string | null;
  tracking_mode: "UNIQUE" | "SERIALIZED" | "QUANTITY";
  unit: string | null;
  inventory_total_quantity: string;
  inventory_locations: Array<{ location_code: string | null; location: string | null; quantity: string }>;
  owned_quantity: string;
  pledged_quantity: string;
  available_quantity: string;
  lifecycle_status: string;
  lots: AcquisitionLot[];
};

export type OwnershipMovement = {
  code: string;
  acquisition_lot_code: string | null;
  movement_type: string;
  quantity: string;
  owned_delta: string;
  pledged_delta: string;
  source_module: string | null;
  source_type: string | null;
  occurred_at: string;
};
