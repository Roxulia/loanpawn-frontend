import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { Badge } from "../../../components/atoms";
import { Alert } from "../../../components/feedback";
import { SectionHeader } from "../../../components/molecules";
import { routePaths } from "../../../app/routes/paths";
import type { ExpenseTypeOption } from "../../../dataobjects/tenant/finance";
import { tenantResourceService } from "../../../services/tenant/tenantResourceService";
import { ScheduledExpenseForm } from "../components/ScheduledExpenseForm";
import { emptyScheduledExpenseForm, scheduledExpensePayload, scheduledExpenseToForm, validateScheduledExpense, type ScheduledExpenseFormState } from "../components/scheduledExpenseFormModel";

export function ScheduledExpenseFormPage() {
  const { scheduleCode } = useParams();
  const editing = Boolean(scheduleCode);
  const navigate = useNavigate();
  const [form, setForm] = useState<ScheduledExpenseFormState>(emptyScheduledExpenseForm);
  const [updateKey, setUpdateKey] = useState(0);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ScheduledExpenseFormState, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void tenantResourceService.listExpenseTypes().then(setExpenseTypes).catch((e) => setError(e instanceof Error ? e.message : "Unable to load expense types."));
    if (scheduleCode) {
      void tenantResourceService.getScheduledExpense(scheduleCode).then((item) => { setForm(scheduledExpenseToForm(item)); setUpdateKey(item.update_key); })
        .catch((e) => setError(e instanceof Error ? e.message : "Unable to load scheduled expense."));
    }
  }, [scheduleCode]);

  function change<K extends keyof ScheduledExpenseFormState>(key: K, value: ScheduledExpenseFormState[K]) {
    setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const nextErrors = validateScheduledExpense(form);
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    setSaving(true); setError(null);
    try {
      if (scheduleCode) await tenantResourceService.updateScheduledExpense(scheduleCode, scheduledExpensePayload(form, updateKey));
      else await tenantResourceService.createScheduledExpense(scheduledExpensePayload(form));
      navigate(routePaths.scheduledExpenses);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save scheduled expense."); }
    finally { setSaving(false); }
  }

  return <section className="page scheduled-expense-editor-page">
    <SectionHeader title={editing ? "Edit Scheduled Expense" : "Create Scheduled Expense"}
      subtitle="Configure an automatic expense payment in the tenant timezone." action={<Badge tone="info">Automation</Badge>} />
    {error ? <Alert tone="danger" title="Scheduled expense action failed" message={error} onDismiss={() => setError(null)} /> : null}
    <ScheduledExpenseForm value={form} errors={errors} expenseTypes={expenseTypes} saving={saving}
      onCancel={() => navigate(routePaths.scheduledExpenses)} onChange={change} onSubmit={(event) => void submit(event)} />
  </section>;
}
