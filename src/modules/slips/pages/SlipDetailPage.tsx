import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { PackItemsView } from "../../collateral/components/PackItems";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { routePaths } from "../../../app/routes/paths";
import { Badge, Button, Input, Select } from "../../../components/atoms";
import { Alert, LoadingState } from "../../../components/feedback";
import {
  ActionBar,
  FinancialAmountInput,
  FormField,
  FormGroup,
} from "../../../components/molecules";
import { PrinterIcon } from "../../../components/icons/icon";
import { ModalForm } from "../../../components/organisms";
import { useFeatures, usePermissions } from "../../auth";
import { FinancialAccountSelect } from "../../financialAccounts/components/FinancialAccountSelect";
import type { FinancialUnitCode } from "../../finance/financialUnits";
import {
  formatDate,
  formatMoney,
  getSlipCustomerName,
  getStatusTone,
} from "../slipFormat";
import {
  slipService,
  type LoanContractSlip,
  type SlipCollateralItem,
} from "../services/slipService";

const paperTypeOptions = [
  { value: "A4", label: "A4" },
  { value: "A5", label: "A5" },
  { value: "Receipt80", label: "MM80" },
];

export function SlipDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slipNo } = useParams();
  const [slip, setSlip] = useState<LoanContractSlip | null>(null);
  const [notice, setNotice] = useState<string | null>(() =>
    getRouteNotice(location.state),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [compoundEvery, setCompoundEvery] = useState("1");
  const [compoundEveryType, setCompoundEveryType] = useState("Month");
  const [nextCompoundAt, setNextCompoundAt] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [principalAmountUnit, setPrincipalAmountUnit] =
    useState<FinancialUnitCode>("UNIT");
  const [principalAccountId, setPrincipalAccountId] = useState("");
  const [paperType, setPaperType] = useState("A4");
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { hasEnabledFeature } = useFeatures();
  const { hasPermission } = usePermissions();
  const hasAdvancedInterestProcess = hasEnabledFeature(
    "advanced_interest_process",
  );
  const canManageCompoundSchedule =
    hasAdvancedInterestProcess &&
    hasPermission("manage_slip_compound_schedule");
  const canCompoundInterest =
    hasAdvancedInterestProcess && hasPermission("compound_slip_interest");
  const canCollectPartialPrincipal =
    hasAdvancedInterestProcess && hasPermission("collect_partial_principal");
  const canRedeem = hasEnabledFeature("redemption_management") &&
    hasPermission("create_loan_contract");

  const loadSlip = useCallback(async (nextSlipNo: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await slipService.getSlip(nextSlipNo);
      setSlip(response);
      setScheduleEnabled(getCompoundScheduleEnabled(response));
      setCompoundEvery(String(getCompoundEvery(response) ?? 1));
      setCompoundEveryType(getCompoundEveryType(response) ?? "Month");
      setNextCompoundAt(toDateInputValue(getNextCompoundAt(response)));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load loan slip.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!slipNo?.trim()) {
      return;
    }

    const loadTimer = window.setTimeout(() => {
      void loadSlip(slipNo);
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadSlip, slipNo]);

  useEffect(() => {
    if (getRouteNotice(location.state)) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  async function saveCompoundSchedule() {
    if (!slip) return;
    await runSlipAction(
      "compound-schedule",
      async () => {
        await slipService.updateCompoundSchedule(slip.slip_no, {
          slip_update_key: slip.update_key ?? 0,
          enabled: scheduleEnabled,
          compound_every: scheduleEnabled ? Number(compoundEvery) : null,
          compound_every_type: scheduleEnabled ? compoundEveryType : null,
          next_compound_at: scheduleEnabled ? nextCompoundAt : null,
        });
        await loadSlip(slip.slip_no);
      },
      "Compound schedule saved.",
    );
  }

  async function compoundInterest() {
    if (!slip) return;
    await runSlipAction("compound-interest", async () => {
      const response = await slipService.compoundInterest(slip.slip_no);
      await loadSlip(slip.slip_no);
      setNotice(
        `Compounded ${formatMoney(response.compounded_interest)} into principal.`,
      );
    });
  }

  async function collectPartialPrincipal() {
    if (!slip) return;
    await runSlipAction("partial-principal", async () => {
      const response = await slipService.collectPartialPrincipal(slip.slip_no, {
        slip_update_key: slip.update_key ?? 0,
        amount: Number(principalAmount),
        amount_unit: principalAmountUnit,
        accept_account_id: principalAccountId
          ? Number(principalAccountId)
          : null,
      });
      setPrincipalAmount("");
      await loadSlip(slip.slip_no);
      setNotice(
        `Collected ${formatMoney(response.collected_amount)}. Remaining principal is ${formatMoney(response.remaining_principal)}.`,
      );
    });
  }

  async function printSlipDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slip) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError(
        "Unable to open print window. Please allow pop-ups and try again.",
      );
      return;
    }

    setIsPrinting(true);
    setError(null);

    try {
      const html = await slipService.previewSlipDocument(
        slip.slip_no,
        paperType,
      );

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setIsPrintDialogOpen(false);
      setPaperType("A4");
      printWindow.focus();
      window.setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (printError) {
      printWindow.close();
      setError(
        printError instanceof Error
          ? printError.message
          : "Unable to print slip document.",
      );
    } finally {
      setIsPrinting(false);
    }
  }

  async function runSlipAction(
    action: string,
    callback: () => Promise<void>,
    successNotice?: string,
  ) {
    setSavingAction(action);
    setError(null);
    setNotice(null);
    try {
      await callback();
      if (successNotice) setNotice(successNotice);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to process slip action.",
      );
    } finally {
      setSavingAction(null);
    }
  }

  function openPrintDialog() {
    setPaperType("A4");
    setIsPrintDialogOpen(true);
  }

  function goToInterestPayment(nextSlip: LoanContractSlip) {
    navigate(
      `${routePaths.interest}?slip=${encodeURIComponent(nextSlip.slip_no)}`,
    );
  }

  function goToRedemption(nextSlip: LoanContractSlip) {
    navigate(`${routePaths.redemptions}?slip=${encodeURIComponent(nextSlip.slip_no)}`);
  }

  async function toggleAutomaticCompounding() {
    if (!slip) return;
    if (!scheduleEnabled) { setScheduleEnabled(true); return; }

    await runSlipAction("compound-schedule", async () => {
      await slipService.updateCompoundSchedule(slip.slip_no, {
        slip_update_key: slip.update_key ?? 0,
        enabled: false,
        compound_every: null,
        compound_every_type: null,
        next_compound_at: null,
      });
      await loadSlip(slip.slip_no);
    }, "Automatic compounding disabled.");
  }

  function copySlipNo(nextSlip: LoanContractSlip) {
    void navigator.clipboard?.writeText(nextSlip.slip_no);
    setNotice(`Copied ${nextSlip.slip_no} to clipboard.`);
  }

  if (!slipNo?.trim()) {
    return <Navigate to={routePaths.slips} replace />;
  }

  return (
    <section className="page slip-detail-page">
      {notice && (
        <Alert
          message={notice}
          onDismiss={() => setNotice(null)}
          title="Loan slip updated"
          tone="success"
        />
      )}
      {error && (
        <Alert
          message={error}
          onDismiss={() => setError(null)}
          title="Loan slip action failed"
          tone="danger"
        />
      )}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : slip ? (
        <>
          <nav
            aria-label="Slip detail breadcrumb"
            className="slip-detail-breadcrumb"
          >
            <button onClick={() => navigate(routePaths.slips)} type="button">
              Back to Slips
            </button>
            <span>/</span>
            <span>Loan Contracts</span>
            <span>/</span>
            <strong>{slip.slip_no}</strong>
            <Badge tone={getStatusTone(slip.status)}>{slip.status}</Badge>
          </nav>

          <section className="slip-detail-banner">
            <div className="slip-detail-banner__identity">
              <div className="slip-detail-banner__mark" aria-hidden="true">
                <ReceiptIcon />
              </div>
              <div>
                <div className="slip-detail-banner__title">
                  <h1>{slip.slip_no}</h1>
                  <button
                    aria-label={`Copy ${slip.slip_no}`}
                    onClick={() => copySlipNo(slip)}
                    title="Copy slip number"
                    type="button"
                  >
                    <CopyIcon />
                  </button>
                </div>
                <p>
                  {slip.notes ||
                    "Pawn loan voucher and secured pledge agreement."}
                </p>
              </div>
            </div>
            <div className="slip-detail-banner__actions">
              <Button
                leftIcon={<PrinterIcon />}
                onClick={openPrintDialog}
                variant="secondary"
              >
                Print
              </Button>
              <Button
                leftIcon={<PercentIcon />}
                onClick={() => goToInterestPayment(slip)}
                variant="primary"
              >
                Pay Interest
              </Button>
              {canRedeem && slip.status === "active" && (
                <Button onClick={() => goToRedemption(slip)} variant="accent">Redeem</Button>
              )}
            </div>
          </section>

          <div className="slip-detail-grid">
            <div className="slip-detail-main">
              <section className="slip-detail-panel slip-detail-customer-panel">
                <header className="slip-detail-panel__header">
                  <div className="slip-detail-avatar" aria-hidden="true">
                    {getCustomerInitials(slip)}
                  </div>
                  <div>
                    <h2>{getSlipCustomerName(slip)}</h2>
                    <p>{formatCustomerMeta(slip)}</p>
                  </div>
                </header>
                <div className="slip-detail-summary-grid">
                  <SummaryMetric
                    label="Loan Amount"
                    tone="primary"
                    value={formatMoney(slip.loan_amount)}
                  />
                  <SummaryMetric
                    label="Interest Rate"
                    value={`${slip.interest_rate}%`}
                  />
                  <SummaryMetric
                    label="Interest Type"
                    value={slip.interest_type_name ?? "-"}
                  />
                </div>
                <div className="slip-detail-field-grid">
                  <DetailField
                    label="Created"
                    value={formatDate(slip.created_at)}
                  />
                  <DetailField
                    label="Expire Date"
                    value={formatDate(slip.expire_at)}
                  />
                  <DetailField
                    label="Expiry Quota"
                    value={formatExpiry(
                      slip.expiry_quota,
                      slip.expiry_quota_type,
                    )}
                  />
                  <DetailField
                    label="Compound Schedule"
                    value={
                      getCompoundScheduleEnabled(slip)
                        ? formatCompoundSchedule(slip)
                        : "Disabled"
                    }
                  />
                  <DetailField
                    label="Last Compounded"
                    value={formatDate(getLastCompoundedAt(slip))}
                  />
                  <DetailField
                    label="Account"
                    value={formatAccountLabel(slip)}
                  />
                </div>
              </section>

              <section className="slip-detail-panel">
                <header className="slip-detail-panel__header">
                  <div>
                    <h2>Collateral Items</h2>
                    <p>
                      {(slip.items ?? []).length} item
                      {(slip.items ?? []).length === 1 ? "" : "s"} secured to
                      this loan.
                    </p>
                  </div>
                </header>
                {(slip.items ?? []).length === 0 ? (
                  <div className="slip-detail-empty">
                    No collateral items returned.
                  </div>
                ) : (
                  <div className="slip-detail-collateral-list">
                    {(slip.items ?? []).map((item) => (
                      <SlipItemCard item={item} key={item.id} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="slip-detail-sidebar">
              {canCollectPartialPrincipal && (
                <section className="slip-detail-panel slip-detail-action-card">
                  <header className="slip-detail-panel__header">
                    <div>
                      <h2>Principal Collection</h2>
                      <p>Collect part of the remaining principal.</p>
                    </div>
                  </header>
                  <FormGroup columns={1}>
                    <FormField
                      id="slip-partial-principal"
                      label="Principal Amount"
                    >
                      <FinancialAmountInput
                        id="slip-partial-principal"
                        min="0.01"
                        onChange={(value) => {
                          setPrincipalAmount(value.amount);
                          setPrincipalAmountUnit(value.unit);
                        }}
                        step="0.01"
                        value={{
                          amount: principalAmount,
                          unit: principalAmountUnit,
                        }}
                      />
                    </FormField>
                    <FormField
                      id="slip-partial-principal-account"
                      label="Account"
                    >
                      <FinancialAccountSelect
                        id="slip-partial-principal-account"
                        matchAccountId={slip.account_id ?? slip.accountId ?? null}
                        onChange={setPrincipalAccountId}
                        value={principalAccountId}
                      />
                    </FormField>
                    <ActionBar>
                      <Button
                        disabled={!Number(principalAmount)}
                        fullWidth
                        isLoading={savingAction === "partial-principal"}
                        onClick={() => void collectPartialPrincipal()}
                        variant="primary"
                      >
                        Collect Principal
                      </Button>
                    </ActionBar>
                  </FormGroup>
                </section>
              )}

              {(canCompoundInterest || canManageCompoundSchedule) && (
                <section className="slip-detail-panel slip-detail-action-card">
                  <header className="slip-detail-panel__header">
                    <div>
                      <h2>Interest Compounding</h2>
                      <p>Manage manual and scheduled compounding.</p>
                    </div>
                    <Badge tone={scheduleEnabled ? "success" : "info"}>
                      {scheduleEnabled ? "Scheduled" : "Manual"}
                    </Badge>
                  </header>

                  {canCompoundInterest && (
                    <Button
                      fullWidth
                      isLoading={savingAction === "compound-interest"}
                      onClick={() => void compoundInterest()}
                      variant="secondary"
                    >
                      Compound Now
                    </Button>
                  )}

                  {canManageCompoundSchedule && (
                    <div className="slip-detail-schedule">
                      <Button aria-pressed={scheduleEnabled} isLoading={savingAction === "compound-schedule"}
                        onClick={() => void toggleAutomaticCompounding()} variant={scheduleEnabled ? "primary" : "secondary"}>
                        Automatic Compounding: {scheduleEnabled ? "On" : "Off"}
                      </Button>
                      {scheduleEnabled && <>
                      <FormGroup columns={2}>
                        <FormField id="slip-compound-every" label="Every">
                          <Input
                            id="slip-compound-every"
                            min="1"
                            onChange={(event) =>
                              setCompoundEvery(event.target.value)
                            }
                            type="number"
                            value={compoundEvery}
                          />
                        </FormField>
                        <FormField id="slip-compound-type" label="Period">
                          <Select
                            id="slip-compound-type"
                            onChange={(event) =>
                              setCompoundEveryType(event.target.value)
                            }
                            value={compoundEveryType}
                          >
                            <option value="Day">Day</option>
                            <option value="Week">Week</option>
                            <option value="Month">Month</option>
                          </Select>
                        </FormField>
                      </FormGroup>
                      <FormField id="slip-next-compound-at" label="Next Date">
                        <Input
                          id="slip-next-compound-at"
                          onChange={(event) =>
                            setNextCompoundAt(event.target.value)
                          }
                          type="date"
                          value={nextCompoundAt}
                        />
                      </FormField>
                      <Button
                        fullWidth
                        isLoading={savingAction === "compound-schedule"}
                        onClick={() => void saveCompoundSchedule()}
                        variant="secondary"
                      >
                        Save Schedule
                      </Button>
                      </>}
                    </div>
                  )}
                </section>
              )}

              <section className="slip-detail-panel">
                <header className="slip-detail-panel__header">
                  <div>
                    <h2>Contract Timeline</h2>
                    <p>Key dates and status checkpoints.</p>
                  </div>
                </header>
                <div className="slip-detail-timeline">
                  <TimelineItem
                    label="Slip Created"
                    meta="Loan contract opened"
                    value={formatDate(slip.created_at)}
                  />
                  <TimelineItem
                    label="Last Updated"
                    meta="Latest saved contract state"
                    value={formatDate(slip.updated_at)}
                  />
                  <TimelineItem
                    label="Interest Due"
                    meta={formatCompoundSchedule(slip)}
                    tone="warning"
                    value={formatDate(getNextCompoundAt(slip))}
                  />
                  <TimelineItem
                    label="Expires"
                    meta={formatExpiry(
                      slip.expiry_quota,
                      slip.expiry_quota_type,
                    )}
                    value={formatDate(slip.expire_at)}
                  />
                </div>
              </section>
            </aside>
          </div>

          <ModalForm
            cancelLabel="Cancel"
            confirmLabel="Print"
            isLoading={isPrinting}
            isOpen={isPrintDialogOpen}
            onCancel={() => setIsPrintDialogOpen(false)}
            onSubmit={printSlipDocument}
            title={`Print ${slip.slip_no}`}
          >
            <FormGroup columns={1}>
              <FormField id="slip-detail-print-paper-type" label="Paper Type">
                <Select
                  id="slip-detail-print-paper-type"
                  onChange={(event) => setPaperType(event.target.value)}
                  value={paperType}
                >
                  {paperTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </FormGroup>
          </ModalForm>
        </>
      ) : (
        <Alert
          message="Loan slip was not found."
          title="No slip"
          tone="warning"
        />
      )}
    </section>
  );
}

function SlipItemCard({ item }: { item: SlipCollateralItem }) {
  const isJewellery = item.type.toLowerCase() !== "normal";

  return (
    <article className="slip-detail-collateral-card">
      <header>
        <div>
          <h3>{item.name}</h3>
          <p>{item.description || item.type}</p>
        </div>
        <Badge tone={item.item_status === "active" ? "success" : "info"}>
          {item.item_status ?? "-"}
        </Badge>
      </header>
      <div className="slip-detail-collateral-grid">
        <DetailField label="Type" value={item.type} />
        <DetailField label="Brand" value={item.brand_name ?? "-"} />
        <DetailField label="Quantity" value={item.quantity ?? "-"} />
        <DetailField
          label="Estimated Value"
          value={formatMoney(item.estimated_value)}
        />
        <DetailField
          label="Minimum Retail"
          value={formatMoney(item.minimum_retail_price)}
        />
        {isJewellery ? (
          <>
            <DetailField label="Material" value={item.material_type_name ?? "-"} />
            <DetailField label="Kyat" value={item.kyat ?? "-"} />
            <DetailField label="Pal" value={item.pal ?? "-"} />
            <DetailField label="Yway" value={item.yway ?? "-"} />
          </>
        ) : (
          <DetailField
            label="Category"
            value={item.item_category_type_name ?? "-"}
          />
        )}
      </div>
      {item.type === "Pack of Jewellery" && (
        <PackItemsView items={item.sub_items ?? []} />
      )}
    </article>
  );
}

function SummaryMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "primary";
  value: ReactNode;
}) {
  return (
    <div
      className={`slip-detail-summary-metric ${
        tone === "primary" ? "slip-detail-summary-metric--primary" : ""
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="slip-detail-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TimelineItem({
  label,
  meta,
  tone = "default",
  value,
}: {
  label: string;
  meta: string;
  tone?: "default" | "warning";
  value: string;
}) {
  return (
    <div
      className={`slip-detail-timeline__item slip-detail-timeline__item--${tone}`}
    >
      <span aria-hidden="true" />
      <div>
        <small>{value}</small>
        <strong>{label}</strong>
        <p>{meta}</p>
      </div>
    </div>
  );
}

function ReceiptIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M8 8h11v11H8V8Z" />
      <path d="M5 16H4V4h12v1" />
    </svg>
  );
}

function PercentIcon() {
  return (
    <svg aria-hidden="true" className="button-icon" viewBox="0 0 24 24">
      <path d="M19 5 5 19" />
      <path d="M7.5 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M16.5 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}

function formatExpiry(quota?: number, type?: string) {
  if (!quota || !type) {
    return "-";
  }

  return `${quota} ${type}${quota === 1 ? "" : "s"}`;
}

function formatCompoundSchedule(slip: LoanContractSlip) {
  const every = getCompoundEvery(slip);
  const type = getCompoundEveryType(slip);
  const next = getNextCompoundAt(slip);

  return every && type
    ? `Every ${every} ${type}${every === 1 ? "" : "s"}, next ${formatDate(next)}`
    : getCompoundScheduleEnabled(slip)
      ? "Enabled"
      : "Disabled";
}

function formatCustomerMeta(slip: LoanContractSlip) {
  const customer = slip.customer;
  const parts = [
    customer?.phone,
    customer?.nrc,
    customer?.address,
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "Customer profile";
}

function formatAccountLabel(slip: LoanContractSlip) {
  const accountId = slip.account_id ?? slip.accountId;

  return accountId ? `Account #${accountId}` : "-";
}

function getCustomerInitials(slip: LoanContractSlip) {
  const name = getSlipCustomerName(slip);

  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "C"
  );
}

function getCompoundScheduleEnabled(slip: LoanContractSlip) {
  return Boolean(
    slip.compound_schedule_enabled ?? slip.compoundScheduleEnabled,
  );
}

function getCompoundEvery(slip: LoanContractSlip) {
  return slip.compound_every ?? slip.compoundEvery ?? null;
}

function getCompoundEveryType(slip: LoanContractSlip) {
  return slip.compound_every_type ?? slip.compoundEveryType ?? null;
}

function getNextCompoundAt(slip: LoanContractSlip) {
  return slip.next_compound_at ?? slip.nextCompoundAt ?? null;
}

function getLastCompoundedAt(slip: LoanContractSlip) {
  return slip.last_compounded_at ?? slip.lastCompoundedAt ?? null;
}

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function getRouteNotice(state: unknown) {
  if (
    typeof state === "object" &&
    state &&
    "notice" in state &&
    typeof state.notice === "string"
  ) {
    return state.notice;
  }

  return null;
}
