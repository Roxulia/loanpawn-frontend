import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { routePaths } from "../../../app/routes/paths";
import { Badge, Button } from "../../../components/atoms";
import { Alert } from "../../../components/feedback";
import {
  CirclePlusIcon,
  TrashIcon,
} from "../../../components/icons/icon";
import {
  Card,
  SearchField,
  SectionHeader,
  TableToolbar,
} from "../../../components/molecules";
import {
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
} from "../../../components/organisms";
import type { TenantDebt } from "../../../dataobjects/tenant/finance";
import { tenantResourceService } from "../../../services/tenant/tenantResourceService";
import { usePermissions } from "../../auth";
import { AccountCurrencyAmount } from "../../finance/AccountCurrencyAmount";
import { FinanceHistoryMobileCard } from "../../finance/FinanceHistoryMobileCard";
import {
  formatDate,
  getStringField,
} from "../../finance/financeFormat";
import { formatDebtLink } from "../components/debtFormat";

const perPage = 10;

const columns: Array<DataTableColumn<TenantDebt>> = [
  {
    header: "Debt Code",
    key: "code",
    render: (item) => <strong>{item.code}</strong>,
  },
  { header: "Linked to", key: "link", render: formatDebtLink },
  {
    header: "Amount",
    key: "amount",
    render: (item) => (
      <strong>
        <AccountCurrencyAmount
          accountId={item.created_account_id ?? item.createdAccountId}
          amount={
            item.principal_balance ?? item.principalBalance ?? item.amount
          }
        />
      </strong>
    ),
  },
  {
    header: "Interest",
    key: "interest",
    render: (item) =>
      (item.apply_interest ?? item.applyInterest) ? (
        <span>
          {item.interest_rate ?? item.interestRate}%{" "}
          {item.interest_type_name ?? item.interestTypeName ?? ""}
        </span>
      ) : (
        "-"
      ),
  },
  { header: "Tag", key: "tag", render: (item) => item.tag || "-" },
  {
    header: "Status",
    key: "status",
    render: (item) => (
      <Badge tone={item.is_paid ? "success" : "warning"}>
        {item.is_paid ? "Paid" : "Unpaid"}
      </Badge>
    ),
  },
  {
    header: "Created",
    key: "created",
    render: (item) =>
      formatDate(getStringField(item, "created_at", "createdAt")),
  },
];

export function DebtsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("create_debt");
  const canUpdate = hasPermission("update_debt");
  const canDelete = hasPermission("delete_debt");
  const [items, setItems] = useState<TenantDebt[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<TenantDebt | null>(null);

  const legacyParams = new URLSearchParams(location.search);
  const legacyDebtCode = legacyParams.get("debt_code") ?? "";
  const shouldRedirectLegacyPayment =
    legacyParams.get("tab") === "payment" && legacyDebtCode.trim();

  const load = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await tenantResourceService.listDebts({
          page,
          perPage,
          search: debouncedSearch,
        });
        setItems(result.items);
        setCurrentPage(result.current_page);
        setLastPage(result.last_page);
        setTotal(result.total);
      } catch (reason) {
        setError(
          reason instanceof Error ? reason.message : "Unable to load debts.",
        );
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(currentPage), 0);

    return () => window.clearTimeout(timer);
  }, [currentPage, load]);

  async function remove() {
    if (!debtToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await tenantResourceService.deleteDebt(debtToDelete.code);
      setNotice("Debt deleted successfully.");
      setDebtToDelete(null);
      await load(
        items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to delete debt.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function actions(row: TenantDebt) {
    return (
      <div className="business-loan-row-actions">
        {!row.is_paid && canUpdate && (
          <Button
            aria-label={`Record payment for ${row.code}`}
            className="ui-button--icon"
            onClick={() => navigate(routePaths.debtPayment(row.code))}
            title="Record payment"
            variant="primary"
          >
            $
          </Button>
        )}
        {canDelete && (
          <Button
            aria-label={`Delete ${row.code}`}
            className="ui-button--icon"
            onClick={() => setDebtToDelete(row)}
            title="Delete debt"
            variant="danger"
          >
            <TrashIcon />
          </Button>
        )}
      </div>
    );
  }

  if (shouldRedirectLegacyPayment) {
    return (
      <Navigate
        replace
        to={routePaths.debtPayment(legacyDebtCode.trim())}
      />
    );
  }

  return (
    <section className="page business-loan-registry-page debt-registry-page">
      <SectionHeader
        title="Debts"
        subtitle="Track unpaid interest and debt records attached to pawn operations."
        action={
          canCreate ? (
            <Button
              leftIcon={<CirclePlusIcon />}
              onClick={() => navigate(routePaths.debtCreate)}
              variant="primary"
            >
              Add Debt
            </Button>
          ) : null
        }
      />
      <Card
        title="Debt records"
        description={`${total} total debt${total === 1 ? "" : "s"}`}
        action={<Badge tone="info">Finance</Badge>}
      >
        <div className="business-loan-registry debt-registry">
          {error && (
            <Alert
              message={error}
              onDismiss={() => setError(null)}
              title="Debt action failed"
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
                id="debt-search"
                label="Filter debts"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Debt code, slip code, tag, status, description, or amount"
                value={search}
              />
            }
          />
          <DataTable
            actions={actions}
            columns={columns}
            emptyAction={
              canCreate ? (
                <Button
                  leftIcon={<CirclePlusIcon />}
                  onClick={() => navigate(routePaths.debtCreate)}
                  variant="primary"
                >
                  Add Debt
                </Button>
              ) : null
            }
            emptyDescription={
              debouncedSearch
                ? "No debts match this search."
                : "No unpaid interest or other debt records found."
            }
            emptyTitle={debouncedSearch ? "No matching debts" : "No debts"}
            getItemId={(row) => row.id}
            getItemTitle={(row) => row.code}
            isLoading={loading}
            items={items}
            onRowClick={(row) => navigate(routePaths.debtDetail(row.code))}
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
                    accountId={row.created_account_id ?? row.createdAccountId}
                    amount={
                      row.principal_balance ??
                      row.principalBalance ??
                      row.amount
                    }
                  />
                }
                eyebrow={row.code}
                meta={
                  <>
                    {formatDebtLink(row)} -{" "}
                    {formatDate(getStringField(row, "created_at", "createdAt"))}
                  </>
                }
                onClick={() => navigate(routePaths.debtDetail(row.code))}
                status={row.is_paid ? "Paid" : "Unpaid"}
                statusTone={row.is_paid ? "active" : "due"}
                title={row.description}
              />
            )}
          />
        </div>
      </Card>
      <ConfirmDialog
        confirmLabel="Delete Debt"
        isLoading={deleting}
        isOpen={Boolean(debtToDelete)}
        message={`Delete debt ${debtToDelete?.code ?? ""}? This action cannot be undone.`}
        onCancel={() => setDebtToDelete(null)}
        onConfirm={() => void remove()}
        title="Confirm debt deletion"
      />
    </section>
  );
}
