import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Input } from "../../components/atoms";
import { Alert } from "../../components/feedback";
import { FormField, SectionHeader } from "../../components/molecules";
import { DataTable, type DataTableColumn } from "../../components/organisms";
import { FinancialAccountSelect } from "../financialAccounts/components/FinancialAccountSelect";
import { salesService, type SaleOrder } from "./salesService";

const today = () => new Date().toISOString().slice(0, 10);
const message = (reason: unknown) => reason instanceof Error ? reason.message : "Sales action failed.";
const totalChange = (order: SaleOrder) => (order.payments ?? []).reduce((sum, payment) => sum + Number(payment.change_amount || 0), 0)
  + (order.receivables ?? []).reduce((sum, receivable) => sum + (receivable.payments ?? []).reduce((paid, payment) => paid + Number(payment.change_amount || 0), 0), 0);

// Manage draft orders and quick sales that deliver goods immediately.
export function SalesPage() {
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [selected, setSelected] = useState<SaleOrder | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemCode, setItemCode] = useState("");
  const [ownedCode, setOwnedCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("");
  const [customer, setCustomer] = useState("");
  const [account, setAccount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [deliverNow, setDeliverNow] = useState(true);
  const [deliveryDate, setDeliveryDate] = useState(today());

  // Reload orders and refresh the selected order after lifecycle actions.
  const currentSelectedCode = selected?.code;
  const refresh = useCallback(async (code?: string) => {
    setLoading(true);
    try {
      const list = await salesService.orders();
      setOrders(list);
      const selectedCode = code ?? currentSelectedCode;
      if (selectedCode) setSelected(await salesService.order(selectedCode));
      setError("");
    } catch (reason) { setError(message(reason)); }
    finally { setLoading(false); }
  }, [currentSelectedCode]);

  // Load the latest order registry when the workspace opens.
  useEffect(() => { queueMicrotask(() => { void refresh(); }); }, [refresh]);

  // Create a draft, then run the same staged actions as Purchasing quick flow when delivery is enabled.
  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setProgress("");
    let created: SaleOrder | null = null;
    try {
      if (deliverNow && Number(deposit) > 0 && !account) throw new Error("Choose the account that receives the down payment.");
      created = await salesService.create({
        currency_code: currency, sold_at: deliveryDate, customer_code: customer || undefined,
        items: [{ inventory_item_code: itemCode, owned_item_code: ownedCode, quantity: Number(quantity), unit_price: Number(price) }],
      });
      setSelected(created);
      if (!deliverNow) {
        setProgress("Draft saved. Confirm the sale and record delivery when ready.");
        await refresh(created.code);
        return;
      }
      setProgress("Sale saved. Reserving FIFO inventory...");
      await salesService.action(created.code, "confirm");
      if (Number(deposit) > 0) {
      setProgress("Sale confirmed. Recording the customer deposit...");
        const paymentOrder = await salesService.payment(created.code, { financial_account_id: Number(account), amount: Number(deposit), paid_at: deliveryDate });
        if (totalChange(paymentOrder) > 0) setProgress(`Deposit recorded. Change returned: ${totalChange(paymentOrder).toFixed(2)} ${paymentOrder.currency_code}.`);
      }
      setProgress("Order confirmed. Schedule fulfillment in the standalone Delivery module.");
      const finalOrder = await salesService.order(created.code);
      const change = totalChange(finalOrder);
      setProgress(change > 0 ? `Sale confirmed. Change returned: ${change.toFixed(2)} ${finalOrder.currency_code}.` : "Sale confirmed. Schedule fulfillment in Delivery when ready.");
      await refresh(created.code);
    } catch (reason) {
      setError(message(reason));
      if (created) {
        let current: SaleOrder = created;
        try { current = await salesService.order(created.code); } catch { /* Keep the order created before the failed follow-up step. */ }
        const change = totalChange(current);
        setSelected(current);
        setProgress(change > 0
          ? `The sale was saved. Change returned: ${change.toFixed(2)} ${current.currency_code}. Continue from the last completed step below.`
          : "The sale was saved. Open it below to continue from the last completed step.");
        void refresh(created.code);
      }
    } finally { setSaving(false); }
  }

  // Keep the registry focused on payment and delivery status.
  const columns: Array<DataTableColumn<SaleOrder>> = [
    { header: "Sale", key: "code", render: row => <strong>{row.code}</strong> },
    { header: "Customer", key: "customer", render: row => row.customer?.name ?? "Walk-in" },
    { header: "Total", key: "total", render: row => `${row.totals.amount} ${row.currency_code}` },
    { header: "Payment", key: "payment", render: row => <Badge>{row.payment_status}</Badge> },
    { header: "Delivery", key: "delivery", render: row => <Badge>{row.delivery_status}</Badge> },
  ];

  // Show the quick-sale form, order registry, and resumable selected-order actions.
  return <main className="page-content">
    <SectionHeader title="Sales" subtitle="Manage customer orders, down payments, FIFO delivery, and receivables." />
    {error && <Alert tone="danger" title="Sales action failed" message={error} />}
    {progress && <Alert tone="info" title="Sale progress" message={progress} />}
    <form onSubmit={create} className="purchasing-form">
      <h2>Quick sale</h2>
      <label><input type="checkbox" checked={deliverNow} onChange={event => setDeliverNow(event.target.checked)} /> Confirm order</label>
      <FormField id="sale-customer" label="Customer code (optional)"><Input id="sale-customer" value={customer} onChange={event => setCustomer(event.target.value)} /></FormField>
      <FormField id="sale-currency" label="Currency code"><Input id="sale-currency" required value={currency} onChange={event => setCurrency(event.target.value.toUpperCase())} /></FormField>
      <FormField id="sale-item" label="Inventory item code"><Input id="sale-item" required value={itemCode} onChange={event => setItemCode(event.target.value)} /></FormField>
      <FormField id="sale-owned" label="Owned item code"><Input id="sale-owned" required value={ownedCode} onChange={event => setOwnedCode(event.target.value)} /></FormField>
      <FormField id="sale-quantity" label="Order quantity"><Input id="sale-quantity" required type="number" min="0.001" step="0.001" value={quantity} onChange={event => { setQuantity(event.target.value); }} /></FormField>
      <FormField id="sale-price" label="Unit price"><Input id="sale-price" required type="number" min="0" step="0.01" value={price} onChange={event => setPrice(event.target.value)} /></FormField>
      <FormField id="sale-date" label="Sale date"><Input id="sale-date" required type="date" value={deliveryDate} onChange={event => setDeliveryDate(event.target.value)} /></FormField>
      {deliverNow && <><FormField id="sale-deposit" label="Amount tendered (optional)"><Input id="sale-deposit" type="number" min="0" step="0.01" value={deposit} onChange={event => setDeposit(event.target.value)} /></FormField>{Number(deposit)>0 && <FinancialAccountSelect id="sale-account" value={account} onChange={setAccount} matchCurrencyCode={currency} />}</>}


      <Button type="submit" variant="primary" disabled={saving}>{saving ? "Processing…" : deliverNow ? "Create and confirm" : "Save draft sale"}</Button>
    </form>
    <DataTable columns={columns} items={orders} isLoading={loading} getItemId={order => order.code} getItemTitle={order => order.code} onRowClick={row => void refresh(row.code)} emptyTitle="No sales yet" emptyDescription="Create a quick sale or save a draft to begin." />
    {selected && <section className="purchasing-form">
      <h2>{selected.code} · {selected.status}</h2>
      <p>{selected.totals.delivered_value} delivered · {selected.totals.paid_amount} paid · {selected.totals.receivable_amount} receivable · {selected.totals.undelivered_quantity} units remain in inventory</p>
      {selected.status === "DRAFT" && <Button onClick={async () => { await salesService.action(selected.code, "confirm"); await refresh(selected.code); }}>Confirm and reserve FIFO stock</Button>}
      {selected.status === "CONFIRMED" && <p>Schedule this order in the Delivery module to fulfill inventory.</p>}
      {!['CANCELLED'].includes(selected.status) && <div className="purchase-item">
        <FinancialAccountSelect id="sale-account-followup" value={account} onChange={setAccount} matchCurrencyCode={selected.currency_code} />
        <FormField id="sale-pay-amount" label="Amount tendered"><Input id="sale-pay-amount" type="number" min="0.01" step="0.01" value={deposit} onChange={event => setDeposit(event.target.value)} /></FormField>
        <Button disabled={!account || !deposit} onClick={async () => { const before = totalChange(selected); const updated = await salesService.payment(selected.code, { financial_account_id: Number(account), amount: Number(deposit), paid_at: today() }); const change = totalChange(updated) - before; setProgress(change > 0 ? `Payment recorded. Change returned: ${change.toFixed(2)} ${updated.currency_code}.` : "Payment recorded. No change was due."); setDeposit(""); await refresh(selected.code); }}>Record payment</Button>
      </div>}
    </section>}
  </main>;
}
