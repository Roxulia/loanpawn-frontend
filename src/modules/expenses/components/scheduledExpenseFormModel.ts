import type { TenantScheduledExpense } from "../../../dataobjects/tenant/finance";

export type WeekOrdinal = "1" | "2" | "3" | "4" | "last";
export type ScheduledExpenseFormState = {
  account_id: string; amount: string; description: string; expense_type_id: string;
  recurrence_type: TenantScheduledExpense["recurrence_type"];
  start_date: string; scheduled_time: string; end_date: string;
  weekly_day: string; weekly_start_month: string; weekly_start_ordinal: WeekOrdinal;
  weekly_end_month: string; weekly_end_ordinal: WeekOrdinal;
  monthly_day: string; monthly_start_month: string; monthly_end_month: string;
};

export const emptyScheduledExpenseForm: ScheduledExpenseFormState = {
  account_id: "", amount: "", description: "", expense_type_id: "", recurrence_type: "one_time",
  start_date: "", scheduled_time: "09:00", end_date: "", weekly_day: "1", weekly_start_month: "",
  weekly_start_ordinal: "1", weekly_end_month: "", weekly_end_ordinal: "1", monthly_day: "1",
  monthly_start_month: "", monthly_end_month: "",
};

export function scheduledExpenseToForm(item: TenantScheduledExpense): ScheduledExpenseFormState {
  const start = parseDate(item.start_date);
  const end = item.end_date ? parseDate(item.end_date) : null;
  return { ...emptyScheduledExpenseForm, account_id: String(item.account_id), amount: item.amount,
    description: item.description, expense_type_id: String(item.expense_type_id ?? ""), recurrence_type: item.recurrence_type,
    start_date: item.start_date, scheduled_time: item.scheduled_time.slice(0, 5), end_date: item.end_date ?? "",
    weekly_day: String(item.weekly_day ?? isoWeekday(start)), weekly_start_month: item.start_date.slice(0, 7),
    weekly_start_ordinal: dateOrdinal(start), weekly_end_month: item.end_date?.slice(0, 7) ?? "",
    weekly_end_ordinal: end ? dateOrdinal(end) : "1", monthly_day: String(item.monthly_anchor_day ?? start.getUTCDate()),
    monthly_start_month: item.start_date.slice(0, 7), monthly_end_month: item.end_date?.slice(0, 7) ?? "" };
}

export function scheduledExpensePayload(value: ScheduledExpenseFormState, updateKey?: number) {
  const boundaries = resolveBoundaries(value);
  return { account_id: Number(value.account_id), amount: Number(value.amount), amount_unit: "UNIT", description: value.description.trim(),
    expense_type_id: value.expense_type_id ? Number(value.expense_type_id) : null, recurrence_type: value.recurrence_type,
    start_date: boundaries.start, scheduled_time: value.scheduled_time, end_date: boundaries.end,
    weekly_day: value.recurrence_type === "weekly" ? Number(value.weekly_day) : null,
    monthly_anchor_day: value.recurrence_type === "monthly" ? Number(value.monthly_day) : null,
    ...(updateKey === undefined ? {} : { update_key: updateKey }) };
}

export function validateScheduledExpense(value: ScheduledExpenseFormState) {
  const errors: Partial<Record<keyof ScheduledExpenseFormState, string>> = {};
  if (!value.account_id) errors.account_id = "Payment account is required.";
  if (!value.description.trim()) errors.description = "Description is required.";
  if (!(Number(value.amount) > 0)) errors.amount = "Amount must be greater than zero.";
  if (!value.scheduled_time) errors.scheduled_time = "Payment time is required.";
  if ((value.recurrence_type === "one_time" || value.recurrence_type === "daily") && !value.start_date)
    errors.start_date = value.recurrence_type === "one_time" ? "Effective date is required." : "Start date is required.";
  if (value.recurrence_type === "weekly") {
    if (!value.weekly_start_month) errors.weekly_start_month = "Start month is required.";
    if (!value.weekly_day) errors.weekly_day = "Weekday is required.";
  }
  if (value.recurrence_type === "monthly") {
    if (!value.monthly_start_month) errors.monthly_start_month = "Start month is required.";
    if (!(Number(value.monthly_day) >= 1 && Number(value.monthly_day) <= 31)) errors.monthly_day = "Choose a day from 1 to 31.";
  }
  const boundaries = resolveBoundaries(value);
  if (boundaries.start && boundaries.end && boundaries.end <= boundaries.start) {
    if (value.recurrence_type === "weekly") errors.weekly_end_month = "End must not be before the start.";
    else if (value.recurrence_type === "monthly") errors.monthly_end_month = "End must not be before the start.";
    else errors.end_date = "End date must be later than start date.";
  }
  return errors;
}

export function resolveBoundaries(value: ScheduledExpenseFormState): { start: string; end: string | null } {
  if (value.recurrence_type === "weekly") return {
    start: resolveWeeklyDate(value.weekly_start_month, Number(value.weekly_day), value.weekly_start_ordinal),
    end: value.weekly_end_month ? resolveWeeklyDate(value.weekly_end_month, Number(value.weekly_day), value.weekly_end_ordinal) : null };
  if (value.recurrence_type === "monthly") return {
    start: resolveMonthlyDate(value.monthly_start_month, Number(value.monthly_day)),
    end: value.monthly_end_month ? resolveMonthlyDate(value.monthly_end_month, Number(value.monthly_day)) : null };
  return { start: value.start_date, end: value.recurrence_type === "one_time" ? null : value.end_date || null };
}

// UTC calculations prevent browser timezone and daylight-saving rules from moving an accounting date.
export function resolveWeeklyDate(month: string, weekday: number, ordinal: WeekOrdinal): string {
  if (!month || weekday < 1 || weekday > 7) return "";
  const [year, monthNumber] = month.split("-").map(Number);
  if (ordinal === "last") {
    const last = new Date(Date.UTC(year, monthNumber, 0));
    last.setUTCDate(last.getUTCDate() - ((isoWeekday(last) - weekday + 7) % 7));
    return formatDate(last);
  }
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const day = 1 + ((weekday - isoWeekday(first) + 7) % 7) + (Number(ordinal) - 1) * 7;
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function resolveMonthlyDate(month: string, anchorDay: number): string {
  if (!month || anchorDay < 1 || anchorDay > 31) return "";
  const [year, monthNumber] = month.split("-").map(Number);
  // Short months clamp to month-end; monthly_anchor_day restores the selected day later.
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(Math.min(anchorDay, lastDay)).padStart(2, "0")}`;
}

export function formatResolvedDate(date: string): string {
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeZone: "UTC" }).format(parseDate(date)) : "";
}

function parseDate(date: string): Date { return new Date(`${date}T00:00:00Z`); }
function isoWeekday(date: Date): number { return date.getUTCDay() === 0 ? 7 : date.getUTCDay(); }
function formatDate(date: Date): string { return date.toISOString().slice(0, 10); }
function dateOrdinal(date: Date): WeekOrdinal {
  const nextWeek = new Date(date); nextWeek.setUTCDate(date.getUTCDate() + 7);
  return nextWeek.getUTCMonth() !== date.getUTCMonth() ? "last" : String(Math.ceil(date.getUTCDate() / 7)) as WeekOrdinal;
}
