import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Badge, Button } from "../../../components/atoms";
import { Alert, EmptyState, LoadingState } from "../../../components/feedback";
import { Card, ConfirmDialog, DataCard, SearchField, SectionHeader, TableToolbar } from "../../../components";
import { routePaths } from "../../../app/routes/paths";
import type { TenantScheduledExpense } from "../../../dataobjects/tenant/finance";
import { tenantResourceService } from "../../../services/tenant/tenantResourceService";
import { usePermissions } from "../../auth/usePermissions";
import { AccountCurrencyAmount } from "../../finance/AccountCurrencyAmount";
import { EditIcon, PauseIcon, PlayIcon, TrashIcon, ViewIcon } from "../../../components/icons/icon";
import "../scheduledExpenses.css";

export function ScheduledExpensesPage() {
  const navigate = useNavigate(); const { hasPermission } = usePermissions();
  const [items, setItems] = useState<TenantScheduledExpense[]>([]); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [lastPage, setLastPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(""); const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TenantScheduledExpense | null>(null); const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { setLoading(true); setError(null); try {
    const result = await tenantResourceService.listScheduledExpenses({ page, perPage: 15, search }); setItems(result.items);
    setLastPage(result.last_page ?? 1); setTotal(result.total);
  } catch (e) { setError(e instanceof Error ? e.message : "Unable to load scheduled expenses."); } finally { setLoading(false); } }, [page, search]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function toggle(item: TenantScheduledExpense) { setBusy(true); setError(null); try {
    if (item.status === "paused") await tenantResourceService.resumeScheduledExpense(item.code); else await tenantResourceService.pauseScheduledExpense(item.code);
    await load();
  } catch (e) { setError(e instanceof Error ? e.message : "Unable to update scheduled expense."); } finally { setBusy(false); } }
  async function remove() { if (!deleting) return; setBusy(true); try { await tenantResourceService.deleteScheduledExpense(deleting.code); setDeleting(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to delete scheduled expense."); } finally { setBusy(false); } }

  const actions = (item: TenantScheduledExpense): ReactNode => <div className="scheduled-expense-actions">
    <Button aria-label={`View ${item.code}`} className="ui-button--icon" title="View schedule" variant="secondary"
      onClick={() => navigate(routePaths.scheduledExpenseDetail(item.code))}><ViewIcon /></Button>
    {hasPermission("update_scheduled_expense") ? <>
      <Button aria-label={`${item.status === "paused" ? "Resume" : "Pause"} ${item.code}`} className="ui-button--icon"
        title={item.status === "paused" ? "Resume schedule" : "Pause schedule"} variant="secondary"
        disabled={busy || item.status === "completed"} onClick={() => void toggle(item)}>
        {item.status === "paused" ? <PlayIcon /> : <PauseIcon />}
      </Button>
      <Button aria-label={`Edit ${item.code}`} className="ui-button--icon" title="Edit schedule" variant="secondary"
        onClick={() => navigate(routePaths.scheduledExpenseEdit(item.code))}><EditIcon /></Button>
    </> : null}
    {hasPermission("delete_scheduled_expense") ? <Button aria-label={`Delete ${item.code}`} className="ui-button--icon"
      title="Delete schedule" variant="danger" onClick={() => setDeleting(item)}><TrashIcon /></Button> : null}
  </div>;

  return <section className="page scheduled-expense-list-page">
    <SectionHeader title="Scheduled Expenses" subtitle="Manage automatic and recurring shop expense payments."
      action={hasPermission("create_scheduled_expense") ? <Button variant="primary" onClick={() => navigate(routePaths.scheduledExpenseCreate)}>Create Schedule</Button> : null} />
    <Card title="Expense schedules" description={`${total} total schedule${total === 1 ? "" : "s"}`}>
      {error ? <Alert tone="danger" title="Scheduled expense action failed" message={error} onDismiss={() => setError(null)} /> : null}
      <TableToolbar search={<SearchField id="scheduled-expense-search" label="Filter schedules" value={search} placeholder="Code or description" onChange={(e) => { setSearch(e.target.value); setPage(1); }} />}
        actions={<Button variant="secondary" onClick={() => void load()}>Refresh</Button>} />
      {loading ? <LoadingState rows={5} /> : items.length === 0 ? <EmptyState title="No scheduled expenses" description="Create a schedule to automate regular payments." /> : <>
        <ScheduledExpenseDesktopTable items={items} actions={actions} />
        <ScheduledExpenseMobileCards items={items} actions={actions} />
      </>}
      <div className="ui-pagination"><span className="ui-pagination__meta">Page {page} of {lastPage} - {total} records</span>
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <Button variant="secondary" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
    </Card>
    <ConfirmDialog isOpen={Boolean(deleting)} isLoading={busy} title="Delete scheduled expense" confirmLabel="Delete Schedule"
      message={`Delete schedule ${deleting?.code ?? ""}? Pending payments will be cancelled; paid expenses remain.`} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} />
  </section>;
}

function ScheduledExpenseDesktopTable({ items, actions }: { items: TenantScheduledExpense[]; actions: (item: TenantScheduledExpense) => ReactNode }) {
  // Desktop markup remains independent from the compact mobile card layout so
  // each breakpoint can evolve without shared table-specific CSS assumptions.
  return <div className="scheduled-expense-list--desktop"><table className="scheduled-expense-table"><thead><tr><th>Schedule</th><th>Amount</th><th>Recurrence</th><th>Next payment</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.description}</strong><small>{item.code}</small></td><td><AccountCurrencyAmount accountId={item.account_id} amount={item.amount} /></td>
      <td>{formatRecurrence(item)}</td><td>{nextPayment(item)}</td><td><Status item={item} /></td><td>{actions(item)}</td></tr>)}</tbody></table></div>;
}

function ScheduledExpenseMobileCards({ items, actions }: { items: TenantScheduledExpense[]; actions: (item: TenantScheduledExpense) => ReactNode }) {
  // Mobile cards expose the same actions and financial state in a touch-friendly
  // layout rather than relying on horizontal table scrolling.
  return <div className="scheduled-expense-list--mobile">{items.map((item) => <DataCard key={item.id} className="scheduled-expense-mobile-card" title={item.description} actions={actions(item)}
    items={[{ key: "Amount", value: <AccountCurrencyAmount accountId={item.account_id} amount={item.amount} /> }, { key: "Recurrence", value: formatRecurrence(item) },
      { key: "Next payment", value: nextPayment(item) }, { key: "Status", value: <Status item={item} /> }]} />)}</div>;
}
function Status({ item }: { item: TenantScheduledExpense }) { const failed = item.last_result === "failed"; return <div className="scheduled-expense-status" title={item.last_error ?? undefined}><Badge tone={failed ? "danger" : item.status === "active" ? "success" : "warning"}>{failed ? "Failed" : item.status}</Badge>{item.pending_count > 0 ? <small>{item.pending_count} pending</small> : item.last_paid_at ? <small>Last paid {new Date(item.last_paid_at).toLocaleString()}</small> : <small>Not paid yet</small>}</div>; }
function formatRecurrence(item: TenantScheduledExpense) { return item.recurrence_type.replace("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }
function nextPayment(item: TenantScheduledExpense) { return item.next_due_date ? `${item.next_due_date} ${item.scheduled_time.slice(0, 5)}` : "Complete"; }
