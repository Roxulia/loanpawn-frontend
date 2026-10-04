import { createIdempotencyKey } from "../../../services/http/idempotency";
import { apiClient } from "../../../services/http/apiClient";
import type { ExpiredCollateral, OwnedItem, OwnershipMovement } from "../types";

export const ownershipService = {
  expiredCollateral(search = "") {
    return apiClient.get<ExpiredCollateral[]>(`/tenant/ownership/expired-collateral?search=${encodeURIComponent(search)}`);
  },

  transferExpiredCollateral(collateralCode: string, payload: {
    acquired_at: string;
    unit_cost_basis: number;
    estimated_unit_value?: number;
    currency_code: string;
    description?: string;
  }) {
    return apiClient.post<{ collateral_code: string; owned_item: OwnedItem }>(
      `/tenant/ownership/expired-collateral/${encodeURIComponent(collateralCode)}/transfer`,
      payload,
      { idempotencyKey: createIdempotencyKey() },
    );
  },
  list(search = "") {
    return apiClient.get<OwnedItem[]>(`/tenant/ownership/items?search=${encodeURIComponent(search)}`);
  },

  inventoryOptions(search = "") {
    return apiClient.get<import("../../inventory/types").InventoryItem[]>(`/tenant/ownership/inventory-options?search=${encodeURIComponent(search)}`);
  },

  detail(ownedItemCode: string) {
    return apiClient.get<OwnedItem>(`/tenant/ownership/items/${encodeURIComponent(ownedItemCode)}`);
  },

  movements(ownedItemCode: string) {
    return apiClient.get<OwnershipMovement[]>(`/tenant/ownership/items/${encodeURIComponent(ownedItemCode)}/movements`);
  },

  acquire(payload: {
    inventory_item_code: string;
    quantity: number;
    acquired_at: string;
    unit_cost_basis: number;
    estimated_unit_value?: number;
    currency_code: string;
    description?: string;
  }) {
    return apiClient.post<OwnedItem>("/tenant/ownership/acquisitions", payload, {
      idempotencyKey: createIdempotencyKey(),
    });
  },
};
