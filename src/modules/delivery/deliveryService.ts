import { apiClient } from "../../services/http/apiClient";
import { createIdempotencyKey } from "../../services/http/idempotency";
const writeOptions = () => ({ idempotencyKey: createIdempotencyKey() });
// Keep API data shapes local to the standalone Delivery feature.
export type Delivery = { code: string; status: string; scheduled_at: string | null; delivered_at: string | null; sales_orders: Array<{ code: string; customer: string | null }>; items: Array<{ code: string; sales_order_code: string; sales_order_line_code: string; description: string; planned_quantity: string; delivered_quantity: string | null }> };
// Group fulfillment and fee requests under the Delivery module.
export const deliveryService = {
  list: () => apiClient.get<Delivery[]>("/tenant/deliveries"),
  schedule: (payload: unknown) => apiClient.post<Delivery>("/tenant/deliveries", payload, writeOptions()),
  dispatch: (code: string) => apiClient.post<Delivery>(`/tenant/deliveries/${encodeURIComponent(code)}/dispatch`, {}),
  complete: (code: string, payload: unknown) => apiClient.post<Delivery>(`/tenant/deliveries/${encodeURIComponent(code)}/complete`, payload, writeOptions()),
  setCharge: (orderCode: string, amount: number) => apiClient.put(`/tenant/deliveries/sales-orders/${encodeURIComponent(orderCode)}/charge`, { amount }),
};