import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Button, Input } from "../../../components/atoms";
import { Alert, LoadingState } from "../../../components/feedback";
import { SectionHeader } from "../../../components/molecules";
import { FinancialAccountSelect } from "../../financialAccounts/components/FinancialAccountSelect";
import { useFeatures, usePermissions } from "../../auth";
import { useUiLocale } from "../../../locales/UiLocale";
import { businessLoanService, type BusinessLoan } from "../../businessLoans/services/businessLoanService";
import { routePaths } from "../../../app/routes/paths";
import { purchasingService } from "../services/purchasingService";
import type { SupplierPayable } from "../types";
import "./obligations.css";

const today = () => new Date().toISOString().slice(0, 10);
const money = (amount: string, currency?: string | null) => `${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency ?? ""}`;
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export function ObligationsPage() {
  const { t } = useUiLocale();
  const { hasPermission } = usePermissions();
  const { hasEnabledFeature } = useFeatures();
  const canSeePayables = hasEnabledFeature("purchasing_management") && hasPermission("list_purchase_order");
  const canSeeLoans = hasEnabledFeature("business_loan_management") && hasPermission("list_business_loan");
  const canPay = hasPermission("manage_purchase_payment");
  const [activeTab, setActiveTab] = useState<"payables" | "loans">("payables");
  const [payables, setPayables] = useState<SupplierPayable[]>([]);
  const [loans, setLoans] = useState<BusinessLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payableCode, setPayableCode] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(today());
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const requests: Promise<void>[] = [];
    if (canSeePayables) requests.push(purchasingService.payables().then(rows => { if (active) setPayables(rows); }));
    if (canSeeLoans) requests.push(businessLoanService.list({ perPage: 200 }).then(result => { if (active) setLoans(result.data); }));
    void Promise.all(requests).catch(reason => { if (active) setError(errorMessage(reason, t("Could not load obligations."))); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canSeeLoans, canSeePayables, t]);

  async function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!payableCode || Number(amount) <= 0) return;
    setSaving(true); setError("");
    try {
      await purchasingService.recordPayablePayment(payableCode, { paid_at: paidAt, amount: Number(amount), ...(accountId ? { financial_account_id: Number(accountId) } : {}) });
      setPayables(await purchasingService.payables());
      setPayableCode(""); setAmount(""); setAccountId("");
    } catch (reason) { setError(errorMessage(reason, t("Could not load obligations."))); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="page-content obligations-page"><LoadingState /></main>;

  // Render one obligation category at a time to keep the table and actions focused.
  const selectedTab = canSeePayables ? activeTab : "loans";

  return (
    <main className="page-content obligations-page">
      <SectionHeader title={t("Obligations")} subtitle={t("Review supplier balances and business loan balances in separate views.")} />
      {error && <Alert tone="danger" title={t("Could not complete the request")} message={error} />}
      {(canSeePayables && canSeeLoans) && <div className="obligations-tabs" role="tablist" aria-label={t("Obligation types")}>
        <button type="button" role="tab" aria-selected={selectedTab === "payables"} className={selectedTab === "payables" ? "obligations-tab obligations-tab--active" : "obligations-tab"} onClick={() => setActiveTab("payables")}>{t("Supplier payables")}</button>
        <button type="button" role="tab" aria-selected={selectedTab === "loans"} className={selectedTab === "loans" ? "obligations-tab obligations-tab--active" : "obligations-tab"} onClick={() => setActiveTab("loans")}>{t("Business loans")}</button>
      </div>}

      {canSeePayables && selectedTab === "payables" && <section className="obligation-section" role="tabpanel">
        <div className="obligation-section__heading"><div><h2>{t("Supplier payables")}</h2><p>{payables.length} {t("open and settled balances")}</p></div></div>
        {payables.length === 0 ? <p>{t("No supplier payables.")}</p> : <>
          <div className="obligations-desktop"><table><thead><tr><th>{t("Supplier")}</th><th>{t("Order / receipt")}</th><th>{t("Original")}</th><th>{t("Balance")}</th><th>{t("Status")}</th><th></th></tr></thead><tbody>{payables.map((row) => <tr key={row.code}><td>{row.supplier_name}</td><td>{row.purchase_order_code ? <Link to={routePaths.purchasingOrder(row.purchase_order_code)}>{row.purchase_order_code}</Link> : row.purchase_receipt_code ?? "—"}</td><td>{money(row.original_amount, row.currency_code)}</td><td>{money(row.balance_amount, row.currency_code)}</td><td>{t(row.status)}</td><td>{canPay && Number(row.balance_amount) > 0 && <Button type="button" variant="tertiary" onClick={() => { setPayableCode(row.code); setAmount(row.balance_amount); }}>{t("Pay")}</Button>}</td></tr>)}</tbody></table></div>
          <div className="obligations-mobile">{payables.map((row) => <article className="obligation-card" key={row.code}><strong>{t("Supplier")}: {row.supplier_name}</strong>{row.purchase_order_code ? <Link to={routePaths.purchasingOrder(row.purchase_order_code)}>{row.purchase_order_code}</Link> : row.purchase_receipt_code ?? "—"}<span>{t("Balance")}: {money(row.balance_amount, row.currency_code)}</span><span>{t(row.status)}</span>{canPay && Number(row.balance_amount) > 0 && <Button type="button" variant="tertiary" onClick={() => { setPayableCode(row.code); setAmount(row.balance_amount); }}>{t("Pay")}</Button>}</article>)}</div>
        </>}
      </section>}

      {canSeeLoans && selectedTab === "loans" && <section className="obligation-section" role="tabpanel">
        <div className="obligation-section__heading"><div><h2>{t("Business loans")}</h2><p>{loans.length} {t("loan balances")}</p></div></div>
        {loans.length === 0 ? <p>{t("No Business Loans.")}</p> : <>
          <div className="obligations-desktop"><table><thead><tr><th>{t("Lender")}</th><th>{t("Description")}</th><th>{t("Principal")}</th><th>{t("Outstanding")}</th><th>{t("Status")}</th></tr></thead><tbody>{loans.map((loan) => <tr key={loan.code}><td>{loan.lender_name}</td><td><Link to={routePaths.businessLoanDetail(loan.code)}>{loan.description}</Link></td><td>{money(loan.principal_balance, loan.currency_code)}</td><td>{money(loan.total_outstanding, loan.currency_code)}</td><td>{t(loan.is_paid ? "SETTLED" : "OPEN")}</td></tr>)}</tbody></table></div>
          <div className="obligations-mobile">{loans.map((loan) => <article className="obligation-card" key={loan.code}><strong>{loan.lender_name}</strong><Link to={routePaths.businessLoanDetail(loan.code)}>{loan.description}</Link><span>{t("Outstanding")}: {money(loan.total_outstanding, loan.currency_code)}</span><span>{t(loan.is_paid ? "SETTLED" : "OPEN")}</span></article>)}</div>
        </>}
      </section>}

      {payableCode && <div className="obligation-payment-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPayableCode(""); }}>
        <form className="obligation-payment" role="dialog" aria-modal="true" aria-labelledby="obligation-payment-title" onSubmit={submitPayment}>
          <h2 id="obligation-payment-title">{t("Record supplier payment")}</h2>
          <label htmlFor="payable-date">{t("Payment date")}</label><Input id="payable-date" type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
          <label htmlFor="payable-amount">{t("Amount")}</label><Input id="payable-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <FinancialAccountSelect id="payable-account" value={accountId} onChange={setAccountId} matchCurrencyCode={payables.find(row => row.code === payableCode)?.currency_code} />
          <div className="obligation-payment__actions"><Button type="button" variant="tertiary" onClick={() => setPayableCode("")}>{t("Cancel")}</Button><Button type="submit" disabled={saving}>{saving ? t("Saving...") : t("Record payment")}</Button></div>
        </form>
      </div>}
    </main>
  );
}
