import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Badge, Button, Input } from "../../components/atoms";
import { Alert } from "../../components/feedback";
import { FormField, SectionHeader } from "../../components/molecules";
import { DataTable, type DataTableColumn } from "../../components/organisms";
import { useFeatures, usePermissions } from "../auth";
import { FinancialAccountSelect } from "../financialAccounts/components/FinancialAccountSelect";
import { routePaths } from "../../app/routes/paths";
import { salesService, type SaleOrder } from "./salesService";
import "./sales.css";

const today = () => new Date().toISOString().slice(0, 10);
const message = (reason: unknown) => reason instanceof Error ? reason.message : "Sales action failed.";

// Make immediate stock transfer and sale recognition the default Sales workflow.
export function SalesPage() {
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemCode, setItemCode] = useState("");
  const [ownedCode, setOwnedCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("");
  const [customer, setCustomer] = useState("");
  const [account, setAccount] = useState("");
  const [tender, setTender] = useState("");
  const [saleDate, setSaleDate] = useState(today());
  const [saveForDelivery, setSaveForDelivery] = useState(false);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { hasEnabledFeature } = useFeatures();
  const canCreateSale = hasPermission("manage_sale");
  const canTakePayment = hasPermission("manage_sale_payment");
  const deliveryEnabled = hasEnabledFeature("delivery_management");
  const total = useMemo(() => Math.round(Number(quantity || 0) * Number(price || 0) * 100) / 100, [quantity, price]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setOrders(await salesService.orders()); setError(""); }
    catch (reason) { setError(message(reason)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);
  useEffect(() => { if (canTakePayment) setTender(total.toFixed(2)); else setTender("0"); }, [canTakePayment, total]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const orderPayload = {
        currency_code: currency, sold_at: saleDate, customer_code: customer || undefined,
        items: [{ inventory_item_code: itemCode, owned_item_code: ownedCode, quantity: Number(quantity), unit_price: Number(price) }],
      };
      if (saveForDelivery) {
        const draft = await salesService.create(orderPayload);
        const confirmed = await salesService.action(draft.code, "confirm");
        await refresh();
        navigate(routePaths.salesOrderEdit(confirmed.code));
        return;
      }
      const completed = await salesService.quickSale({
        ...orderPayload, tender_amount: canTakePayment ? Number(tender || 0) : 0,
        ...(canTakePayment && Number(tender) > 0 ? { financial_account_id: Number(account) } : {}),
      });
      await refresh();
      navigate(routePaths.salesOrderEdit(completed.code));
    } catch (reason) { setError(message(reason)); }
    finally { setSaving(false); }
  }

  const columns: Array<DataTableColumn<SaleOrder>> = [
    { header: "Sale", key: "code", render: row => <strong>{row.code}</strong> },
    { header: "Customer", key: "customer", render: row => row.customer?.name ?? "Walk-in" },
    { header: "Total", key: "total", render: row => `${row.totals.amount} ${row.currency_code}` },
    { header: "Payment", key: "payment", render: row => <Badge>{row.payment_status}</Badge> },
    { header: "Delivery", key: "delivery", render: row => <Badge>{row.delivery_status}</Badge> },
  ];

  return <main className="page-content sales-page">
    <SectionHeader title="Sales" subtitle="Complete counter sales now, or save orders for later delivery." />
    {error && <Alert tone="danger" title="Sales action failed" message={error} />}
    {canCreateSale && <form onSubmit={create} className="sales-quick-form">
      <h2>Quick sale</h2>
      {deliveryEnabled && <label className="sales-defer-option"><input type="checkbox" checked={saveForDelivery} onChange={event => setSaveForDelivery(event.target.checked)} /> Save as an order for later delivery</label>}
      <FormField id="sale-customer" label="Customer code (optional)"><Input id="sale-customer" value={customer} onChange={event => setCustomer(event.target.value)} /></FormField>
      <FormField id="sale-currency" label="Currency code"><Input id="sale-currency" required value={currency} onChange={event => setCurrency(event.target.value.toUpperCase())} /></FormField>
      <FormField id="sale-item" label="Inventory item code"><Input id="sale-item" required value={itemCode} onChange={event => setItemCode(event.target.value)} /></FormField>
      <FormField id="sale-owned" label="Owned item code"><Input id="sale-owned" required value={ownedCode} onChange={event => setOwnedCode(event.target.value)} /></FormField>
      <FormField id="sale-quantity" label="Quantity"><Input id="sale-quantity" required type="number" min="0.001" step="0.001" value={quantity} onChange={event => setQuantity(event.target.value)} /></FormField>
      <FormField id="sale-price" label="Unit price"><Input id="sale-price" required type="number" min="0" step="0.01" value={price} onChange={event => setPrice(event.target.value)} /></FormField>
      <FormField id="sale-date" label="Sale date"><Input id="sale-date" required type="date" value={saleDate} onChange={event => setSaleDate(event.target.value)} /></FormField>
      {!saveForDelivery && canTakePayment && <>
        <FormField id="sale-tender" label={`Amount tendered (total ${total.toFixed(2)} ${currency || ""})`}><Input id="sale-tender" type="number" min="0" step="0.01" value={tender} onChange={event => setTender(event.target.value)} /></FormField>
        {Number(tender) > 0 && <FinancialAccountSelect id="sale-account" value={account} onChange={setAccount} matchCurrencyCode={currency} />}
      </>}
      {!saveForDelivery && !canTakePayment && <p className="sales-receivable-note">Payment permission is not assigned; the sale total will be recorded as a receivable.</p>}
      <Button type="submit" variant="primary" disabled={saving || (!saveForDelivery && canTakePayment && Number(tender) > 0 && !account)}>{saving ? "Processing…" : saveForDelivery ? "Save order for delivery" : "Complete sale"}</Button>
    </form>}
    <DataTable columns={columns} items={orders} isLoading={loading} getItemId={order => order.code} getItemTitle={order => order.code} onRowClick={row => navigate(routePaths.salesOrderEdit(row.code))} emptyTitle="No sales yet" emptyDescription="Complete a counter sale or save an order for later delivery." />
  </main>;
}
