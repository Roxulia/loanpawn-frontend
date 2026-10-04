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

export type ExpiredCollateral = {
  code: string;
  name: string;
  type: string;
  description: string | null;
  quantity: number;
  estimated_value: number;
  item_status: string;
  inventory_item_code: string | null;
  ownership_transferred_at: string | null;
  slip_no: string | null;
  slip_status: string | null;
  customer_name: string | null;
  expire_at: string | null;
  loan_amount: number;
  collateral_item_count: number;
  currency_code: string;
  recommended_unit_cost_basis: number;
  estimated_unit_value: number;
};
