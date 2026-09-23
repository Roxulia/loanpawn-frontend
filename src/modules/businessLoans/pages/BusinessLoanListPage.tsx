import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
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
import { usePermissions } from "../../auth";
import { AccountCurrencyAmount } from "../../finance/AccountCurrencyAmount";
import { FinanceHistoryMobileCard } from "../../finance/FinanceHistoryMobileCard";
import { formatDate } from "../../finance/financeFormat";
import {
  businessLoanService,
  type BusinessLoan,
} from "../services/businessLoanService";

const perPage = 10;

export function BusinessLoanListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
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
    [debouncedSearch, filters],
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
      render: (row) =>
        row.apply_interest
          ? `${row.interest_rate}% ${row.interest_type_name ?? ""}`
          : "-",
    },
    {
      header: "Status",
      key: "status",
      render: (row) => (
        <Badge tone={row.is_paid ? "success" : "warning"}>
          {row.is_paid ? "Settled" : "Active"}
        </Badge>
      ),
    },
    {
      header: "Created",
      key: "created",
      render: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <section className="page business-loan-registry-page">
      <SectionHeader
        title="Business Loans"
        subtitle="Track lender funding, interest expense, and repayments."
        action={
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
      />
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
    </section>
  );
}
