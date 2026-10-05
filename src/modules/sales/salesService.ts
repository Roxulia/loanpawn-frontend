import { apiClient } from "../../services/http/apiClient";
import { createIdempotencyKey } from "../../services/http/idempotency";

const writeOptions = () => ({ idempotencyKey: createIdempotencyKey() });

// Keep Sales requests grouped with the existing tenant module services.
export type SaleOrder = { code: string; status: string; currency_code: string; sold_at: string; payment_status: string; delivery_status: string; customer: { code: string; name: string } | null; totals: { amount: number; delivered_value: number; paid_amount: number; receivable_amount: number; undelivered_quantity: string }; payments?: Array<{ code: string; amount: number; payment_amount: number; change_amount: number }>; receivables?: SaleReceivable[]; items: Array<{ code: string; inventory_item_code: string; owned_item_code: string; description: string; ordered_quantity: string; delivered_quantity: string; unit_price: string; line_total: number }> };
export type SaleReceivable = { id: number; code: string; customer_name: string | null; source_code: string | null; delivery_code: string | null; currency_code: string | null; original_amount: string; balance_amount: string; status: string; is_paid: boolean; created_at: string | null; payments?: Array<{ code: string; payment_amount: string; amount_applied: string; change_amount: string }> };
export const salesService = {
  orders: () => apiClient.get<SaleOrder[]>("/tenant/sales/orders"),
  order: (code: string) => apiClient.get<SaleOrder>(`/tenant/sales/orders/${encodeURIComponent(code)}`),
  create: (payload: unknown) => apiClient.post<SaleOrder>("/tenant/sales/orders", payload, writeOptions()),
  action: (code: string, action: "confirm" | "cancel") => apiClient.post<SaleOrder>(`/tenant/sales/orders/${encodeURIComponent(code)}/${action}`, {}, writeOptions()),
  payment: (code: string, payload: unknown) => apiClient.post<SaleOrder>(`/tenant/sales/orders/${encodeURIComponent(code)}/payments`, payload, writeOptions()),
  delivery: (code: string, payload: unknown) => apiClient.post<SaleOrder>(`/tenant/sales/orders/${encodeURIComponent(code)}/deliveries`, payload, writeOptions()),
  receivables: () => apiClient.get<SaleReceivable[]>("/tenant/sales/receivables"),
  collectReceivable: (code: string, payload: unknown) => apiClient.post<SaleReceivable>(`/tenant/sales/receivables/${encodeURIComponent(code)}/payments`, payload, writeOptions()),
};
