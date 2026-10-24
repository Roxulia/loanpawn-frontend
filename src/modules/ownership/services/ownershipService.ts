import { apiClient } from "../../../services/http/apiClient";
import type { PaginatedResult } from "../../../dataobjects/common/api";
import type {
  AcquisitionLot, OwnedItem, OwnershipDetail, OwnershipHolding, OwnershipMovement,
  OwnershipPieceCandidate, OwnershipReceiptCandidate, OwnershipReceiptLinkPayload,
  OwnershipResult, OwnershipTrackingMode,
} from "../types";

type ItemFilters = { search?: string; holding?: OwnershipHolding; tracking_mode?: OwnershipTrackingMode | "" };

function itemPath(code: string) {
  return `/tenant/ownership/items/${encodeURIComponent(code)}`;
}

function lotPath(code: string, lotCode: string) {
  return `${itemPath(code)}/lots/${encodeURIComponent(lotCode)}`;
}

export const ownershipService = {
  // Every list uses the existing bounded server contract; no full-register downloads.
  list(filters: ItemFilters = {}, page = 1) {
    return apiClient.get<PaginatedResult<OwnedItem>>("/tenant/ownership/items", {
      params: { ...filters, tracking_mode: filters.tracking_mode || undefined, page, per_page: 25 },
    });
  },
  detail(code: string) {
    return apiClient.get<OwnershipDetail>(itemPath(code));
  },
  lots(code: string, page = 1, holding: OwnershipHolding = "all", currencyCode = "") {
    return apiClient.get<PaginatedResult<AcquisitionLot>>(`${itemPath(code)}/lots`, {
      params: { page, per_page: 10, holding, currency_code: currencyCode || undefined },
    });
  },
  movements(code: string, page = 1) {
    return apiClient.get<PaginatedResult<OwnershipMovement>>(`${itemPath(code)}/movements`, {
      params: { page, per_page: 10 },
    });
  },
  receiptCandidates(code: string, lotCode: string, page = 1, search = "") {
    return apiClient.get<PaginatedResult<OwnershipReceiptCandidate>>(`${lotPath(code, lotCode)}/receipt-link-candidates`, {
      params: { page, per_page: 10, search },
    });
  },
  pieceCandidates(code: string, lotCode: string, receiptCode: string, page = 1, search = "") {
    return apiClient.get<PaginatedResult<OwnershipPieceCandidate>>(`${lotPath(code, lotCode)}/receipt-link-candidates`, {
      params: { page, per_page: 25, search, purchase_receipt_line_code: receiptCode },
    });
  },
  linkReceipt(code: string, lotCode: string, payload: OwnershipReceiptLinkPayload, idempotencyKey: string) {
    // The caller retains the key for an unchanged retry; quantities remain decimal text.
    return apiClient.post<OwnershipResult>(`${lotPath(code, lotCode)}/receipt-links`, payload, { idempotencyKey });
  },
};
