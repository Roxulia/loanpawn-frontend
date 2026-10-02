import { apiClient } from "../../../services/http/apiClient";
import type {
  InventoryItem,
  InventoryLocation,
  InventoryMovement,
  InventoryUnitOption,
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

  units() {
    return apiClient.get<InventoryUnitOption[]>("/tenant/inventory/units");
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
    return apiClient.post<InventoryItem>("/tenant/inventory/receive", payload, {
      idempotencyKey: crypto.randomUUID(),
    });
  },

  move(payload: Record<string, unknown>) {
    return apiClient.post<InventoryItem>("/tenant/inventory/move", payload, {
      idempotencyKey: crypto.randomUUID(),
    });
  },

  issue(payload: Record<string, unknown>) {
    return apiClient.post<InventoryItem>("/tenant/inventory/issue", payload, {
      idempotencyKey: crypto.randomUUID(),
    });
  },

  adjust(payload: Record<string, unknown>) {
    return apiClient.post<InventoryItem>("/tenant/inventory/adjust", payload, {
      idempotencyKey: crypto.randomUUID(),
    });
  },
};
