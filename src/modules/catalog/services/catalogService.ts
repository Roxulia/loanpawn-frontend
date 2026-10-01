import { apiClient } from "../../../services/http/apiClient";
import type {
  CatalogCategory,
  CatalogItem,
  CatalogTrackingMode,
  CatalogUnit,
} from "../types";

export const catalogService = {
  searchItems(search: string) {
    return apiClient.get<CatalogItem[]>(
      `/tenant/catalog/items?search=${encodeURIComponent(search)}`,
    );
  },
  createItem(payload: {
    name: string;
    category_id?: number | null;
    tracking_mode?: CatalogTrackingMode;
  }) {
    return apiClient.post<CatalogItem>("/tenant/catalog/items", payload);
  },
  categories() {
    return apiClient.get<CatalogCategory[]>("/tenant/catalog/categories");
  },
  createCategory(name: string) {
    return apiClient.post<CatalogCategory>("/tenant/catalog/categories", {
      name,
    });
  },
  updateCategory(
    id: number,
    payload: Partial<Pick<CatalogCategory, "name" | "is_active" | "update_key">>,
  ) {
    return apiClient.put<CatalogCategory>(
      `/tenant/catalog/categories/${id}`,
      payload,
    );
  },
  units() {
    return apiClient.get<CatalogUnit[]>("/tenant/catalog/units");
  },
  unitsForManagement() {
    return apiClient.get<CatalogUnit[]>("/tenant/catalog/units/manage");
  },
  createUnit(payload: { code: string; name: string; symbol?: string | null }) {
    return apiClient.post<CatalogUnit>("/tenant/catalog/units", payload);
  },
  updateUnit(id: number, is_active: boolean) {
    return apiClient.put<CatalogUnit>(`/tenant/catalog/units/${id}`, {
      is_active,
    });
  },
};
