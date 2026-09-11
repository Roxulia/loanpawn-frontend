import { apiClient } from "../../../services/http/apiClient";
import type { CollateralItem, CollateralItemListPage, CollateralUpdatePayload } from "../types";

type TenantAuth = {
  token?: string;
  tenantCode?: string;
};

function authOptions(auth: TenantAuth = {}) {
  return {
    tenantCode: auth.tenantCode,
    token: auth.token,
  };
}

export const collateralService = {
  updateCollateral(itemCode: string, payload: CollateralUpdatePayload) {
    const path = `/tenant/collateral-items/${encodeURIComponent(itemCode)}`;
    if (!payload.image_reference && !payload.sub_items?.some((row) => row.image_reference)) {
      return apiClient.put<CollateralItem>(path, payload);
    }
    // PHP parses uploaded files through POST, with Laravel resolving the intended PUT route.
    const body = new FormData();
    body.append("_method", "PUT");
    Object.entries(payload).forEach(([key, value]) => appendUpdateValue(body, key, value));
    return apiClient.post<CollateralItem>(path, body);
  },
  listCollateral(
    params: { page?: number; perPage?: number; search?: string } = {},
    auth?: TenantAuth,
  ) {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) {
      searchParams.set("page", String(params.page));
    }

    if (params.perPage !== undefined) {
      searchParams.set("per_page", String(params.perPage));
    }

    if (params.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }

    const query = searchParams.toString();

    return apiClient.get<CollateralItemListPage>(
      `/tenant/collateral-items${query ? `?${query}` : ""}`,
      authOptions(auth),
    );
  },

  getCollateral(itemCode: string, auth?: TenantAuth) {
    return apiClient.get<CollateralItem>(
      `/tenant/collateral-items/${encodeURIComponent(itemCode)}`,
      authOptions(auth),
    );
  },

  deleteCollateral(itemCode: string, auth?: TenantAuth) {
    return apiClient.deleteMessage(
      `/tenant/collateral-items/${encodeURIComponent(itemCode)}`,
      authOptions(auth),
    );
  },
};

function appendUpdateValue(body: FormData, key: string, value: unknown): void {
  if (value === undefined) return;
  if (value === null) { body.append(key, ""); return; }
  if (value instanceof File) { body.append(key, value); return; }
  if (Array.isArray(value)) {
    value.forEach((child, index) => appendUpdateValue(body, `${key}[${index}]`, child));
  } else if (typeof value === "object") {
    Object.entries(value).forEach(([field, child]) => appendUpdateValue(body, `${key}[${field}]`, child));
  } else {
    body.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  }
}
