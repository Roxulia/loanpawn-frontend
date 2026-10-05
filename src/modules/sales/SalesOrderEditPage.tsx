import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge, Button, Input, Select } from "../../components/atoms";
import { Alert } from "../../components/feedback";
import { FormField, SectionHeader } from "../../components/molecules";
import { usePermissions } from "../auth";
import type { InventoryLocation } from "../inventory/types";
import { FinancialAccountSelect } from "../financialAccounts/components/FinancialAccountSelect";
import { salesService, type SaleOrder, type SaleReturn } from "./salesService";

const today = () => new Date().toISOString().slice(0, 10);
const errorText = (reason: unknown) => reason instanceof Error ? reason.message : "Sales order action failed.";
type DraftLine = { inventory_item_code: string; owned_item_code: string; quantity: string; unit_price: string };

// Edit drafts and keep completed-sale payments, returns, and refunds on the order page.
export function SalesOrderEditPage() {
  const { orderCode = "" } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("manage_sale");
  const canPay = hasPermission("manage_sale_payment");
  const canReturn = hasPermission("manage_sale_return");
  const [order, setOrder] = useState<SaleOrder | null>(null);
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [customer, setCustomer] = useState("");
  const [currency, setCurrency] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [returnAllocation, setReturnAllocation] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [returnUnitCodes, setReturnUnitCodes] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    if (!orderCode) return;
    setLoading(true);
    try {
      const [current, returnRows] = await Promise.all([salesService.order(orderCode), salesService.returns(orderCode)]);
      setOrder(current); setReturns(returnRows); setCustomer(current.customer?.code ?? ""); setCurrency(current.currency_code);
      setDate(current.sold_at); setNote(current.note ?? "");
      setLines(current.items.map(item => ({ inventory_item_code: item.inventory_item_code, owned_item_code: item.owned_item_code, quantity: item.ordered_quantity, unit_price: item.unit_price })));
      setPaymentAmount(Math.max(0, current.totals.amount - current.totals.paid_amount).toFixed(2));
      setError("");
    } catch (reason) { setError(errorText(reason)); }
    finally { setLoading(false); }
  }, [orderCode]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!canReturn) return;
    void salesService.returnOptions(orderCode).then(rows => {
      const active = rows.filter(row => row.is_active);
      setLocations(active);
      if (active[0]) setReturnLocation(active[0].code);
    }).catch(reason => setError(errorText(reason)));
  }, [canReturn, orderCode]);

  async function saveDraft(event: FormEvent) {
    event.preventDefault(); if (!order || !canEdit) return;
    setBusy(true); setError("");
    try {
      await salesService.update(order.code, {
        customer_code: customer || undefined, currency_code: currency, sold_at: date, note: note || undefined,
        items: lines.map(line => ({ ...line, quantity: Number(line.quantity), unit_price: Number(line.unit_price) })),
      });
      setNotice("Draft sale saved."); await refresh();
    } catch (reason) { setError(errorText(reason)); }
    finally { setBusy(false); }
  }

  async function recordPayment() {
    if (!order || !accountId || Number(paymentAmount) <= 0) return;
    setBusy(true); setError("");
    try {
      await salesService.payment(order.code, { financial_account_id: Number(accountId), amount: Number(paymentAmount), paid_at: today() });
      setNotice("Payment recorded."); await refresh();
    } catch (reason) { setError(errorText(reason)); }
    finally { setBusy(false); }
  }

  async function submitReturn(event: FormEvent) {
    event.preventDefault(); if (!order || !returnAllocation || !returnLocation) return;
    const allocation = order.return_allocations?.find(row => row.code === returnAllocation);
    const location = locations.find(row => row.code === returnLocation);
    if (!allocation || !location) return;
    setBusy(true); setError("");
    try {
      await salesService.createReturn(order.code, {
        returned_at: today(), note: returnNote || undefined, financial_account_id: accountId ? Number(accountId) : undefined,
        items: [{
          delivery_allocation_code: allocation.code, location_code: location.code,
          quantity: Number(returnQuantity), disposition: location.is_sellable ? "RESTOCK" : "QUARANTINE",
          inventory_unit_codes: returnUnitCodes ? returnUnitCodes.split(",").map(code => code.trim()).filter(Boolean) : undefined,
        }],
      });
      setNotice("Return recorded. Any refund due was recorded against the selected account.");
      setReturnQuantity(""); setReturnUnitCodes(""); setReturnNote(""); await refresh();
    } catch (reason) { setError(errorText(reason)); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="page-content"><SectionHeader title="Sales order" /><p>Loading order…</p></main>;
  if (!order) return <main className="page-content"><SectionHeader title="Sales order" /><Alert tone="danger" title="Unable to load order" message={error || "Sale not found."} /><Link to="/sales">Back to Sales</Link></main>;
  const isDraft = order.status === "DRAFT";
  const selectedAllocation = order.return_allocations?.find(row => row.code === returnAllocation);
  const remainingReturn = selectedAllocation ? Math.max(0, Number(selectedAllocation.quantity) - Number(selectedAllocation.returned_quantity)) : 0;
  const selectedLocation = locations.find(location => location.code === returnLocation);

  return <main className="page-content sales-order-layout">
    <SectionHeader title={`Sales order ${order.code}`} subtitle={`${order.status} · ${order.customer?.name ?? "Walk-in"}`} action={<Button onClick={() => navigate("/sales")}>Back to Sales</Button>} />
    {error && <Alert tone="danger" title="Sales order action failed" message={error} />}
    {notice && <Alert tone="info" title="Sales order updated" message={notice} />}
    <section className="sales-order-panel">
      <h2>Order summary</h2>
      <p><Badge>{order.payment_status}</Badge> <Badge>{order.delivery_status}</Badge></p>
      <p>{order.totals.delivered_value} delivered · {order.totals.paid_amount} paid · {order.totals.receivable_amount} receivable · {order.totals.undelivered_quantity} units remain</p>
    </section>
    {isDraft ? <form className="sales-order-panel" onSubmit={saveDraft}>
      <h2>Edit draft sale</h2>
      <FormField id="edit-sale-customer" label="Customer code (optional)"><Input id="edit-sale-customer" value={customer} onChange={event => setCustomer(event.target.value)} /></FormField>
      <FormField id="edit-sale-currency" label="Currency"><Input id="edit-sale-currency" value={currency} onChange={event => setCurrency(event.target.value.toUpperCase())} required /></FormField>
      <FormField id="edit-sale-date" label="Sale date"><Input id="edit-sale-date" type="date" value={date} onChange={event => setDate(event.target.value)} required /></FormField>
      <FormField id="edit-sale-note" label="Note"><Input id="edit-sale-note" value={note} onChange={event => setNote(event.target.value)} /></FormField>
      {lines.map((line, index) => <div className="sales-order-line-editor" key={index}>
        <FormField id={`line-item-${index}`} label="Inventory item"><Input id={`line-item-${index}`} value={line.inventory_item_code} onChange={event => setLines(rows => rows.map((row, i) => i === index ? { ...row, inventory_item_code: event.target.value } : row))} required /></FormField>
        <FormField id={`line-owned-${index}`} label="Owned item"><Input id={`line-owned-${index}`} value={line.owned_item_code} onChange={event => setLines(rows => rows.map((row, i) => i === index ? { ...row, owned_item_code: event.target.value } : row))} required /></FormField>
        <FormField id={`line-quantity-${index}`} label="Quantity"><Input id={`line-quantity-${index}`} type="number" min="0.001" step="0.001" value={line.quantity} onChange={event => setLines(rows => rows.map((row, i) => i === index ? { ...row, quantity: event.target.value } : row))} required /></FormField>
        <FormField id={`line-price-${index}`} label="Unit price"><Input id={`line-price-${index}`} type="number" min="0" step="0.01" value={line.unit_price} onChange={event => setLines(rows => rows.map((row, i) => i === index ? { ...row, unit_price: event.target.value } : row))} required /></FormField>
        <Button type="button" disabled={lines.length <= 1} onClick={() => setLines(rows => rows.filter((_, i) => i !== index))}>Remove</Button>
      </div>)}
      <div className="sales-order-actions"><Button type="button" onClick={() => setLines(rows => [...rows, { inventory_item_code: "", owned_item_code: "", quantity: "1", unit_price: "0" }])}>Add item</Button>{canEdit && <Button type="submit" variant="primary" disabled={busy}>Save draft</Button>}</div>
    </form> : <>
      {canPay && order.status !== "CANCELLED" && <section className="sales-order-panel">
        <h2>Record payment</h2>
        <FinancialAccountSelect id="order-payment-account" value={accountId} onChange={setAccountId} matchCurrencyCode={order.currency_code} />
        <FormField id="order-payment-amount" label="Amount"><Input id="order-payment-amount" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={event => setPaymentAmount(event.target.value)} /></FormField>
        <Button disabled={busy || !accountId || Number(paymentAmount) <= 0} onClick={() => void recordPayment()}>Record payment</Button>
      </section>}
      {canReturn && order.return_allocations?.some(row => Number(row.quantity) > Number(row.returned_quantity)) && <form className="sales-order-panel sales-return-form" onSubmit={submitReturn}>
        <h2>Record return</h2>
        <FormField id="return-allocation" label="Fulfilled item"><Select id="return-allocation" value={returnAllocation} onChange={event => { setReturnAllocation(event.target.value); setReturnQuantity(""); }}><option value="">Select item</option>{order.return_allocations.filter(row => Number(row.quantity) > Number(row.returned_quantity)).map(row => <option key={row.code} value={row.code}>{row.item_description} · {row.code} · remaining {Number(row.quantity) - Number(row.returned_quantity)}</option>)}</Select></FormField>
        <FormField id="return-quantity" label={`Return quantity (up to ${remainingReturn})`}><Input id="return-quantity" type="number" min={selectedAllocation?.tracking_mode === "SERIALIZED" ? 1 : 0.001} step={selectedAllocation?.tracking_mode === "SERIALIZED" ? 1 : 0.001} max={remainingReturn} value={returnQuantity} onChange={event => setReturnQuantity(event.target.value)} required /></FormField>
        <FormField id="return-location" label="Return inventory location"><Select id="return-location" value={returnLocation} onChange={event => setReturnLocation(event.target.value)} required><option value="">Select location</option>{locations.map(location => <option key={location.code} value={location.code}>{location.name}{location.is_sellable ? " · sellable" : " · quarantine"}</option>)}</Select></FormField>
        {selectedAllocation?.tracking_mode === "SERIALIZED" && <FormField id="return-unit-codes" label={`Unit codes (comma separated; available: ${(selectedAllocation.unit_codes ?? []).join(", ")})`}><Input id="return-unit-codes" value={returnUnitCodes} onChange={event => setReturnUnitCodes(event.target.value)} /></FormField>}
        <FormField id="return-note" label="Return note"><Input id="return-note" value={returnNote} onChange={event => setReturnNote(event.target.value)} /></FormField>
        {selectedLocation?.is_sellable === false && <p>Returned goods will be quarantined at this location.</p>}
        <FinancialAccountSelect id="return-refund-account" value={accountId} onChange={setAccountId} matchCurrencyCode={order.currency_code} />
        <Button type="submit" variant="primary" disabled={busy || !returnAllocation || !returnLocation || Number(returnQuantity) <= 0 || Number(returnQuantity) > remainingReturn}>Record return and refund</Button>
      </form>}
    </>}
    <section className="sales-order-panel sales-order-history"><h2>Payment and receivable history</h2>
      {(order.payments ?? []).map(payment => <article key={payment.code}><strong>{payment.code}</strong><span>{payment.amount} paid · change {payment.change_amount}</span></article>)}
      {(order.receivables ?? []).map(receivable => <article key={receivable.code}><strong>{receivable.code}</strong><span>{receivable.balance_amount} remaining</span></article>)}
      {!(order.payments?.length) && !(order.receivables?.length) && <p>No payments or receivables recorded.</p>}
    </section>
    <section className="sales-order-panel sales-order-history"><h2>Returns and refunds</h2>
      {returns.map(row => <article key={row.code}><strong>{row.code} · {row.returned_at}</strong><span>{row.total_amount} returned · {row.receivable_credit_amount} receivable credit · {row.cash_refund_amount} refunded</span></article>)}
      {returns.length === 0 && <p>No returns recorded.</p>}
    </section>
  </main>;
}