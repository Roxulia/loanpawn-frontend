import { apiClient } from "../../../services/http/apiClient";
import type {
  PurchaseOrder,
  PurchasePayment,
  PurchaseReceipt,
  PurchaseReturn,
  PurchaseSupplier,
  SupplierType,
  PurchaseTrackingMode,
} from "../types";

const writeOptions = () => ({ idempotencyKey: crypto.randomUUID() });

export const purchasingService = {
  suppliers(search = "") {
    return apiClient.get<PurchaseSupplier[]>(
      `/tenant/purchasing/suppliers?search=${encodeURIComponent(search)}`,
    );
  },
  supplier(code: string) {
    return apiClient.get<PurchaseSupplier>(
      `/tenant/purchasing/suppliers/${encodeURIComponent(code)}`,
    );
  },
  createSupplier(payload: {
    type: SupplierType;
    customer_code?: string;
    lender_code?: string;
    name?: string;
    contact_name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    note?: string | null;
  }) {
    return apiClient.post<PurchaseSupplier>(
      "/tenant/purchasing/suppliers",
      payload,
      writeOptions(),
    );
  },
  updateSupplier(code: string, payload: Partial<Pick<PurchaseSupplier,
    "type" | "name" | "contact_name" | "phone" | "email" | "address" | "note" | "is_active"
  >>) {
    return apiClient.put<PurchaseSupplier>(
      `/tenant/purchasing/suppliers/${encodeURIComponent(code)}`,
      payload,
    );
  },
  orders(search = "") {
    return apiClient.get<PurchaseOrder[]>(
      `/tenant/purchasing/orders?search=${encodeURIComponent(search)}`,
    );
  },
  order(code: string) {
    return apiClient.get<PurchaseOrder>(
      `/tenant/purchasing/orders/${encodeURIComponent(code)}`,
    );
  },
  createOrder(payload: {
    supplier_code: string;
    currency_code: string;
    note?: string | null;
    lines: Array<{
      catalog_item_code?: string | null;
      item_description?: string;
      tracking_mode?: PurchaseTrackingMode;
      unit_label?: string;
      ordered_quantity: number;
      unit_price: number;
    }>;
  }) {
    return apiClient.post<PurchaseOrder>(
      "/tenant/purchasing/orders",
      payload,
      writeOptions(),
    );
  },
  orderAction(code: string, action: "order" | "confirm" | "cancel") {
    return apiClient.post<PurchaseOrder>(
      `/tenant/purchasing/orders/${encodeURIComponent(code)}/${action}`,
      {},
      writeOptions(),
    );
  },
  payments(orderCode: string) {
    return apiClient.get<PurchasePayment[]>(
      `/tenant/purchasing/orders/${encodeURIComponent(orderCode)}/payments`,
    );
  },
  recordPayment(
    orderCode: string,
    payload: { paid_at: string; amount: number; reference?: string | null; note?: string | null },
  ) {
    return apiClient.post<PurchasePayment>(
      `/tenant/purchasing/orders/${encodeURIComponent(orderCode)}/payments`,
      payload,
      writeOptions(),
    );
  },
  refundPayment(
    paymentCode: string,
    payload: { refunded_at: string; amount: number; reference?: string | null; note?: string | null },
  ) {
    return apiClient.post<PurchasePayment>(
      `/tenant/purchasing/payments/${encodeURIComponent(paymentCode)}/refunds`,
      payload,
      writeOptions(),
    );
  },
  receipts(orderCode: string) {
    return apiClient.get<PurchaseReceipt[]>(
      `/tenant/purchasing/orders/${encodeURIComponent(orderCode)}/receipts`,
    );
  },
  receive(orderCode: string, payload: {
    received_at: string;
    note?: string | null;
    lines: Array<{ purchase_order_line_code: string; quantity: number }>;
  }) {
    return apiClient.post<PurchaseReceipt>(
      `/tenant/purchasing/orders/${encodeURIComponent(orderCode)}/receipts`,
      payload,
      writeOptions(),
    );
  },
  returns(orderCode: string) {
    return apiClient.get<PurchaseReturn[]>(
      `/tenant/purchasing/orders/${encodeURIComponent(orderCode)}/returns`,
    );
  },
  returnToSupplier(orderCode: string, payload: {
    returned_at: string;
    reason?: string | null;
    note?: string | null;
    lines: Array<{ purchase_receipt_line_code: string; quantity: number }>;
  }) {
    return apiClient.post<PurchaseReturn>(
      `/tenant/purchasing/orders/${encodeURIComponent(orderCode)}/returns`,
      payload,
      writeOptions(),
    );
  },
};
