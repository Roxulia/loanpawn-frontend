import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { Badge, Button, Input, Select } from "../../../components/atoms";
import { Alert, LoadingState } from "../../../components/feedback";
import {
  ActionBar,
  FormField,
  FormGroup,
} from "../../../components/molecules";
import { DataTable, type DataTableColumn } from "../../../components/organisms";
import { routePaths } from "../../../app/routes/paths";
import type {
  DebtInterestAccrual,
  DebtInterestCalculation,
  DebtPaymentHistoryItem,
  TenantDebt,
} from "../../../dataobjects/tenant/finance";
import { tenantResourceService } from "../../../services/tenant/tenantResourceService";
import { useFeatures, usePermissions } from "../../auth";
import { AccountCurrencyAmount } from "../../finance/AccountCurrencyAmount";
import { formatDate, getStringField } from "../../finance/financeFormat";
import { formatDebtLink } from "../components/debtFormat";
import { formatTenantDateTime } from "../../../utils/localDateTime";

const accrualColumns: Array<DataTableColumn<DebtInterestAccrual>> = [
  {
    header: "Period / Cycle",
    key: "period",
    render: (row) => (
      <div className="finance-detail-table-stack">
        <strong>
          {formatTenantDateTime(row.start_period_at, row.period_timezone)}
        </strong>
        <span>
          to {formatTenantDateTime(row.end_period_at, row.period_timezone)}
        </span>
      </div>
    ),
  },
  {
    header: "Principal Base",
    key: "principal",
    render: (row) => row.principal_amount,
  },
  { header: "Accrued", key: "interest", render: (row) => row.interest_amount },
  { header: "Collected", key: "paid", render: (row) => row.paid_amount },
  {
    header: "Compounded",
    key: "compounded",
    render: (row) => row.compounded_amount,
  },
  {
    header: "Receivable",
    key: "outstanding",
    render: (row) => <strong>{row.outstanding_amount}</strong>,
  },
];

const historyColumns: Array<DataTableColumn<DebtPaymentHistoryItem>> = [
  { header: "Collection", key: "code", render: (row) => <strong>{row.code}</strong> },
  { header: "Collected", key: "amount", render: (row) => row.payment_amount },
  {
    header: "Principal",
    key: "principal",
    render: (row) => row.principal_paid,
  },
  { header: "Interest", key: "interest", render: (row) => row.interest_paid },
  {
    header: "Collected at",
    key: "date",
    render: (row) => formatDate(row.payment_at),
  },
];

