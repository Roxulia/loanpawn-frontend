import { apiClient } from "../../../services/http/apiClient";
import type {
  InventoryItem,
  InventoryItemSummary,
  InventoryMutationResult,
  InventoryLocation,
  InventoryMovement,
  InventoryReadPage,
  InventorySerializedItem,
  InventoryMeasurementUnitOption,
} from "../types";

export const inventoryService = {
  list(search = "", page = 1, locationCode = "", trackingMode = "") {
    // Fetch summaries one page at a time; operational details use the item endpoint.
    const query = new URLSearchParams({ search, page: String(page), per_page: "25" });
    if (locationCode) query.set("location_code", locationCode);
    if (trackingMode) query.set("tracking_mode", trackingMode);
    return apiClient.get<InventoryReadPage<InventoryItemSummary>>(
      `/tenant/inventory/items?${query}`,
    );
  },

  detail(itemCode: string) {
    return apiClient.get<InventoryItem>(`/tenant/inventory/items/${encodeURIComponent(itemCode)}`);
  },

  locations() {
    return apiClient.get<InventoryLocation[]>("/tenant/inventory/locations");
  },

  measurementUnits() {
    return apiClient.get<InventoryMeasurementUnitOption[]>("/tenant/inventory/measurement-units");
  },

  movements(itemCode: string, page = 1) {
    // Request one bounded history page instead of the full movement ledger.
    return apiClient.get<InventoryReadPage<InventoryMovement>>(
      `/tenant/inventory/items/${encodeURIComponent(itemCode)}/movements?page=${page}&per_page=25`,
    );
  },

  serializedItems(itemCode: string, page = 1, locationCode = "", search = "", availableOnly = false) {
    // Identity and measurement-unit reads remain distinct, with explicit custody filters.
    const query = new URLSearchParams({ page: String(page), per_page: "25", search, available_only: availableOnly ? "1" : "0" });
    if (locationCode) query.set("location_code", locationCode);
    return apiClient.get<InventoryReadPage<InventorySerializedItem>>(`/tenant/inventory/items/${encodeURIComponent(itemCode)}/serialized-items?${query}`);
  },

  createLocation(payload: { name: string; type: InventoryLocation["type"] }, idempotencyKey: string) {
    return apiClient.post<InventoryLocation>(
      "/tenant/inventory/locations",
      payload,
      { idempotencyKey },
    );
  },

  updateLocation(code: string, payload: { name: string; type: InventoryLocation["type"]; is_active: boolean; is_sellable: boolean; update_key: number }, idempotencyKey: string) {
    // Carry the displayed location version and the caller's retry-stable key.
    return apiClient.put<InventoryLocation>(`/tenant/inventory/locations/${encodeURIComponent(code)}`, payload, { idempotencyKey });
  },

  receive(payload: Record<string, unknown>, idempotencyKey: string) {
    return apiClient.post<InventoryMutationResult>("/tenant/inventory/receive", payload, {
      idempotencyKey,
    });
  },

  moveStock(payload: Record<string, unknown>, idempotencyKey: string) {
    return apiClient.post<InventoryMutationResult>("/tenant/inventory/move", payload, {
      idempotencyKey,
    });
  },

  issueStock(payload: Record<string, unknown>, idempotencyKey: string) {
    // Issue returns only this operation's affected stock records and final version.
    return apiClient.post<InventoryMutationResult>("/tenant/inventory/issue", payload, {
      idempotencyKey,
    });
  },

  adjustStock(payload: Record<string, unknown>, idempotencyKey: string) {
    // Adjustments return affected movements/identities and the final item version.
    return apiClient.post<InventoryMutationResult>("/tenant/inventory/adjust", payload, {
      idempotencyKey,
    });
  },
};
