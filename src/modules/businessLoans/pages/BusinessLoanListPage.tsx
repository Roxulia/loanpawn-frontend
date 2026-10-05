import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { routePaths } from "../../../app/routes/paths";
import { Badge, Button, Input, Select } from "../../../components/atoms";
import { Alert } from "../../../components/feedback";
import {
  CirclePlusIcon,
  EditIcon,
  TrashIcon,
} from "../../../components/icons/icon";
import {
  Card,
  FormField,
  SearchField,
  SectionHeader,
  TableToolbar,
} from "../../../components/molecules";
import {
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
} from "../../../components/organisms";
import { useFeatures, usePermissions } from "../../auth";
import { AccountCurrencyAmount } from "../../finance/AccountCurrencyAmount";
import { FinanceHistoryMobileCard } from "../../finance/FinanceHistoryMobileCard";
import { formatDate } from "../../finance/financeFormat";
import { FinancialAccountSelect } from "../../financialAccounts/components/FinancialAccountSelect";
import { purchasingService } from "../../purchasing/services/purchasingService";
import type { SupplierPayable } from "../../purchasing/types";
import "./businessLoanList.css";
import {
  businessLoanService,
  type BusinessLoan,
} from "../services/businessLoanService";

const perPage = 10;

export function BusinessLoanListPage({ initialTab = "loans" }: { initialTab?: "loans" | "payables" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  const { hasEnabledFeature } = useFeatures();
  const canSeeLoans = hasEnabledFeature("business_loan_management") && hasPermission("list_business_loan");
  const canSeePayables = hasEnabledFeature("purchasing_management") && hasPermission("list_purchase_order");
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"loans" | "payables">(requestedTab === "payables" ? "payables" : initialTab);
  const canCreate = hasPermission("create_business_loan");
  const canUpdate = hasPermission("update_business_loan");
  const canDelete = hasPermission("delete_business_loan");
  const [items, setItems] = useState<BusinessLoan[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<BusinessLoan | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: "", typeId: "", lenderId: "", fromDate: "", toDate: "" });

  const load = useCallback(
    async (page: number) => {
      if (!canSeeLoans) { setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const result = await businessLoanService.list({
          page,
          perPage,
          search: debouncedSearch,
          status: filters.status || undefined,
          typeId: filters.typeId || undefined,
          lenderId: filters.lenderId || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
        });
        setItems(result.data);
        setCurrentPage(result.current_page);
        setLastPage(result.last_page);
        setTotal(result.total);
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load business loans.",
        );
      } finally {
        setLoading(false);
      }
    },
    [canSeeLoans, debouncedSearch, filters],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  function updateFilter(key: string, value: string) {
    setCurrentPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(currentPage), 0);
    return () => window.clearTimeout(timer);
  }, [currentPage, load]);

  async function remove() {
    if (!loanToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await businessLoanService.delete(loanToDelete.code);
      setNotice("Business loan deleted successfully.");
      setLoanToDelete(null);
      await load(
        items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to delete business loan.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function actions(row: BusinessLoan) {
    return (
      <div className="business-loan-row-actions">
        {!row.is_paid && canUpdate && (
          <Button
            aria-label={`Record payment for ${row.code}`}
            className="ui-button--icon"
            onClick={() => navigate(routePaths.businessLoanPayment(row.code))}
            title="Record payment"
            variant="primary"
          >
            $
          </Button>
        )}
        {canUpdate && (
          <Button
            aria-label={`Edit ${row.code}`}
            className="ui-button--icon"
            onClick={() => navigate(routePaths.businessLoanEdit(row.code))}
            title="Edit business loan"
            variant="secondary"
          >
            <EditIcon />
          </Button>
        )}
        {canDelete && (
          <Button
            aria-label={`Delete ${row.code}`}
            className="ui-button--icon"
            onClick={() => setLoanToDelete(row)}
            title="Delete business loan"
            variant="danger"
          >
            <TrashIcon />
          </Button>
        )}
      </div>
    );
  }

  const columns: Array<DataTableColumn<BusinessLoan>> = [
    {
      header: "Loan",
      key: "code",
      render: (row) => <strong>{row.code}</strong>,
    },
    { header: "Lender", key: "lender", render: (row) => row.lender_name },
    {
      header: "Outstanding",
      key: "amount",
      align: "right",
      render: (row) => (
        <strong>
          <AccountCurrencyAmount
            accountId={row.receipt_account_id}
            amount={row.total_outstanding}
          />
        </strong>
      ),
    },
    {
      header: "Interest",
      key: "interest",
      align: "center",
      render: (row) =>
        row.apply_interest
          ? `${row.interest_rate}% ${row.interest_type_name ?? ""}`
          : "-",
    },
    {
      header: "Status",
      key: "status",
      align: "center",
      render: (row) => (
        <Badge tone={row.is_paid ? "success" : "warning"}>
          {row.is_paid ? "Settled" : "Active"}
        </Badge>
      ),
    },
    {
      header: "Created",
      key: "created",
      align: "center",
      render: (row) => formatDate(row.created_at),
    },
  ];

  const selectedTab = canSeeLoans ? activeTab : "payables";

  return (
    <section className="page business-loan-registry-page">
      <SectionHeader
        title={selectedTab === "payables" ? "Supplier Payables" : "Business Loans"}
        subtitle={selectedTab === "payables" ? "Review purchase balances and record supplier payments." : "Track lender funding, interest expense, and repayments."}
        action={
          selectedTab === "loans" && canSeeLoans && canCreate ? (
            <Button
              variant="primary"
              leftIcon={<CirclePlusIcon />}
              onClick={() => navigate(routePaths.businessLoanCreate)}
            >
              Create Business Loan
            </Button>
          ) : null
        }
      />
      {canSeeLoans && canSeePayables && <div className="obligations-tabs" role="tablist" aria-label="Business obligations">
        <button type="button" role="tab" aria-selected={selectedTab === "loans"} className={selectedTab === "loans" ? "obligations-tab obligations-tab--active" : "obligations-tab"} onClick={() => setActiveTab("loans")}>Business Loans</button>
        <button type="button" role="tab" aria-selected={selectedTab === "payables"} className={selectedTab === "payables" ? "obligations-tab obligations-tab--active" : "obligations-tab"} onClick={() => setActiveTab("payables")}>Supplier Payables</button>
      </div>}
      {selectedTab === "payables" && canSeePayables ? <SupplierPayablesPanel /> : canSeeLoans ? <>
      <Card
        title="Business loan records"
        description={`${total} total business loan${total === 1 ? "" : "s"}`}
        action={<Badge tone="info">Finance</Badge>}
      >
        <div className="business-loan-registry">
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
          <TableToolbar
            actions={
              <Button
                onClick={() => void load(currentPage)}
                variant="secondary"
              >
                Refresh
              </Button>
            }
            search={
              <SearchField
                id="business-loan-search"
                label="Filter business loans"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Loan code, lender, status, tag, or amount"
                value={search}
              />
            }
            filters={
              <Button
                aria-expanded={showFilters}
                onClick={() => {
                  setShowFilters((current) => !current);
                  if (showFilters) {
                    setFilters({ status: "", typeId: "", lenderId: "", fromDate: "", toDate: "" });
                    setCurrentPage(1);
                  }
                }}
                variant={showFilters ? "primary" : "secondary"}
              >
                {showFilters ? "Hide filters" : "Show filters"}
              </Button>
            }
          />
          {showFilters ? (
            <div className="finance-list-filters business-loan-list-filters">
              <FormField id="business-loan-filter-status" label="Status">
                <Select id="business-loan-filter-status" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="settled">Settled</option></Select>
              </FormField>
              <FormField id="business-loan-filter-from" label="Created from"><Input id="business-loan-filter-from" type="date" value={filters.fromDate} onChange={(event) => updateFilter("fromDate", event.target.value)} /></FormField>
              <FormField id="business-loan-filter-to" label="Created to"><Input id="business-loan-filter-to" type="date" value={filters.toDate} onChange={(event) => updateFilter("toDate", event.target.value)} /></FormField>
            </div>
          ) : null}
          <DataTable
            actions={actions}
            columns={columns}
            emptyAction={
              canCreate ? (
                <Button
                  variant="primary"
                  leftIcon={<CirclePlusIcon />}
                  onClick={() => navigate(routePaths.businessLoanCreate)}
                >
                  Create Business Loan
                </Button>
              ) : null
            }
            emptyDescription={
              debouncedSearch
                ? "No business loans match this search."
                : "Create a business loan to record lender funding."
            }
            emptyTitle={
              debouncedSearch ? "No matching loans" : "No business loans"
            }
            getItemId={(row) => row.id}
            getItemTitle={(row) => row.code}
            isLoading={loading}
            items={items}
            onRowClick={(row) =>
              navigate(routePaths.businessLoanDetail(row.code))
            }
            pagination={{
              currentPage,
              lastPage,
              onNext: () => setCurrentPage((page) => page + 1),
              onPrevious: () => setCurrentPage((page) => page - 1),
              total,
            }}
            renderMobileCard={(row, rowActions) => (
              <FinanceHistoryMobileCard
                actions={rowActions}
                amount={
                  <AccountCurrencyAmount
                    accountId={row.receipt_account_id}
                    amount={row.total_outstanding}
                  />
                }
                eyebrow={row.code}
                meta={
                  <>
                    {row.lender_name} · {formatDate(row.created_at)}
                  </>
                }
                onClick={() =>
                  navigate(routePaths.businessLoanDetail(row.code))
                }
                status={row.is_paid ? "Settled" : "Active"}
                statusTone={row.is_paid ? "active" : "due"}
                title={row.description}
              />
            )}
          />
        </div>
      </Card>
      <ConfirmDialog
        confirmLabel="Delete Business Loan"
        isLoading={deleting}
        isOpen={Boolean(loanToDelete)}
        message={`Delete business loan ${loanToDelete?.code ?? ""}? This action cannot be undone.`}
        onCancel={() => setLoanToDelete(null)}
        onConfirm={() => void remove()}
        title="Confirm business loan deletion"
      />
      </> : <Alert tone="warning" title="Business obligations unavailable" message="Your account does not have access to either obligation type." />}
    </section>
  );
}

// Show purchasing-owned supplier balances inside the shared obligations registry.
function SupplierPayablesPanel() {
  const { hasPermission } = usePermissions();
  const canPay = hasPermission("manage_purchase_payment");
  const [rows, setRows] = useState<SupplierPayable[]>([]);
  const [selected, setSelected] = useState<SupplierPayable | null>(null);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load payable records and keep refresh actions scoped to this tab.
  async function load() {
    setLoading(true);
    try { setRows(await purchasingService.payables()); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Supplier payables could not be loaded."); }
    finally { setLoading(false); }
  }
  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  // Record a settlement against the selected supplier payable.
  async function pay(event: FormEvent) {
    event.preventDefault();
    if (!selected || !accountId || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await purchasingService.recordPayablePayment(selected.code, { paid_at: paidAt, amount: Number(amount), financial_account_id: Number(accountId) });
      setSelected(null); setAmount(""); setAccountId(""); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Supplier payment could not be saved."); }
    finally { setSaving(false); }
  }

  const columns: Array<DataTableColumn<SupplierPayable>> = [
    { header: "Supplier", key: "supplier", render: row => row.supplier_name ?? "-" },
    { header: "Purchase / Receipt", key: "purchase", render: row => row.purchase_order_code ?? row.purchase_receipt_code ?? "-" },
    { header: "Original", key: "original", align: "right", render: row => `${row.original_amount} ${row.currency_code ?? ""}` },
    { header: "Balance", key: "balance", align: "right", render: row => <strong>{row.balance_amount} {row.currency_code ?? ""}</strong> },
    { header: "Status", key: "status", render: row => <Badge>{row.status}</Badge> },
  ];

  return <Card title="Supplier Payables" description={`${rows.length} supplier balances`} action={<Badge tone="info">Purchasing</Badge>}>
    {error && <Alert tone="danger" title="Supplier payable action failed" message={error} />}
    <DataTable columns={columns} items={rows} isLoading={loading} getItemId={row => row.code} getItemTitle={row => row.code} emptyTitle="No supplier payables" emptyDescription="Unpaid received purchase amounts will appear here." actions={canPay ? row => Number(row.balance_amount) > 0 ? <Button onClick={() => { setSelected(row); setAmount(row.balance_amount); }} variant="secondary">Pay</Button> : null : undefined} />
    {selected && <form className="obligation-payment" onSubmit={pay}>
      <h2>Record supplier payment</h2>
      <FormField id="payable-date" label="Payment date"><Input id="payable-date" required type="date" value={paidAt} onChange={event => setPaidAt(event.target.value)} /></FormField>
      <FormField id="payable-amount" label="Amount"><Input id="payable-amount" required type="number" min="0.01" max={selected.balance_amount} step="0.01" value={amount} onChange={event => setAmount(event.target.value)} /></FormField>
      <FinancialAccountSelect id="payable-account" value={accountId} onChange={setAccountId} matchCurrencyCode={selected.currency_code} />
      <Button type="button" variant="tertiary" onClick={() => setSelected(null)}>Cancel</Button><Button type="submit" disabled={saving || !accountId}>{saving ? "Saving…" : "Record payment"}</Button>
    </form>}
  </Card>;
}