export function DebtDetailPage() {
  const navigate = useNavigate();
  const { debtCode: rawDebtCode } = useParams();
  const debtCode = rawDebtCode?.trim() ?? "";
  const { hasPermission } = usePermissions();
  const { hasEnabledFeature } = useFeatures();
  const [debt, setDebt] = useState<TenantDebt | null>(null);
  const [calculation, setCalculation] =
    useState<DebtInterestCalculation | null>(null);
  const [history, setHistory] = useState<DebtPaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [compoundEvery, setCompoundEvery] = useState("1");
  const [compoundEveryType, setCompoundEveryType] = useState("Month");
  const [nextCompoundAt, setNextCompoundAt] = useState("");
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const loadDebt = useCallback(async () => {
    if (!debtCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextDebt, nextCalculation, nextHistory] = await Promise.all([
        tenantResourceService.getDebt(debtCode),
        tenantResourceService.calculateDebtInterest(debtCode),
        tenantResourceService.listDebtPayments(debtCode),
      ]);
      setDebt(nextDebt);
      setScheduleEnabled(
        Boolean(
          nextDebt.compound_schedule_enabled ??
            nextDebt.compoundScheduleEnabled,
        ),
      );
      setCompoundEvery(
        String(nextDebt.compound_every ?? nextDebt.compoundEvery ?? 1),
      );
      setCompoundEveryType(
        nextDebt.compound_every_type ?? nextDebt.compoundEveryType ?? "Month",
      );
      setNextCompoundAt(
        toDateInput(nextDebt.next_compound_at ?? nextDebt.nextCompoundAt),
      );
      setCalculation(nextCalculation);
      setHistory(nextHistory);
    } catch (loadError) {
      setDebt(null);
      setCalculation(null);
      setHistory([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load debt detail.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [debtCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDebt(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDebt]);

  if (!debtCode) return <Navigate replace to={routePaths.debts} />;

  const canManageSchedule =
    hasEnabledFeature("advanced_interest_process") &&
    calculation?.compounding_enabled &&
    hasPermission("manage_debt_compound_schedule");
  const canCompound =
    hasEnabledFeature("advanced_interest_process") &&
    calculation?.compounding_enabled &&
    hasPermission("compound_debt_interest");

  async function runAction(name: string, action: () => Promise<void>) {
    setSavingAction(name);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update debt interest.",
      );
    } finally {
      setSavingAction(null);
    }
  }

  async function saveSchedule() {
    if (!debt) return;
    await runAction("schedule", async () => {
      await tenantResourceService.updateDebtCompoundSchedule(debt.code, {
        debt_update_key: debt.update_key ?? debt.updateKey ?? 0,
        enabled: scheduleEnabled,
        compound_every: scheduleEnabled ? Number(compoundEvery) : null,
        compound_every_type: scheduleEnabled ? compoundEveryType : null,
        next_compound_at: scheduleEnabled ? nextCompoundAt : null,
      });
      await loadDebt();
      setNotice("Debt compound schedule saved.");
    });
  }

  async function compoundInterest() {
    if (!debt) return;
    await runAction("compound", async () => {
      const response = await tenantResourceService.compoundDebtInterest(
        debt.code,
      );
      await loadDebt();
      setNotice(
        `Compounded ${response.compounded_interest} into debt principal.`,
      );
    });
  }

  return (
    <section className="page finance-detail-page finance-detail-page--debt debt-detail-page">
      {error && (
        <Alert
          message={error}
          onDismiss={() => setError(null)}
          title="Debt lookup failed"
          tone="danger"
        />
      )}
      {notice && (
        <Alert
          message={notice}
          onDismiss={() => setNotice(null)}
          title="Debt updated"
          tone="success"
        />
      )}
      {isLoading ? (
        <LoadingState rows={6} />
      ) : debt && calculation ? (
        <>
          <FinanceDetailHeader
            actions={
              !debt.is_paid &&
              hasPermission("update_debt") && (
                <Button
                  onClick={() => navigate(routePaths.debtPayment(debt.code))}
                  variant="primary"
                >
                  Collect Payment
                </Button>
              )
            }
            backLabel="Debts"
            code={debt.code}
            onBack={() => navigate(routePaths.debts)}
            onCopy={() => void navigator.clipboard?.writeText(debt.code)}
            status={debt.is_paid ? "Paid" : "Unpaid"}
            statusTone={debt.is_paid ? "success" : "warning"}
            tag={debt.tag}
            title="Customer Debt Receivable"
          />

          <section className="finance-detail-kpis">
            <FinanceKpi
              label="Original Receivable"
              meta={`Created ${formatDate(getStringField(debt, "created_at", "createdAt"))}`}
              value={
                <AccountCurrencyAmount
                  accountId={calculation.account_id}
                  amount={calculation.original_principal}
                />
              }
            />
            <FinanceKpi
              label="Principal Receivable"
              meta="Amount still owed to the shop"
              tone="primary"
              value={
                <AccountCurrencyAmount
                  accountId={calculation.account_id}
                  amount={calculation.principal_balance}
                />
              }
            />
            <FinanceKpi
              label="Accrued Interest"
              meta={formatInterestMeta(calculation)}
              value={
                <AccountCurrencyAmount
                  accountId={calculation.account_id}
                  amount={calculation.outstanding_interest}
                />
              }
            />
            <FinanceKpi
              label="Total Receivable"
              meta="Cash inflow expected"
              tone="emphasis"
              value={
                <AccountCurrencyAmount
                  accountId={calculation.account_id}
                  amount={calculation.total_outstanding}
                />
              }
            />
          </section>

          <div className="finance-detail-grid">
            <main className="finance-detail-main">
              <InfoPanel
                actionLabel="Linked to"
                actionText={formatDebtLink(debt)}
                eyebrow="Customer / Debtor"
                meta={[
                  getDebtCounterpartyMeta(debt),
                  `${history.length} collection${history.length === 1 ? "" : "s"} recorded`,
                ]}
                title={getDebtCounterpartyName(debt)}
              />

              <section className="finance-detail-panel">
                <PanelHeading
                  eyebrow="Receivable Terms"
                  title="Collection Rules"
                />
                <div className="finance-detail-terms-grid">
                  <TermField
                    label="Interest Rate"
                    meta="Debt interest income"
                    value={
                      calculation.apply_interest
                        ? `${calculation.interest_rate}% ${calculation.interest_type_name ?? ""}`
                        : "Not applied"
                    }
                  />
                  <TermField
                    label="Compounding Policy"
                    meta={
                      debt.compound_schedule_enabled ??
                      debt.compoundScheduleEnabled
                        ? `Next ${formatDate(debt.next_compound_at ?? debt.nextCompoundAt)}`
                        : "Manual capitalization only"
                    }
                    value={
                      debt.compound_schedule_enabled ??
                      debt.compoundScheduleEnabled
                        ? `Every ${debt.compound_every ?? debt.compoundEvery} ${debt.compound_every_type ?? debt.compoundEveryType}`
                        : "Disabled"
                    }
                  />
                  <TermField
                    label="Receiving Account"
                    meta="Collection account"
                    value={
                      calculation.account_id
                        ? `Account #${calculation.account_id}`
                        : "-"
                    }
                  />
                </div>
              </section>

              <section className="finance-detail-panel">
                <PanelHeading
                  eyebrow={`${calculation.interest_breakdown.length} cycle${calculation.interest_breakdown.length === 1 ? "" : "s"}`}
                  title="Interest Accruals Ledger"
                />
                <DataTable
                  columns={accrualColumns}
                  emptyDescription="This debt has no interest accruals."
                  emptyTitle="No accrued interest"
                  getItemId={(row) => row.id}
                  getItemTitle={(row) => `Accrual ${row.id}`}
                  items={calculation.interest_breakdown}
                />
              </section>

              <section className="finance-detail-panel">
                <PanelHeading
                  eyebrow={`${history.length} transaction${history.length === 1 ? "" : "s"}`}
                  title="Collection History"
                />
                <DataTable
                  columns={historyColumns}
                  emptyDescription="Collections from the customer will appear here."
                  emptyTitle="No collections"
                  getItemId={(row) => row.id}
                  getItemTitle={(row) => row.code}
                  items={history}
                />
              </section>
            </main>

            <aside className="finance-detail-sidebar">
              <section className="finance-detail-panel finance-detail-cta">
                <PanelHeading eyebrow="Cash Inflow" title="Collection" />
                <p>
                  Record money received by the shop to reduce this customer
                  receivable.
                </p>
                <Button
                  disabled={debt.is_paid || !hasPermission("update_debt")}
                  fullWidth
                  onClick={() => navigate(routePaths.debtPayment(debt.code))}
                  variant="primary"
                >
                  Collect Payment
                </Button>
              </section>

              {!debt.is_paid &&
                calculation.apply_interest &&
                (canManageSchedule || canCompound) && (
                  <section className="finance-detail-panel">
                    <PanelHeading eyebrow="Manual" title="Compounding" />
                    <DebtCompoundingForm
                      canCompound={Boolean(canCompound)}
                      canManageSchedule={Boolean(canManageSchedule)}
                      compoundEvery={compoundEvery}
                      compoundEveryType={compoundEveryType}
                      isSaving={savingAction}
                      nextCompoundAt={nextCompoundAt}
                      onCompound={() => void compoundInterest()}
                      onEveryChange={setCompoundEvery}
                      onNextDateChange={setNextCompoundAt}
                      onPeriodChange={setCompoundEveryType}
                      onSave={() => void saveSchedule()}
                      onToggle={setScheduleEnabled}
                      scheduleEnabled={scheduleEnabled}
                    />
                  </section>
                )}

              <AuditPanel
                items={[
                  {
                    label: "Current Interest",
                    meta: "Outstanding receivable income",
                    value: (
                      <AccountCurrencyAmount
                        accountId={calculation.account_id}
                        amount={calculation.outstanding_interest}
                      />
                    ),
                  },
                  {
                    label: "Last Compounded",
                    meta: "Capitalization checkpoint",
                    value: formatDate(
                      debt.last_compounded_at ?? debt.lastCompoundedAt,
                    ),
                  },
                  {
                    label: "Debt Created",
                    meta: "Receivable opened",
                    value: formatDate(
                      getStringField(debt, "created_at", "createdAt"),
                    ),
                  },
                ]}
              />
            </aside>
          </div>
        </>
      ) : (
        !error && (
          <Alert
            message="This debt is unavailable."
            title="Debt not found"
            tone="warning"
          />
        )
      )}
    </section>
  );
}

function FinanceDetailHeader({
  actions,
  backLabel,
  code,
  onBack,
  onCopy,
  status,
  statusTone,
  tag,
  title,
}: {
  actions: ReactNode;
  backLabel: string;
  code: string;
  onBack: () => void;
  onCopy: () => void;
  status: string;
  statusTone: "success" | "warning";
  tag?: string | null;
  title: string;
}) {
  return (
    <header className="finance-detail-header">
      <div>
        <nav className="finance-detail-breadcrumb" aria-label={`${title} breadcrumb`}>
          <button onClick={onBack} type="button">
            Back to {backLabel}
          </button>
          <span>/</span>
          <strong>{code}</strong>
        </nav>
        <div className="finance-detail-title-row">
          <h1>{code}</h1>
          <button
            className="finance-detail-copy"
            onClick={onCopy}
            title="Copy code"
            type="button"
          >
            Copy
          </button>
          <Badge tone={statusTone}>{status}</Badge>
          {tag && <span className="finance-detail-reference">Ref: {tag}</span>}
        </div>
        <p>{title}</p>
      </div>
      <div className="finance-detail-actions">{actions}</div>
    </header>
  );
}

function FinanceKpi({
  label,
  meta,
  tone,
  value,
}: {
  label: string;
  meta: string;
  tone?: "primary" | "emphasis";
  value: ReactNode;
}) {
  return (
    <article
      className={`finance-detail-kpi ${
        tone ? `finance-detail-kpi--${tone}` : ""
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </article>
  );
}

function InfoPanel({
  actionLabel,
  actionText,
  eyebrow,
  meta,
  title,
}: {
  actionLabel?: string;
  actionText?: ReactNode;
  eyebrow: string;
  meta: string[];
  title: string;
}) {
  return (
    <section className="finance-detail-panel finance-detail-counterparty">
      <div className="finance-detail-counterparty__mark" aria-hidden="true">
        {getInitials(title)}
      </div>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{meta.join(" / ")}</p>
      </div>
      {actionLabel && actionText && (
        <div className="finance-detail-reference">
          {actionLabel}: {actionText}
        </div>
      )}
    </section>
  );
}

function PanelHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <header className="finance-detail-panel__heading">
      <h2>{title}</h2>
      {eyebrow && <span>{eyebrow}</span>}
    </header>
  );
}

function TermField({
  label,
  meta,
  value,
}: {
  label: string;
  meta: string;
  value: ReactNode;
}) {
  return (
    <div className="finance-detail-term">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </div>
  );
}

function AuditPanel({
  items,
}: {
  items: Array<{ label: string; meta: string; value: ReactNode }>;
}) {
  return (
    <section className="finance-detail-panel">
      <PanelHeading eyebrow="Audit Trail" title="Ledger Status" />
      <div className="finance-detail-timeline">
        {items.map((item) => (
          <article key={item.label}>
            <span aria-hidden="true" />
            <div>
              <strong>{item.label}</strong>
              <p>{item.meta}</p>
            </div>
            <b>{item.value}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

type DebtCompoundingFormProps = {
  canCompound: boolean;
  canManageSchedule: boolean;
  compoundEvery: string;
  compoundEveryType: string;
  isSaving: string | null;
  nextCompoundAt: string;
  scheduleEnabled: boolean;
  onCompound: () => void;
  onEveryChange: (value: string) => void;
  onNextDateChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
  onSave: () => void;
  onToggle: (value: boolean) => void;
};

function DebtCompoundingForm(props: DebtCompoundingFormProps) {
  return (
    <div className="finance-detail-compounding">
      {props.canCompound && (
        <>
          <div className="finance-detail-compounding__available">
            <span>Available to capitalize</span>
            <strong>Outstanding interest</strong>
          </div>
          <Button
            fullWidth
            isLoading={props.isSaving === "compound"}
            onClick={props.onCompound}
            variant="secondary"
          >
            Compound Now
          </Button>
        </>
      )}
      {props.canManageSchedule && (
        <>
          <label className="finance-detail-toggle">
            <span>Auto-Compounding</span>
            <input
              checked={props.scheduleEnabled}
              onChange={(event) => props.onToggle(event.target.checked)}
              type="checkbox"
            />
          </label>
          <FormGroup columns={2}>
            <FormField id="debt-compound-every" label="Every">
              <Input
                disabled={!props.scheduleEnabled}
                id="debt-compound-every"
                min="1"
                onChange={(event) => props.onEveryChange(event.target.value)}
                type="number"
                value={props.compoundEvery}
              />
            </FormField>
            <FormField id="debt-compound-period" label="Period">
              <Select
                disabled={!props.scheduleEnabled}
                id="debt-compound-period"
                onChange={(event) => props.onPeriodChange(event.target.value)}
                value={props.compoundEveryType}
              >
                <option value="Day">Day</option>
                <option value="Week">Week</option>
                <option value="Month">Month</option>
              </Select>
            </FormField>
          </FormGroup>
          <FormField id="debt-next-compound" label="Next Date">
            <Input
              disabled={!props.scheduleEnabled}
              id="debt-next-compound"
              onChange={(event) => props.onNextDateChange(event.target.value)}
              type="date"
              value={props.nextCompoundAt}
            />
          </FormField>
          <ActionBar>
            <Button
              fullWidth
              isLoading={props.isSaving === "schedule"}
              onClick={props.onSave}
              variant="secondary"
            >
              Save Schedule
            </Button>
          </ActionBar>
        </>
      )}
    </div>
  );
}

function getDebtCounterpartyName(debt: TenantDebt) {
  return (
    debt.customer_name ??
    debt.customerName ??
    debt.slip_no ??
    debt.slipNo ??
    "External debtor"
  );
}

function getDebtCounterpartyMeta(debt: TenantDebt) {
  const code = debt.customer_code ?? debt.customerCode;

  if (code) return `Customer ${code}`;

  const slip = debt.slip_no ?? debt.slipNo;

  return slip ? `Slip ${slip}` : "External receivable";
}

function formatInterestMeta(calculation: DebtInterestCalculation) {
  return calculation.apply_interest
    ? `${calculation.interest_rate}% ${calculation.interest_type_name ?? ""}`.trim()
    : "Interest disabled";
}

function getInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "D"
  );
}

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}
