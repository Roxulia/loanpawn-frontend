import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { routePaths } from "../../../app/routes/paths";
import { Badge, Button, Input, Select } from "../../../components/atoms";
import { Alert, LoadingState } from "../../../components/feedback";
import {
  ActionBar,
  FormField,
  FormGroup,
} from "../../../components/molecules";
import { DataTable, type DataTableColumn } from "../../../components/organisms";
import { formatTenantDateTime } from "../../../utils/localDateTime";
import { useFeatures, usePermissions } from "../../auth";
import { AccountCurrencyAmount } from "../../finance/AccountCurrencyAmount";
import { formatDate } from "../../finance/financeFormat";
import {
  businessLoanService,
  type BusinessLoan,
  type BusinessLoanCalculation,
  type BusinessLoanPayment,
} from "../services/businessLoanService";

type InterestRow = BusinessLoanCalculation["interest_breakdown"][number];

const accrualColumns: Array<DataTableColumn<InterestRow>> = [
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
  { header: "Paid", key: "paid", render: (row) => row.paid_amount },
  {
    header: "Compounded",
    key: "compounded",
    render: (row) => row.compounded_amount,
  },
  {
    header: "Outstanding",
    key: "outstanding",
    render: (row) => <strong>{row.outstanding_amount}</strong>,
  },
];

const paymentColumns: Array<DataTableColumn<BusinessLoanPayment>> = [
  { header: "Payment", key: "code", render: (row) => <strong>{row.code}</strong> },
  { header: "Amount", key: "amount", render: (row) => row.payment_amount },
  {
    header: "Principal",
    key: "principal",
    render: (row) => row.principal_paid,
  },
  { header: "Interest", key: "interest", render: (row) => row.interest_paid },
  {
    header: "Paid at",
    key: "date",
    render: (row) => formatDate(row.payment_at),
  },
];

