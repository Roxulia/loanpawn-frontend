import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { routePaths } from "../../../app/routes/paths";
import { Badge, Button } from "../../../components/atoms";
import { Alert, EmptyState, LoadingState } from "../../../components/feedback";
import {
  CirclePlusIcon,
  ContactPageIcon,
  EditIcon,
  RefreshIcon,
  TrashIcon,
} from "../../../components/icons/icon";
import { SearchField } from "../../../components/molecules";
import { ConfirmDialog } from "../../../components/organisms";
import { usePermissions } from "../../auth";
import { AccountCurrencyAmount } from "../../finance/AccountCurrencyAmount";
import { lenderService, type TenantLender } from "../services/lenderService";

const perPage = 10;

export function LenderListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("create_lender");
  const canUpdate = hasPermission("update_lender");
  const canDelete = hasPermission("delete_lender");
  const [items, setItems] = useState<TenantLender[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lenderToDelete, setLenderToDelete] = useState<TenantLender | null>(
    null,
  );

  const load = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await lenderService.list({
          page,
          perPage,
          search: debouncedSearch,
        });
        setItems(result.data);
        setCurrentPage(result.current_page);
        setLastPage(result.last_page);
        setTotal(result.total);
      } catch (reason) {
        setError(
          reason instanceof Error ? reason.message : "Unable to load lenders.",
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
    if (!lenderToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await lenderService.delete(lenderToDelete.code);
      setNotice("Lender deleted successfully.");
      setLenderToDelete(null);
      await load(
        items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to delete lender.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function actions(item: TenantLender) {
    return (
      <div className="lender-row-actions">
        {canUpdate && (
          <Button
            aria-label={`Edit ${item.name}`}
            className="ui-button--icon"
            onClick={() => navigate(routePaths.lenderEdit(item.code))}
            title="Edit lender"
            variant="secondary"
          >
            <EditIcon />
          </Button>
        )}
        {canDelete && (
          <Button
            aria-label={`Delete ${item.name}`}
            className="ui-button--icon"
            onClick={() => setLenderToDelete(item)}
            title="Delete lender"
            variant="danger"
          >
            <TrashIcon />
          </Button>
        )}
      </div>
    );
  }

  return (
    <section className="page lender-registry-page">
      <header className="lender-registry-page__header">
        <div>
          <span className="eyebrow">Lenders / Registry</span>
          <h1>Lenders</h1>
          <p>Manage people and organizations that fund business loans.</p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            className="lender-registry-page__desktop-create"
            leftIcon={<CirclePlusIcon />}
            onClick={() => navigate(routePaths.lenderCreate)}
          >
            Add Lender
          </Button>
        )}
      </header>
      {canCreate && (
        <div className="lender-registry-page__mobile-create">
          <Button
            variant="primary"
            leftIcon={<CirclePlusIcon />}
            onClick={() => navigate(routePaths.lenderCreate)}
          >
            Add Lender
          </Button>
        </div>
      )}
      <section className="lender-registry" aria-label="Lender records">
        <header className="lender-registry__toolbar">
          <div>
            <h2>Lender records</h2>
            <p>
              {total} total lender{total === 1 ? "" : "s"}
            </p>
          </div>
          <div className="lender-registry__controls">
            <SearchField
              id="lender-search"
              label="Search lenders"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, code, phone, email, or NRC"
              value={search}
            />
            <Button
              className="lender-registry__refresh--desktop"
              onClick={() => void load(currentPage)}
              variant="secondary"
            >
              Refresh
            </Button>
            <button
              aria-label="Refresh lender records"
              className="lender-registry__refresh--mobile"
              onClick={() => void load(currentPage)}
              title="Refresh"
              type="button"
            >
              <RefreshIcon />
            </button>
          </div>
        </header>
        <div className="lender-registry__body">
          {error && (
            <Alert
              message={error}
              onDismiss={() => setError(null)}
              title="Lender action failed"
              tone="danger"
            />
          )}
          {notice && (
            <Alert
              message={notice}
              onDismiss={() => setNotice(null)}
              title="Lender updated"
              tone="success"
            />
          )}
          {loading ? (
            <LoadingState rows={5} />
          ) : items.length === 0 ? (
            <EmptyState
              action={
                canCreate ? (
                  <Button
                    variant="primary"
                    leftIcon={<CirclePlusIcon />}
                    onClick={() => navigate(routePaths.lenderCreate)}
                  >
                    Add Lender
                  </Button>
                ) : null
              }
              description={
                debouncedSearch
                  ? "No lenders match this search."
                  : "Create a lender to begin recording business funding."
              }
              title={debouncedSearch ? "No matching lenders" : "No lenders yet"}
            />
          ) : (
            <>
              <div className="lender-registry__table">
                <table>
                  <thead>
                    <tr>
                      <th>Lender</th>
                      <th>Contact</th>
                      <th>Active loans</th>
                      <th>Outstanding</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() =>
                          navigate(routePaths.lenderDetail(item.code))
                        }
                      >
                        <td>
                          <div className="lender-registry-person">
                            <span className="lender-registry-person__avatar">
                              {initials(item.name)}
                            </span>
                            <span>
                              <strong>{item.name}</strong>
                              <small>{item.code}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="lender-registry-stack">
                            <span>{item.email || "-"}</span>
                            <small>{item.phone || "-"}</small>
                          </div>
                        </td>
                        <td>
                          <Badge tone="info">
                            {item.active_loans ?? item.activeLoans ?? 0}
                          </Badge>
                        </td>
                        <td>
                          <strong>
                            <AccountCurrencyAmount
                              amount={
                                item.outstanding_principal ??
                                item.outstandingPrincipal ??
                                "0"
                              }
                            />
                          </strong>
                        </td>
                        <td onClick={(event) => event.stopPropagation()}>
                          {actions(item)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lender-registry__cards">
                {items.map((item) => (
                  <article
                    className="lender-record-card"
                    key={item.id}
                    onClick={() => navigate(routePaths.lenderDetail(item.code))}
                  >
                    <header>
                      <div>
                        <span className="lender-record-card__avatar">
                          {initials(item.name)}
                        </span>
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.code}</small>
                        </span>
                      </div>
                      <Badge tone="info">
                        {item.active_loans ?? item.activeLoans ?? 0} active
                      </Badge>
                    </header>
                    <div className="lender-record-card__amount">
                      <span>Outstanding principal</span>
                      <strong>
                        <AccountCurrencyAmount
                          amount={
                            item.outstanding_principal ??
                            item.outstandingPrincipal ??
                            "0"
                          }
                        />
                      </strong>
                    </div>
                    <footer>
                      <span>{item.phone || "No phone"}</span>
                      <div onClick={(event) => event.stopPropagation()}>
                        {actions(item)}
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
              <footer className="lender-registry__pagination">
                <span>
                  Page {currentPage} of {lastPage} · {total} records
                </span>
                <div>
                  <Button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                    variant="secondary"
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={currentPage >= lastPage}
                    onClick={() => setCurrentPage((page) => page + 1)}
                    variant="secondary"
                  >
                    Next
                  </Button>
                </div>
              </footer>
            </>
          )}
        </div>
      </section>
      <ConfirmDialog
        confirmLabel="Delete Lender"
        isLoading={deleting}
        isOpen={Boolean(lenderToDelete)}
        message={`Delete ${lenderToDelete?.name ?? "this lender"}? This action cannot be undone.`}
        onCancel={() => setLenderToDelete(null)}
        onConfirm={() => void remove()}
        title="Confirm lender deletion"
      />
    </section>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "L"
  );
}
