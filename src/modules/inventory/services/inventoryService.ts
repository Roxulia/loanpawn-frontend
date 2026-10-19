import { createIdempotencyKey } from "../../../services/http/idempotency";
import { apiClient } from "../../../services/http/apiClient";
import type {
  InventoryItem,
  InventoryMutationResult,
  InventoryLocation,
  InventoryMovement,
  InventoryMeasurementUnitOption,
} from "../types";

export const inventoryService = {
  list(search = "") {
    return apiClient.get<InventoryItem[]>(
      `/tenant/inventory/items?search=${encodeURIComponent(search)}`,
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

  movements(itemCode: string) {
    return apiClient.get<InventoryMovement[]>(
      `/tenant/inventory/items/${encodeURIComponent(itemCode)}/movements`,
    );
  },

  createLocation(payload: { name: string; type: InventoryLocation["type"] }) {
    return apiClient.post<InventoryLocation>(
      "/tenant/inventory/locations",
      payload,
    );
  },

  receive(payload: Record<string, unknown>) {
    return apiClient.post<InventoryMutationResult>("/tenant/inventory/receive", payload, {
      idempotencyKey: createIdempotencyKey(),
    });
  },

  moveStock(payload: Record<string, unknown>) {
    return apiClient.post<InventoryMutationResult>("/tenant/inventory/move", payload, {
      idempotencyKey: createIdempotencyKey(),
    });
  },

  issueStock(payload: Record<string, unknown>) {
    // Issue returns only this operation's affected stock records and final version.
    return apiClient.post<InventoryMutationResult>("/tenant/inventory/issue", payload, {
      idempotencyKey: createIdempotencyKey(),
    });
  },

  adjustStock(payload: Record<string, unknown>) {
    // Adjustments return affected movements/identities and the final item version.
    return apiClient.post<InventoryMutationResult>("/tenant/inventory/adjust", payload, {
      idempotencyKey: createIdempotencyKey(),
    });
  },
};