export function BusinessLoanDetailPage() {
  const { loanCode = "" } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { hasEnabledFeature } = useFeatures();
  const [loan, setLoan] = useState<BusinessLoan | null>(null);
  const [calculation, setCalculation] =
    useState<BusinessLoanCalculation | null>(null);
  const [payments, setPayments] = useState<BusinessLoanPayment[]>([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [compoundEvery, setCompoundEvery] = useState("1");
  const [compoundEveryType, setCompoundEveryType] = useState("Month");
  const [nextCompoundAt, setNextCompoundAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!loanCode) return;
    setError(null);
    try {
      const [nextLoan, nextCalculation, nextPayments] = await Promise.all([
        businessLoanService.get(loanCode),
        businessLoanService.calculation(loanCode),
        businessLoanService.payments(loanCode),
      ]);
      setLoan(nextLoan);
      setCalculation(nextCalculation);
      setPayments(nextPayments);
      setScheduleEnabled(Boolean(nextLoan.compound_schedule_enabled));
      setCompoundEvery(String(nextLoan.compound_every ?? 1));
      setCompoundEveryType(nextLoan.compound_every_type ?? "Month");
      setNextCompoundAt(nextLoan.next_compound_at?.slice(0, 10) ?? "");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load business loan.",
      );
    }
  }, [loanCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (!loanCode) return <Navigate replace to={routePaths.businessLoans} />;

  async function compound() {
    setWorking("compound");
    setError(null);
    try {
      const result = await businessLoanService.compound(loanCode);
      setNotice(`Compounded ${result.compounded_interest} into principal.`);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to compound interest.",
      );
    } finally {
      setWorking(null);
    }
  }

  async function saveSchedule() {
    if (!loan) return;
    setWorking("schedule");
    setError(null);
    try {
      await businessLoanService.updateCompoundSchedule(loan.code, {
        loan_update_key: loan.update_key,
        enabled: scheduleEnabled,
        compound_every: scheduleEnabled ? Number(compoundEvery) : null,
        compound_every_type: scheduleEnabled ? compoundEveryType : null,
        next_compound_at: scheduleEnabled ? nextCompoundAt : null,
      });
      setNotice("Business loan compound schedule saved.");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to save compound schedule.",
      );
    } finally {
      setWorking(null);
    }
  }

  const canManageInterest = Boolean(
    loan?.apply_interest &&
      !loan.is_paid &&
      calculation?.compounding_enabled &&
      hasEnabledFeature("advanced_interest_process") &&
      hasPermission("update_business_loan"),
  );

  return (
    <section className="page finance-detail-page finance-detail-page--business-loan business-loan-detail-page">
      {error && (
        <Alert
          message={error}
          onDismiss={() => setError(null)}
          title="Business loan action failed"
          tone="danger"
        />
      )}
      {notice && (
        <Alert
          message={notice}
          onDismiss={() => setNotice(null)}
          title="Business loan updated"
          tone="success"
        />
      )}
      {!loan || !calculation ? (
        !error && <LoadingState rows={6} />
      ) : (
        <>
          <FinanceDetailHeader
            actions={
              <>
                {hasPermission("update_business_loan") && (
                  <Button
                    onClick={() =>
                      navigate(routePaths.businessLoanEdit(loan.code))
                    }
                    variant="secondary"
                  >
                    Edit
                  </Button>
                )}
                {!loan.is_paid && hasPermission("update_business_loan") && (
                  <Button
                    onClick={() =>
                      navigate(routePaths.businessLoanPayment(loan.code))
                    }
                    variant="primary"
                  >
                    Record Repayment
                  </Button>
                )}
              </>
            }
            backLabel="Business Loans"
            code={loan.code}
            onBack={() => navigate(routePaths.businessLoans)}
            onCopy={() => void navigator.clipboard?.writeText(loan.code)}
            status={loan.is_paid ? "Settled" : "Active"}
            statusTone={loan.is_paid ? "success" : "warning"}
            tag={loan.tag}
            title="Business Loan Facility"
          />

          <section className="finance-detail-kpis">
            <FinanceKpi
              label="Original Funding"
              meta={`Originated ${formatDate(loan.created_at)}`}
              value={
                <AccountCurrencyAmount
                  accountId={loan.receipt_account_id}
                  amount={loan.amount}
                />
              }
            />
            <FinanceKpi
              label="Outstanding Principal"
              meta="Liability still owed to lender"
              tone="primary"
              value={
                <AccountCurrencyAmount
                  accountId={loan.receipt_account_id}
                  amount={calculation.principal_balance}
                />
              }
            />
            <FinanceKpi
              label="Accrued Interest"
              meta={formatInterestMeta(loan)}
              value={
                <AccountCurrencyAmount
                  accountId={loan.receipt_account_id}
                  amount={calculation.outstanding_interest}
                />
              }
            />
            <FinanceKpi
              label="Total Payable"
              meta="Cash outflow due"
              tone="emphasis"
              value={
                <AccountCurrencyAmount
                  accountId={loan.receipt_account_id}
                  amount={calculation.total_outstanding}
                />
              }
            />
          </section>

          <div className="finance-detail-grid">
            <main className="finance-detail-main">
              <InfoPanel
                actionLabel={loan.lender_code ? "Lender Code" : undefined}
                actionText={loan.lender_code ?? undefined}
                eyebrow="Capital Partner"
                meta={[
                  "External funding source",
                  `${payments.length} repayment${payments.length === 1 ? "" : "s"} recorded`,
                ]}
                title={loan.lender_name}
              />

              <section className="finance-detail-panel">
                <PanelHeading
                  eyebrow="Facility Terms"
                  title="Accrual Rules"
                />
                <div className="finance-detail-terms-grid">
                  <TermField
                    label="Interest Rate"
                    meta="Business loan interest expense"
                    value={
                      loan.apply_interest
                        ? `${loan.interest_rate}% ${loan.interest_type_name ?? ""}`
                        : "Not applied"
                    }
                  />
                  <TermField
                    label="Compounding Policy"
                    meta={
                      loan.compound_schedule_enabled
                        ? `Next ${formatDate(loan.next_compound_at)}`
                        : "Manual capitalization only"
                    }
                    value={
                      loan.compound_schedule_enabled
                        ? `Every ${loan.compound_every} ${loan.compound_every_type}`
                        : "Disabled"
                    }
                  />
                  <TermField
                    label="Disbursement Source"
                    meta="Funding account"
                    value={`Account #${loan.receipt_account_id}`}
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
                  emptyDescription="Interest periods will appear here."
                  emptyTitle="No accrued interest"
                  getItemId={(row) => row.id}
                  getItemTitle={(row) => `Accrual ${row.id}`}
                  items={calculation.interest_breakdown}
                />
              </section>

              <section className="finance-detail-panel">
                <PanelHeading
                  eyebrow={`${payments.length} transaction${payments.length === 1 ? "" : "s"}`}
                  title="Repayment History"
                />
                <DataTable
                  columns={paymentColumns}
                  emptyDescription="Repayments to the lender will appear here."
                  emptyTitle="No repayments"
                  getItemId={(row) => row.id}
                  getItemTitle={(row) => row.code}
                  items={payments}
                />
              </section>
            </main>

            <aside className="finance-detail-sidebar">
              <section className="finance-detail-panel finance-detail-cta">
                <PanelHeading eyebrow="Cash Outflow" title="Repayment" />
                <p>
                  Record money leaving the business to reduce this lender
                  liability.
                </p>
                <Button
                  disabled={loan.is_paid || !hasPermission("update_business_loan")}
                  fullWidth
                  onClick={() =>
                    navigate(routePaths.businessLoanPayment(loan.code))
                  }
                  variant="primary"
                >
                  Record Repayment
                </Button>
              </section>

              {canManageInterest && (
                <section className="finance-detail-panel">
                  <PanelHeading eyebrow="Manual" title="Compounding" />
                  <BusinessLoanCompoundingForm
                    compoundEvery={compoundEvery}
                    compoundEveryType={compoundEveryType}
                    isSaving={working}
                    nextCompoundAt={nextCompoundAt}
                    onCompound={() => void compound()}
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
                    meta: "Outstanding expense",
                    value: (
                      <AccountCurrencyAmount
                        accountId={loan.receipt_account_id}
                        amount={calculation.outstanding_interest}
                      />
                    ),
                  },
                  {
                    label: "Last Compounded",
                    meta: "Capitalization checkpoint",
                    value: formatDate(loan.last_compounded_at),
                  },
                  {
                    label: "Contract Created",
                    meta: "Facility origination",
                    value: formatDate(loan.created_at),
                  },
                ]}
              />
            </aside>
          </div>
        </>
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
  actionText?: string;
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

type CompoundingProps = {
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

function BusinessLoanCompoundingForm(props: CompoundingProps) {
  return (
    <div className="finance-detail-compounding">
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
      <label className="finance-detail-toggle">
        <span>Auto-Compounding</span>
        <input
          checked={props.scheduleEnabled}
          onChange={(event) => props.onToggle(event.target.checked)}
          type="checkbox"
        />
      </label>
      <FormGroup columns={2}>
        <FormField id="business-loan-compound-every" label="Every">
          <Input
            disabled={!props.scheduleEnabled}
            id="business-loan-compound-every"
            min="1"
            onChange={(event) => props.onEveryChange(event.target.value)}
            type="number"
            value={props.compoundEvery}
          />
        </FormField>
        <FormField id="business-loan-compound-period" label="Period">
          <Select
            disabled={!props.scheduleEnabled}
            id="business-loan-compound-period"
            onChange={(event) => props.onPeriodChange(event.target.value)}
            value={props.compoundEveryType}
          >
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
          </Select>
        </FormField>
      </FormGroup>
      <FormField id="business-loan-compound-date" label="Next Date">
        <Input
          disabled={!props.scheduleEnabled}
          id="business-loan-compound-date"
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
    </div>
  );
}

function formatInterestMeta(loan: BusinessLoan) {
  return loan.apply_interest
    ? `${loan.interest_rate}% ${loan.interest_type_name ?? ""}`.trim()
    : "Interest disabled";
}

function getInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "BL"
  );
}
