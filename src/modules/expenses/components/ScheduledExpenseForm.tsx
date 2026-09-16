import type { FormEvent, ReactNode } from "react";
import { Button, Input, Select, Textarea } from "../../../components/atoms";
import { ActionBar, Card, FinancialAmountInput, FormField, FormGroup } from "../../../components/molecules";
import type { ExpenseTypeOption } from "../../../dataobjects/tenant/finance";
import { FinancialAccountSelect } from "../../financialAccounts/components/FinancialAccountSelect";
import { formatResolvedDate, resolveBoundaries, type ScheduledExpenseFormState, type WeekOrdinal } from "./scheduledExpenseFormModel";

type Props = { value: ScheduledExpenseFormState; errors: Partial<Record<keyof ScheduledExpenseFormState, string>>;
  expenseTypes: ExpenseTypeOption[]; saving: boolean; onCancel: () => void;
  onChange: <K extends keyof ScheduledExpenseFormState>(key: K, value: ScheduledExpenseFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; };
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ordinals: Array<{ value: WeekOrdinal; label: string }> = [
  { value: "1", label: "1st" }, { value: "2", label: "2nd" }, { value: "3", label: "3rd" },
  { value: "4", label: "4th" }, { value: "last", label: "Last" }];

export function ScheduledExpenseForm({ value, errors, expenseTypes, saving, onCancel, onChange, onSubmit }: Props) {
  function changeRecurrence(recurrence: ScheduledExpenseFormState["recurrence_type"]) {
    onChange("recurrence_type", recurrence);
    // Hidden boundaries are reset so a recurrence change cannot submit stale dates.
    onChange("start_date", ""); onChange("end_date", ""); onChange("weekly_start_month", "");
    onChange("weekly_end_month", ""); onChange("monthly_start_month", ""); onChange("monthly_end_month", "");
  }
  return <Card title="Schedule details" description="Times use the tenant timezone. Payments run on the first eligible 15-minute scheduler cycle.">
    <form className="ui-form scheduled-expense-form" onSubmit={onSubmit}><FormGroup columns={2}>
      <FormField id="scheduled-expense-account" label="Payment Account" error={errors.account_id}><FinancialAccountSelect id="scheduled-expense-account" value={value.account_id} onChange={(next) => onChange("account_id", next)} /></FormField>
      <FormField id="scheduled-expense-amount" label="Amount" error={errors.amount}><FinancialAmountInput id="scheduled-expense-amount" min="0.01" step="0.01" value={{ amount: value.amount, unit: value.amount_unit }} onChange={(next) => { onChange("amount", next.amount); onChange("amount_unit", next.unit); }} /></FormField>
      <FormField id="scheduled-expense-type" label="Expense type"><Select id="scheduled-expense-type" value={value.expense_type_id} onChange={(e) => onChange("expense_type_id", e.target.value)}><option value="">No expense type</option>{expenseTypes.map((type) => <option value={type.id} key={type.id}>{type.name}</option>)}</Select></FormField>
      <FormField id="scheduled-expense-recurrence" label="Recurrence"><Select id="scheduled-expense-recurrence" value={value.recurrence_type} onChange={(e) => changeRecurrence(e.target.value as ScheduledExpenseFormState["recurrence_type"])}><option value="one_time">One time</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></Select></FormField>
      <ScheduleTimingFields value={value} errors={errors} onChange={onChange} />
      <FormField id="scheduled-expense-time" label="Payment time" error={errors.scheduled_time}><Input id="scheduled-expense-time" type="time" value={value.scheduled_time} onChange={(e) => onChange("scheduled_time", e.target.value)} /></FormField>
      <FormField id="scheduled-expense-description" label="Description" error={errors.description}><Textarea id="scheduled-expense-description" value={value.description} onChange={(e) => onChange("description", e.target.value)} /></FormField>
    </FormGroup><ActionBar><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" variant="primary" isLoading={saving}>Save Schedule</Button></ActionBar></form>
  </Card>;
}

function ScheduleTimingFields({ value, errors, onChange }: Pick<Props, "value" | "errors" | "onChange">): ReactNode {
  if (value.recurrence_type === "one_time") return <FormField id="scheduled-expense-effective" label="Effective date" error={errors.start_date}><Input id="scheduled-expense-effective" type="date" value={value.start_date} onChange={(e) => onChange("start_date", e.target.value)} /></FormField>;
  if (value.recurrence_type === "daily") return <><FormField id="scheduled-expense-daily-start" label="When will the daily automatic expense start?" error={errors.start_date}><Input id="scheduled-expense-daily-start" type="date" value={value.start_date} onChange={(e) => onChange("start_date", e.target.value)} /></FormField><FormField id="scheduled-expense-daily-end" label="Until when?" error={errors.end_date} helperText="Optional and inclusive."><Input id="scheduled-expense-daily-end" type="date" min={value.start_date} value={value.end_date} onChange={(e) => onChange("end_date", e.target.value)} /></FormField></>;
  if (value.recurrence_type === "weekly") return <WeeklyTimingFields value={value} errors={errors} onChange={onChange} />;
  return <MonthlyTimingFields value={value} errors={errors} onChange={onChange} />;
}

function WeeklyTimingFields({ value, errors, onChange }: Pick<Props, "value" | "errors" | "onChange">) {
  const resolved = resolveBoundaries(value);
  return <><FormField id="scheduled-expense-weekday" label="Which day of the week should the deduction affect?" error={errors.weekly_day}><Select id="scheduled-expense-weekday" value={value.weekly_day} onChange={(e) => onChange("weekly_day", e.target.value)}>{weekdays.map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</Select></FormField>
    <WeekBoundary id="weekly-start" label="When will it start?" month={value.weekly_start_month} ordinal={value.weekly_start_ordinal} error={errors.weekly_start_month} preview={resolved.start} onMonth={(next) => onChange("weekly_start_month", next)} onOrdinal={(next) => onChange("weekly_start_ordinal", next)} />
    <WeekBoundary id="weekly-end" label="Until when?" month={value.weekly_end_month} ordinal={value.weekly_end_ordinal} error={errors.weekly_end_month} preview={resolved.end} optional onMonth={(next) => onChange("weekly_end_month", next)} onOrdinal={(next) => onChange("weekly_end_ordinal", next)} /></>;
}

function WeekBoundary({ id, label, month, ordinal, error, preview, optional, onMonth, onOrdinal }: { id: string; label: string; month: string; ordinal: WeekOrdinal; error?: string; preview: string | null; optional?: boolean; onMonth: (value: string) => void; onOrdinal: (value: WeekOrdinal) => void; }) {
  return <FormField id={`${id}-month`} label={label} error={error} helperText={preview ? formatResolvedDate(preview) : optional ? "Optional; leave the month empty for no end date." : "Choose a month and week."}><div className="scheduled-expense-week-boundary"><Input id={`${id}-month`} type="month" value={month} onChange={(e) => onMonth(e.target.value)} /><Select aria-label={`${label} week`} value={ordinal} onChange={(e) => onOrdinal(e.target.value as WeekOrdinal)}>{ordinals.map((item) => <option key={item.value} value={item.value}>{item.label} week</option>)}</Select></div></FormField>;
}

function MonthlyTimingFields({ value, errors, onChange }: Pick<Props, "value" | "errors" | "onChange">) {
  const resolved = resolveBoundaries(value);
  return <><FormField id="scheduled-expense-month-day" label="Which day of the month?" error={errors.monthly_day} helperText="Short months use their final day."><Input id="scheduled-expense-month-day" type="number" min="1" max="31" value={value.monthly_day} onChange={(e) => onChange("monthly_day", e.target.value)} /></FormField>
    <FormField id="scheduled-expense-month-start" label="When will it start?" error={errors.monthly_start_month} helperText={resolved.start ? formatResolvedDate(resolved.start) : "Choose a month."}><Input id="scheduled-expense-month-start" type="month" value={value.monthly_start_month} onChange={(e) => onChange("monthly_start_month", e.target.value)} /></FormField>
    <FormField id="scheduled-expense-month-end" label="Until when?" error={errors.monthly_end_month} helperText={resolved.end ? formatResolvedDate(resolved.end) : "Optional; leave empty for no end date."}><Input id="scheduled-expense-month-end" type="month" min={value.monthly_start_month} value={value.monthly_end_month} onChange={(e) => onChange("monthly_end_month", e.target.value)} /></FormField></>;
}
