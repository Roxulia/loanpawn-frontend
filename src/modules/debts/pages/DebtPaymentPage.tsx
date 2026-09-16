import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { routePaths } from "../../../app/routes/paths";
import { Button, Select } from "../../../components/atoms";
import { Alert, LoadingState } from "../../../components/feedback";
import {
  ActionBar,
  Card,
  FinancialAmountInput,
  FormField,
  FormGroup,
  KeyValueList,
  SectionHeader,
} from "../../../components/molecules";
import { DataTable, Modal, type DataTableColumn } from "../../../components/organisms";
import type {
  DebtInterestAccrual,
  DebtInterestCalculation,
  DebtPaymentHistoryItem,
} from "../../../dataobjects/tenant/finance";
import { createIdempotencyKey } from "../../../services/http/idempotency";
import { tenantResourceService } from "../../../services/tenant/tenantResourceService";
import { FinancialAccountSelect } from "../../financialAccounts/components/FinancialAccountSelect";
import { AccountCurrencyAmount } from "../../finance/AccountCurrencyAmount";
import {
  financialAmountToBase,
  type FinancialUnitCode,
} from "../../finance/financialUnits";
import { ReportingExchangeRateField } from "../../finance/ReportingExchangeRateField";
import { formatDate } from "../../finance/financeFormat";
import { formatTenantDateTime } from "../../../utils/localDateTime";

