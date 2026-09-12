import { ScheduledExpenseFormPage } from "./ScheduledExpenseFormPage";

// A dedicated route component keeps update authorization and future-only semantics explicit.
export function ScheduledExpenseUpdatePage() { return <ScheduledExpenseFormPage />; }
