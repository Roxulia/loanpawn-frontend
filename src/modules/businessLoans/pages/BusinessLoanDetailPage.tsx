import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { routePaths } from "../../../app/routes/paths";
import { Badge, Button, Input, Select } from "../../../components/atoms";
import { Alert, LoadingState } from "../../../components/feedback";
import {
  ActionBar,
  Card,
  FormField,
  FormGroup,
  KeyValueList,
  SectionHeader,
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
    header: "Period",
    key: "period",
    render: (row) =>
      `${formatTenantDateTime(row.start_period_at, row.period_timezone)} - ${formatTenantDateTime(row.end_period_at, row.period_timezone)}`,
  },
  {
    header: "Principal",
    key: "principal",
    render: (row) => row.principal_amount,
  },
  { header: "Interest", key: "interest", render: (row) => row.interest_amount },
  { header: "Paid", key: "paid", render: (row) => row.paid_amount },
  {
    header: "Compounded",
    key: "compounded",
    render: (row) => row.compounded_amount,
  },
  {
    header: "Outstanding",
    key: "outstanding",
    render: (row) => row.outstanding_amount,
  },
];

const paymentColumns: Array<DataTableColumn<BusinessLoanPayment>> = [
  { header: "Payment", key: "code", render: (row) => row.code },
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
    void load();
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
    <section className="page business-loan-detail-page">
      <SectionHeader
        title="Business Loan Detail"
        subtitle={loanCode}
        action={
          <div className="row-actions">
            <Button
              onClick={() => navigate(routePaths.businessLoans)}
              variant="secondary"
            >
              Back
            </Button>
            {loan && !loan.is_paid && hasPermission("update_business_loan") && (
              <Button
                onClick={() =>
                  navigate(routePaths.businessLoanPayment(loan.code))
                }
              >
                Record Payment
              </Button>
            )}
            {loan && hasPermission("update_business_loan") && (
              <Button
                onClick={() => navigate(routePaths.businessLoanEdit(loan.code))}
                variant="secondary"
              >
                Edit
              </Button>
            )}
          </div>
        }
      />
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
          <BusinessLoanSummary calculation={calculation} loan={loan} />
          {canManageInterest && (
            <Card
              title="Interest Compounding"
              description="Capitalize outstanding interest into the business loan principal."
            >
              <div className="business-loan-compounding--desktop">
                <BusinessLoanCompoundingForm
                  idPrefix="business-loan-compound-desktop"
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
              </div>
              <div className="business-loan-compounding--mobile">
                <BusinessLoanCompoundingForm
                  idPrefix="business-loan-compound-mobile"
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
              </div>
            </Card>
          )}
          <Card title="Interest Accruals">
            <DataTable
              columns={accrualColumns}
              emptyDescription="Interest periods will appear here."
              emptyTitle="No accrued interest"
              getItemId={(row) => row.id}
              getItemTitle={(row) => `Accrual ${row.id}`}
              items={calculation.interest_breakdown}
            />
          </Card>
          <Card title="Payment History">
            <DataTable
              columns={paymentColumns}
              emptyDescription="Payments will appear here."
              emptyTitle="No payments"
              getItemId={(row) => row.id}
              getItemTitle={(row) => row.code}
              items={payments}
            />
          </Card>
        </>
      )}
    </section>
  );
}

function BusinessLoanSummary({
  calculation,
  loan,
}: {
  calculation: BusinessLoanCalculation;
  loan: BusinessLoan;
}) {
  const content = (
    <Card
      title={loan.code}
      description={loan.description}
      action={
        <Badge tone={loan.is_paid ? "success" : "warning"}>
          {loan.is_paid ? "Settled" : "Active"}
        </Badge>
      }
    >
      <KeyValueList
        items={[
          { key: "Lender", value: loan.lender_name },
          {
            key: "Original principal",
            value: (
              <AccountCurrencyAmount
                accountId={loan.receipt_account_id}
                amount={loan.amount}
              />
            ),
          },
          {
            key: "Principal balance",
            value: (
              <AccountCurrencyAmount
                accountId={loan.receipt_account_id}
                amount={calculation.principal_balance}
              />
            ),
          },
          {
            key: "Outstanding interest",
            value: (
              <AccountCurrencyAmount
                accountId={loan.receipt_account_id}
                amount={calculation.outstanding_interest}
              />
            ),
          },
          {
            key: "Total outstanding",
            value: (
              <AccountCurrencyAmount
                accountId={loan.receipt_account_id}
                amount={calculation.total_outstanding}
              />
            ),
          },
          {
            key: "Interest",
            value: loan.apply_interest
              ? `${loan.interest_rate}% ${loan.interest_type_name ?? ""}`
              : "Not applied",
          },
          {
            key: "Compound schedule",
            value: loan.compound_schedule_enabled
              ? `${loan.compound_every} ${loan.compound_every_type}`
              : "Disabled",
          },
          {
            key: "Last compounded",
            value: formatDate(loan.last_compounded_at),
          },
          { key: "Tag", value: loan.tag || "-" },
          { key: "Created", value: formatDate(loan.created_at) },
        ]}
      />
    </Card>
  );
  return (
    <>
      <div className="business-loan-detail--desktop">{content}</div>
      <div className="business-loan-detail--mobile">{content}</div>
    </>
  );
}

type CompoundingProps = {
  idPrefix: string;
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
    <div className="workflow-stack">
      <ActionBar>
        <Button
          isLoading={props.isSaving === "compound"}
          onClick={props.onCompound}
        >
          Compound Interest
        </Button>
      </ActionBar>
      <FormGroup columns={3}>
        <label className="accounting-schedule__toggle">
          <input
            checked={props.scheduleEnabled}
            onChange={(event) => props.onToggle(event.target.checked)}
            type="checkbox"
          />
          <span>Schedule enabled</span>
        </label>
        <FormField id={`${props.idPrefix}-every`} label="Every">
          <Input
            disabled={!props.scheduleEnabled}
            id={`${props.idPrefix}-every`}
            min="1"
            onChange={(event) => props.onEveryChange(event.target.value)}
            type="number"
            value={props.compoundEvery}
          />
        </FormField>
        <FormField id={`${props.idPrefix}-period`} label="Period">
          <Select
            disabled={!props.scheduleEnabled}
            id={`${props.idPrefix}-period`}
            onChange={(event) => props.onPeriodChange(event.target.value)}
            value={props.compoundEveryType}
          >
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
          </Select>
        </FormField>
        <FormField id={`${props.idPrefix}-date`} label="Next Date">
          <Input
            disabled={!props.scheduleEnabled}
            id={`${props.idPrefix}-date`}
            onChange={(event) => props.onNextDateChange(event.target.value)}
            type="date"
            value={props.nextCompoundAt}
          />
        </FormField>
        <ActionBar>
          <Button
            isLoading={props.isSaving === "schedule"}
            onClick={props.onSave}
            variant="secondary"
          >
            Save Schedule
          </Button>
        </ActionBar>
      </FormGroup>
    </div>
  );
}
