import { apiClient } from "../../../services/http/apiClient";
import type {
  PurchaseOrder,
  PurchasePayment,
  PurchaseReceipt,
  PurchaseReturn,
  PurchaseSupplier,
  SupplierType,
  PurchaseTrackingMode,
  SupplierPayable,
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
    items: Array<{
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
    payload: { paid_at: string; amount: number; financial_account_id: number; reference?: string | null; note?: string | null },
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
    location_code: string;
    note?: string | null;
    items: Array<{ purchase_order_item_code: string; quantity: number; unit_identifiers?: string[] }>;
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
    items: Array<{ purchase_receipt_item_code: string; quantity: number; location_code: string; inventory_unit_codes?: string[]; cash_refund_amount?: number; financial_account_id?: number }>
  }) {
    return apiClient.post<PurchaseReturn>(
      `/tenant/purchasing/orders/${encodeURIComponent(orderCode)}/returns`,
      payload,
      writeOptions(),
    );
  },
  payables(orderCode?: string) {
    const query = orderCode ? `?order_code=${encodeURIComponent(orderCode)}` : "";
    return apiClient.get<SupplierPayable[]>(`/tenant/purchasing/payables${query}`);
  },
  recordPayablePayment(code: string, payload: { paid_at: string; amount: number; financial_account_id: number; reference?: string | null; note?: string | null }) {
    return apiClient.post(`/tenant/purchasing/payables/${encodeURIComponent(code)}/payments`, payload, writeOptions());
  },
};