import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, Input } from "../../components/atoms";
import { Alert } from "../../components/feedback";
import { FormField, SectionHeader } from "../../components/molecules";
import { DataTable, type DataTableColumn } from "../../components/organisms";
import { Can } from "../auth/Can";
import { salesService, type SaleOrder } from "../sales/salesService";
import { deliveryService, type Delivery } from "./deliveryService";
import "./delivery.css";
const today = () => new Date().toISOString().slice(0, 10);
// Manage delivery planning and fees independently from Sales.
export function DeliveryPage() {
  const [orders, setOrders] = useState<SaleOrder[]>([]); const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [rows, setRows] = useState([{ sales_order_code: "", sales_order_line_code: "", quantity: "1" }]);
  const [charges, setCharges] = useState<Record<string, string>>({}); const [scheduledAt, setScheduledAt] = useState(today());
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  // Load tenant order choices and existing fulfillment plans.
  const refresh = useCallback(async () => { setLoading(true); try { const [a,b] = await Promise.all([salesService.orders(),deliveryService.list()]); setOrders(a); setDeliveries(b); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load deliveries."); } finally { setLoading(false); } }, []);
  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);
  // Schedule multiple sales order lines as one Delivery.
  async function schedule(event: FormEvent) { event.preventDefault(); try { await deliveryService.schedule({ scheduled_at: scheduledAt, items: rows.map(row => ({ ...row, quantity: Number(row.quantity) })) }); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Could not schedule delivery."); } }
  // Define fulfillment register columns and available actions.
  const columns: Array<DataTableColumn<Delivery>> = [
    { header: "Delivery", key: "code", render: row => <strong>{row.code}</strong> }, { header: "Status", key: "status", render: row => row.status },
    { header: "Scheduled", key: "scheduled", render: row => row.scheduled_at ?? "—" }, { header: "Sales orders", key: "orders", render: row => row.sales_orders.map(x => x.code).join(", ") },
    { header: "Items", key: "items", render: row => row.items.length }, { header: "Actions", key: "actions", render: row => <div className="delivery-actions">
      {row.status === "PLANNED" && <Can permission="manage_delivery"><Button onClick={async () => { await deliveryService.dispatch(row.code); await refresh(); }}>Dispatch</Button></Can>}
      {["PLANNED","IN_TRANSIT"].includes(row.status) && <Can permission="manage_delivery"><Button variant="primary" onClick={async () => { await deliveryService.complete(row.code,{ delivered_at: today(), items: row.items.map(x => ({ delivery_item_code: x.code, delivered_quantity: Number(x.planned_quantity) })) }); await refresh(); }}>Complete</Button></Can>}
    </div> },
  ];
  // Keep fee, schedule, and register sections usable on mobile and desktop.
  return <main className="page-content delivery-page"><SectionHeader title="Delivery" subtitle="Plan multi-order fulfillment, dispatch goods, and record completed quantities." />
    {error && <Alert tone="danger" title="Delivery action failed" message={error} />}
    <Can permission="manage_delivery_fee"><section className="delivery-panel"><h2>Delivery fees</h2><p>Fees are recognized as linked deliveries are completed.</p><div className="delivery-fee-grid">{orders.filter(order => order.status === "DRAFT").map(order => <div className="delivery-fee-row" key={order.code}><strong>{order.code}</strong><span>{order.customer?.name ?? "Walk-in"}</span>
      <Input aria-label={`Fee for ${order.code}`} type="number" min="0" step="0.01" value={charges[order.code] ?? ""} onChange={e => setCharges(current => ({ ...current,[order.code]:e.target.value }))} />
      <Button onClick={async () => { try { await deliveryService.setCharge(order.code,Number(charges[order.code] || 0)); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save fee."); } }}>Save fee</Button></div>)}</div></section></Can><Can permission="manage_delivery"><form className="delivery-panel delivery-schedule-form" onSubmit={schedule}><h2>Schedule fulfillment</h2><FormField id="delivery-date" label="Scheduled date"><Input id="delivery-date" type="date" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} /></FormField>
      {rows.map((row,i) => <div className="delivery-line-row" key={i}><FormField id={`order-${i}`} label="Sales order"><select id={`order-${i}`} required value={row.sales_order_code} onChange={e => setRows(current => current.map((x,j) => j===i ? { sales_order_code:e.target.value,sales_order_line_code:"",quantity:x.quantity } : x))}><option value="">Select confirmed order</option>{orders.filter(x => x.status === "CONFIRMED").map(x => <option key={x.code} value={x.code}>{x.code} · {x.customer?.name ?? "Walk-in"}</option>)}</select></FormField>
      <FormField id={`line-${i}`} label="Sales order line"><select id={`line-${i}`} required value={row.sales_order_line_code} onChange={e => setRows(current => current.map((x,j) => j===i ? { ...x,sales_order_line_code:e.target.value } : x))}><option value="">Select line</option>{orders.find(x => x.code===row.sales_order_code)?.items.filter(x => Number(x.ordered_quantity)>Number(x.delivered_quantity)).map(x => <option key={x.code} value={x.code}>{x.description} · {x.code}</option>)}</select></FormField>
      <FormField id={`quantity-${i}`} label="Quantity"><Input id={`quantity-${i}`} type="number" min="0.001" step="0.001" value={row.quantity} onChange={e => setRows(current => current.map((x,j) => j===i ? { ...x,quantity:e.target.value } : x))} /></FormField>
      {rows.length>1 && <Button type="button" onClick={() => setRows(current => current.filter((_,j)=>j!==i))}>Remove</Button>}</div>)}
      <div className="delivery-actions"><Button type="button" onClick={() => setRows(current => [...current,{ sales_order_code:"",sales_order_line_code:"",quantity:"1" }])}>Add order line</Button><Button type="submit" variant="primary">Schedule delivery</Button></div></form></Can><section className="delivery-panel"><h2>Delivery schedule</h2><DataTable columns={columns} items={deliveries} isLoading={loading} getItemId={x=>x.code} getItemTitle={x=>x.code} emptyTitle="No deliveries yet" emptyDescription="Schedule fulfillment for one or more confirmed sales orders." /></section>
  </main>;
}