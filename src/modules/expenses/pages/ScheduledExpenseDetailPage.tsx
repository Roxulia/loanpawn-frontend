import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert, EmptyState, LoadingState } from "../../../components/feedback";
import { Badge, Button } from "../../../components/atoms";
import { Card, ConfirmDialog, DataCard, SectionHeader } from "../../../components";
import { routePaths } from "../../../app/routes/paths";
import type { TenantScheduledExpense, TenantScheduledExpenseOccurrence } from "../../../dataobjects/tenant/finance";
import { tenantResourceService } from "../../../services/tenant/tenantResourceService";
import { usePermissions } from "../../auth/usePermissions";
import { AccountCurrencyAmount } from "../../finance/AccountCurrencyAmount";
import "../scheduledExpenses.css";

export function ScheduledExpenseDetailPage() {
  const { scheduleCode } = useParams(); const navigate = useNavigate(); const { hasPermission } = usePermissions();
  const [schedule, setSchedule] = useState<TenantScheduledExpense | null>(null);
  const [history, setHistory] = useState<TenantScheduledExpenseOccurrence[]>([]);
  const [page, setPage] = useState(1); const [lastPage, setLastPage] = useState(1); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false); const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!scheduleCode) return;
    setLoading(true); setError(null);
    try {
      const [detail, payments] = await Promise.all([
        tenantResourceService.getScheduledExpense(scheduleCode),
        tenantResourceService.listScheduledExpenseOccurrences(scheduleCode, { page, perPage: 15 }),
      ]);
      setSchedule(detail); setHistory(payments.items); setLastPage(payments.last_page ?? 1); setTotal(payments.total);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load scheduled expense."); }
    finally { setLoading(false); }
  }, [page, scheduleCode]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function toggle() {
    if (!schedule) return; setBusy(true);
    try {
      const updated = schedule.status === "paused"
        ? await tenantResourceService.resumeScheduledExpense(schedule.code)
        : await tenantResourceService.pauseScheduledExpense(schedule.code);
      setSchedule(updated);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update scheduled expense."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!schedule) return; setBusy(true);
    try { await tenantResourceService.deleteScheduledExpense(schedule.code); navigate(routePaths.scheduledExpenses); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete scheduled expense."); setBusy(false); }
  }

  if (loading && !schedule) return <LoadingState rows={7} />;
  if (!schedule) return <section className="page"><Alert tone="danger" title="Scheduled expense unavailable" message={error ?? "Scheduled expense was not found."} /></section>;

  const detailItems = [
    { key: "Code", value: schedule.code }, { key: "Status", value: <ScheduleStatus status={schedule.status} /> },
    { key: "Account", value: schedule.account_name ?? String(schedule.account_id) },
    { key: "Amount", value: <AccountCurrencyAmount accountId={schedule.account_id} amount={schedule.amount} /> },
    { key: "Expense type", value: schedule.expense_type_name ?? "—" }, { key: "Recurrence", value: recurrenceLabel(schedule) },
    { key: "Start", value: `${schedule.start_date} ${schedule.scheduled_time}` }, { key: "End", value: schedule.end_date ?? "No end date" },
    { key: "Next payment", value: schedule.next_due_date ?? "Complete" }, { key: "Created by", value: schedule.creator_name ?? "System" },
  ];

  return <section className="page scheduled-expense-detail-page">
    <SectionHeader title={schedule.description} subtitle={schedule.code} action={<div className="scheduled-expense-actions">
      <Button variant="secondary" onClick={() => navigate(routePaths.scheduledExpenses)}>Back</Button>
      {hasPermission("update_scheduled_expense") ? <><Button variant="secondary" disabled={busy || schedule.status === "completed"} onClick={() => void toggle()}>{schedule.status === "paused" ? "Resume" : "Pause"}</Button><Button variant="primary" onClick={() => navigate(routePaths.scheduledExpenseEdit(schedule.code))}>Edit</Button></> : null}
      {hasPermission("delete_scheduled_expense") ? <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button> : null}
    </div>} />
    {error ? <Alert tone="danger" title="Scheduled expense action failed" message={error} onDismiss={() => setError(null)} /> : null}
    <Card title="Schedule information" description="Changes to this template apply only to future occurrences."><div className="scheduled-expense-detail-grid">{detailItems.map((item) => <div key={item.key}><small>{item.key}</small><strong>{item.value}</strong></div>)}</div></Card>
    <Card title="Payment History" description={`${total} occurrence${total === 1 ? "" : "s"}`}>
      {history.length === 0 ? <EmptyState title="No payment history" description="Occurrences will appear after the schedule becomes due." /> : <><OccurrenceDesktopTable items={history} /><OccurrenceMobileCards items={history} /></>}
      <div className="ui-pagination"><span className="ui-pagination__meta">Page {page} of {lastPage} - {total} records</span><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="secondary" disabled={page >= lastPage} onClick={() => setPage((current) => current + 1)}>Next</Button></div>
    </Card>
    <ConfirmDialog isOpen={confirmDelete} isLoading={busy} title="Delete scheduled expense" confirmLabel="Delete Schedule" message={`Delete schedule ${schedule.code}? Existing paid expenses remain.`} onCancel={() => setConfirmDelete(false)} onConfirm={() => void remove()} />
  </section>;
}

function OccurrenceDesktopTable({ items }: { items: TenantScheduledExpenseOccurrence[] }) {
  return <div className="scheduled-expense-history--desktop"><table className="scheduled-expense-table"><thead><tr><th>Due</th><th>Payment</th><th>Amount</th><th>Account</th><th>Status</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.due_date}<small>{item.due_time}</small></td><td>{item.description}<small>{item.expense_code ?? item.expense_type_name ?? "—"}</small></td><td>{formatOccurrenceAmount(item)}</td><td>{item.account_name ?? item.account_id}</td><td><OccurrenceStatus item={item} /></td></tr>)}</tbody></table></div>;
}

function OccurrenceMobileCards({ items }: { items: TenantScheduledExpenseOccurrence[] }) {
  return <div className="scheduled-expense-history--mobile">{items.map((item) => <DataCard key={item.id} className="scheduled-expense-history-card" title={item.description} items={[{ key: "Due", value: `${item.due_date} ${item.due_time}` }, { key: "Amount", value: formatOccurrenceAmount(item) }, { key: "Account", value: item.account_name ?? String(item.account_id) }, { key: "Expense", value: item.expense_code ?? "—" }, { key: "Status", value: <OccurrenceStatus item={item} /> }]} />)}</div>;
}

function OccurrenceStatus({ item }: { item: TenantScheduledExpenseOccurrence }) {
  const tone = item.status === "paid" ? "success" : item.status === "failed" ? "danger" : "warning";
  return <div className="scheduled-expense-status" title={item.last_error ?? undefined}><Badge tone={tone}>{item.status}</Badge>{item.attempt_count > 0 ? <small>{item.attempt_count} attempt{item.attempt_count === 1 ? "" : "s"}</small> : null}{item.last_error ? <small>{item.last_error}</small> : null}</div>;
}
function ScheduleStatus({ status }: { status: TenantScheduledExpense["status"] }) { return <Badge tone={status === "active" ? "success" : "warning"}>{status}</Badge>; }
function recurrenceLabel(item: TenantScheduledExpense) { return item.recurrence_type.replace("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }
function formatOccurrenceAmount(item: TenantScheduledExpenseOccurrence) { return `${item.currency_symbol ?? item.currency_code ?? ""} ${item.amount}`.trim(); }
