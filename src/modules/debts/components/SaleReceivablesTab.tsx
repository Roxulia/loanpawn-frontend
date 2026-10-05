import { useEffect, useState } from "react";
import { Badge, Button, Input } from "../../../components/atoms";
import { Alert, LoadingState } from "../../../components/feedback";
import { FormField } from "../../../components/molecules";
import { DataTable, type DataTableColumn } from "../../../components/organisms";
import { FinancialAccountSelect } from "../../financialAccounts/components/FinancialAccountSelect";
import { salesService, type SaleReceivable } from "../../sales/salesService";
import { usePermissions } from "../../auth";

const today = () => new Date().toISOString().slice(0, 10);

// Keep delivery-linked sale balances visible in the shared Tenant Debt screen.
export function SaleReceivablesTab() {
  const { hasPermission } = usePermissions();
  const canCollect = hasPermission("manage_sale_payment");
  const [rows, setRows] = useState<SaleReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<SaleReceivable | null>(null);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(today());
  const [saving, setSaving] = useState(false);

  // Load the dedicated receivable ledger independently from general Tenant Debt.
  async function load() {
    setLoading(true);
    try { setRows(await salesService.receivables()); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Sale receivables could not be loaded."); }
    finally { setLoading(false); }
  }
  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  // Apply a collection only to the selected delivery receivable.
  async function collect(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !accountId || Number(amount) <= 0) return;
    setSaving(true);
    try {
      const previousChange = (selected.payments ?? []).reduce((sum, payment) => sum + Number(payment.change_amount || 0), 0);
      const updated = await salesService.collectReceivable(selected.code, { financial_account_id: Number(accountId), amount: Number(amount), paid_at: paidAt });
      const change = (updated.payments ?? []).reduce((sum, payment) => sum + Number(payment.change_amount || 0), 0) - previousChange;
      setNotice(change > 0 ? `Payment recorded. Change returned: ${change.toFixed(2)} ${updated.currency_code ?? ""}.` : "Payment recorded. No change was due.");
      setSelected(null); setAmount(""); setAccountId(""); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Payment could not be recorded."); }
    finally { setSaving(false); }
  }

  const columns: Array<DataTableColumn<SaleReceivable>> = [
    { header: "Customer", key: "customer", render: row => row.customer_name ?? "Walk-in" },
    { header: "Sale / Delivery", key: "source", render: row => `${row.source_code ?? "-"} / ${row.delivery_code ?? "-"}` },
    { header: "Original", key: "original", align: "right", render: row => `${row.original_amount} ${row.currency_code ?? ""}` },
    { header: "Balance", key: "balance", align: "right", render: row => <strong>{row.balance_amount} {row.currency_code ?? ""}</strong> },
    { header: "Status", key: "status", render: row => <Badge>{row.status}</Badge> },
  ];

  if (loading) return <LoadingState />;
  return <section className="sale-receivables-tab">
    {error && <Alert tone="danger" title="Sale receivable action failed" message={error} />}
    {notice && <Alert tone="info" title="Collection recorded" message={notice} />}
    <div className="sale-receivables-tab__toolbar"><h2>Sale receivables</h2><Button onClick={() => void load()} variant="secondary">Refresh</Button></div>
    <DataTable columns={columns} items={rows} isLoading={loading} getItemId={row => row.id} getItemTitle={row => row.code} emptyTitle="No sale receivables" emptyDescription="Unpaid delivered sale amounts will appear here." actions={canCollect ? row => row.is_paid ? null : <Button onClick={() => { setSelected(row); setAmount(row.balance_amount); }} variant="secondary">Collect</Button> : undefined} />
    {selected && <form className="sale-receivable-payment" onSubmit={collect}>
      <h3>Collect {selected.code}</h3>
      <FormField id="sale-receivable-date" label="Payment date"><Input id="sale-receivable-date" required type="date" value={paidAt} onChange={event => setPaidAt(event.target.value)} /></FormField>
      <FormField id="sale-receivable-amount" label="Amount tendered"><Input id="sale-receivable-amount" required type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} /></FormField>
      <FinancialAccountSelect id="sale-receivable-account" value={accountId} onChange={setAccountId} matchCurrencyCode={selected.currency_code} />
      <div><Button type="button" onClick={() => setSelected(null)} variant="tertiary">Cancel</Button><Button type="submit" disabled={saving || !accountId}>{saving ? "Saving…" : "Record collection"}</Button></div>
    </form>}
  </section>;
}