const accrualColumns: Array<DataTableColumn<DebtInterestAccrual>> = [
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

const paymentColumns: Array<DataTableColumn<DebtPaymentHistoryItem>> = [
  { header: "Payment", key: "code", render: (row) => <strong>{row.code}</strong> },
  {
    header: "Amount",
    key: "amount",
    render: (row) => row.payment_amount,
  },
  {
    header: "Principal",
    key: "principal",
    render: (row) => row.principal_paid,
  },
  { header: "Interest", key: "interest", render: (row) => row.interest_paid },
  {
    header: "Allocation",
    key: "allocation",
    render: (row) =>
      row.allocation_order === "interest_first"
        ? "Interest first"
        : "Principal first",
  },
  {
    header: "Paid at",
    key: "date",
    render: (row) => formatDate(row.payment_at),
  },
];

export function DebtPaymentPage() {
  const { debtCode = "" } = useParams();
  const navigate = useNavigate();
  const [calculation, setCalculation] =
    useState<DebtInterestCalculation | null>(null);
  const [history, setHistory] = useState<DebtPaymentHistoryItem[]>([]);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<FinancialUnitCode>("UNIT");
  const [accountId, setAccountId] = useState("");
  const [order, setOrder] = useState<"interest_first" | "principal_first">(
    "interest_first",
  );
  const [reportingExchangeRate, setReportingExchangeRate] = useState("");
  const [reportingExchangeRateInversed, setReportingExchangeRateInversed] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<{
    result: NonNullable<Awaited<ReturnType<typeof tenantResourceService.payDebt>>>;
    enteredAmount: string;
    enteredUnit: FinancialUnitCode;
  } | null>(null);

  const load = useCallback(async () => {
    if (!debtCode) return;
    setLoading(true);
    setError(null);
    try {
      const [nextCalculation, nextHistory] = await Promise.all([
        tenantResourceService.calculateDebtInterest(debtCode),
        tenantResourceService.listDebtPayments(debtCode),
      ]);
      setCalculation(nextCalculation);
      setHistory(nextHistory);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load payment details.",
      );
    } finally {
      setLoading(false);
    }
  }, [debtCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  if (!debtCode) return <Navigate replace to={routePaths.debts} />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!calculation) return;
    const paymentAmount = calculation.allow_partial_payments
      ? Number(amount)
      : Number(calculation.total_outstanding);
    if (paymentAmount <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const enteredAmount = amount;
      const enteredUnit = calculation.allow_partial_payments ? unit : "UNIT";
      const result = await tenantResourceService.payDebt(
        calculation.debt_code,
        {
          amount_paid: paymentAmount,
          amount_paid_unit: calculation.allow_partial_payments ? unit : "UNIT",
          allocation_order: calculation.allow_partial_payments
            ? order
            : "interest_first",
          debt_update_key: calculation.debt_update_key,
          ...(accountId ? { accept_account_id: Number(accountId) } : {}),
          ...(reportingExchangeRate
            ? {
                reporting_exchange_rate: Number(reportingExchangeRate),
                reporting_exchange_rate_inversed:
                  reportingExchangeRateInversed,
              }
            : {}),
        },
        { idempotencyKey: createIdempotencyKey() },
      );
      setPaymentResult({
        result,
        enteredAmount,
        enteredUnit,
      });
      setAmount("");
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to record payment.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page business-loan-payment-page debt-payment-page">
      <SectionHeader
        title="Debt Payment"
        subtitle={debtCode}
        action={
          <Button
            onClick={() => navigate(routePaths.debtDetail(debtCode))}
            variant="secondary"
          >
            Back
          </Button>
        }
      />
      {error && (
        <Alert
          message={error}
          onDismiss={() => setError(null)}
          title="Payment failed"
          tone="danger"
        />
      )}
      {paymentResult && (
        <Modal
          isOpen
          onClose={() => setPaymentResult(null)}
          title="Payment recorded"
        >
          <KeyValueList
            items={[
              {
                key: "Payment",
                value: paymentResult.result.debt_code,
              },
              {
                key: "Entered amount",
                value: `${paymentResult.enteredAmount} ${paymentResult.enteredUnit}`,
              },
              {
                key: "Payment amount",
                value: (
                  <AccountCurrencyAmount
                    accountId={paymentResult.result.accept_account_id ?? calculation?.account_id}
                    amount={paymentResult.result.payment_amount}
                  />
                ),
              },
              {
                key: "Principal paid",
                value: paymentResult.result.principal_paid,
              },
              {
                key: "Interest paid",
                value: paymentResult.result.interest_paid,
              },
              {
                key: "Change",
                value: paymentResult.result.change_amount,
              },
              {
                key: "Remaining principal",
                value: paymentResult.result.remaining_principal,
              },
              {
                key: "Remaining interest",
                value: paymentResult.result.remaining_interest,
              },
            ]}
          />
          <small>
            Converted amount: {financialAmountToBase({
              amount: paymentResult.enteredAmount,
              unit: paymentResult.enteredUnit,
            })}
          </small>
        </Modal>
      )}
      {loading && !calculation ? (
        <LoadingState rows={6} />
      ) : (
        calculation && (
          <div className="business-loan-payment-layout">
            <Card
              title="Outstanding Balance"
              description="Current principal and accrued interest."
            >
              <KeyValueList
                items={[
                  {
                    key: "Debt",
                    value: calculation.debt_code,
                  },
                  {
                    key: "Principal",
                    value: (
                      <AccountCurrencyAmount
                        accountId={calculation.account_id}
                        amount={calculation.principal_balance}
                      />
                    ),
                  },
                  {
                    key: "Interest",
                    value: (
                      <AccountCurrencyAmount
                        accountId={calculation.account_id}
                        amount={calculation.outstanding_interest}
                      />
                    ),
                  },
                  {
                    key: "Total",
                    value: (
                      <AccountCurrencyAmount
                        accountId={calculation.account_id}
                        amount={calculation.total_outstanding}
                      />
                    ),
                  },
                  {
                    key: "Interest Policy",
                    value: calculation.apply_interest
                      ? `${calculation.interest_rate}% ${calculation.interest_type_name ?? ""}`
                      : "Not applied",
                  },
                ]}
              />
              <DataTable
                columns={accrualColumns}
                emptyDescription="This debt has no interest accruals."
                emptyTitle="No accrued interest"
                getItemId={(row) => row.id}
                getItemTitle={(row) => `Accrual ${row.id}`}
                items={calculation.interest_breakdown}
              />
            </Card>
            {Number(calculation.total_outstanding) > 0 && (
              <Card
                title="Record Payment"
                description="Allocate a payment against this debt."
              >
                <form className="ui-form" onSubmit={submit}>
                  <FormGroup columns={1}>
                    {calculation.allow_partial_payments ? (
                      <>
                        <FormField id="debt-payment-amount" label="Amount">
                          <FinancialAmountInput
                            id="debt-payment-amount"
                            min="0.01"
                            onChange={(next) => {
                              setAmount(next.amount);
                              setUnit(next.unit);
                            }}
                            step="0.01"
                            value={{ amount, unit }}
                          />
                        </FormField>
                        <FormField
                          id="debt-payment-order"
                          label="Allocation"
                        >
                          <Select
                            id="debt-payment-order"
                            onChange={(event) =>
                              setOrder(event.target.value as typeof order)
                            }
                            value={order}
                          >
                            <option value="interest_first">
                              Interest first
                            </option>
                            <option value="principal_first">
                              Principal first
                            </option>
                          </Select>
                        </FormField>
                      </>
                    ) : (
                      <KeyValueList
                        items={[
                          {
                            key: "Full settlement",
                            value: (
                              <AccountCurrencyAmount
                                accountId={calculation.account_id}
                                amount={calculation.total_outstanding}
                              />
                            ),
                          },
                        ]}
                      />
                    )}
                    <FormField
                      id="debt-payment-account"
                      label="Accepting Account"
                      helperText="Only compatible accounts are available."
                    >
                      <FinancialAccountSelect
                        id="debt-payment-account"
                        matchAccountId={calculation.account_id}
                        onChange={setAccountId}
                        value={accountId}
                      />
                    </FormField>
                    <ReportingExchangeRateField
                      accountId={accountId || calculation.account_id}
                      inversed={reportingExchangeRateInversed}
                      manualRate={reportingExchangeRate}
                      onInversedChange={setReportingExchangeRateInversed}
                      onManualRateChange={setReportingExchangeRate}
                    />
                  </FormGroup>
                  <ActionBar>
                    <Button
                      disabled={
                        calculation.allow_partial_payments &&
                        Number(amount) <= 0
                      }
                      isLoading={loading}
                      type="submit"
                    >
                      Record Payment
                    </Button>
                  </ActionBar>
                </form>
              </Card>
            )}
            <Card
              title="Payment History"
              description="Payments recorded against this debt."
            >
              <DataTable
                columns={paymentColumns}
                emptyDescription="Payments will appear here after they are recorded."
                emptyTitle="No payments"
                getItemId={(row) => row.id}
                getItemTitle={(row) => row.code}
                items={history}
              />
            </Card>
          </div>
        )
      )}
    </section>
  );
}
