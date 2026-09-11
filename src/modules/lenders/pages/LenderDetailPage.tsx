import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { routePaths } from "../../../app/routes/paths";
import { Badge, Button } from "../../../components/atoms";
import { Alert, LoadingState } from "../../../components/feedback";
import {
  CirclePlusIcon,
  ContactPageIcon,
  EditIcon,
  SecurityIcon,
} from "../../../components/icons/icon";
import { usePermissions } from "../../auth";
import { AccountCurrencyAmount } from "../../finance/AccountCurrencyAmount";
import { formatDate } from "../../finance/financeFormat";
import { lenderService, type TenantLender } from "../services/lenderService";

export function LenderDetailPage() {
  const { lenderCode = "" } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [lender, setLender] = useState<TenantLender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lenderCode) return;
    setLoading(true);
    lenderService
      .get(lenderCode)
      .then(setLender)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Unable to load lender.",
        ),
      )
      .finally(() => setLoading(false));
  }, [lenderCode]);

  if (!lenderCode) return <Navigate replace to={routePaths.lenders} />;

  return (
    <section className="page lender-profile-page">
      <nav className="lender-profile-breadcrumb" aria-label="Breadcrumb">
        <button onClick={() => navigate(routePaths.lenders)} type="button">
          Lenders
        </button>
        <span>/</span>
        <strong>{lenderCode}</strong>
      </nav>
      {error && (
        <Alert
          message={error}
          onDismiss={() => setError(null)}
          title="Lender lookup failed"
          tone="danger"
        />
      )}
      {loading ? (
        <LoadingState rows={6} />
      ) : lender ? (
        <>
          <section className="lender-profile-summary">
            <div className="lender-profile-avatar">
              {initials(lender.name)}
              <span>Lender</span>
            </div>
            <div className="lender-profile-summary__content">
              <div className="lender-profile-summary__title">
                <h1>{lender.name}</h1>
                <Badge tone="info">{lender.code}</Badge>
              </div>
              <p>{lender.note || "Business funding profile"}</p>
              <div className="lender-profile-summary__metrics">
                <SummaryMetric
                  label="Total Loans"
                  value={String(lender.total_loans ?? lender.totalLoans ?? 0)}
                />
                <SummaryMetric
                  label="Active Loans"
                  value={String(lender.active_loans ?? lender.activeLoans ?? 0)}
                />
                <SummaryMetric
                  label="Outstanding"
                  value={
                    <AccountCurrencyAmount
                      amount={
                        lender.outstanding_principal ??
                        lender.outstandingPrincipal ??
                        "0"
                      }
                    />
                  }
                />
              </div>
            </div>
            <div className="lender-profile-summary__actions">
              {hasPermission("update_lender") && (
                <Button
                  leftIcon={<EditIcon />}
                  onClick={() => navigate(routePaths.lenderEdit(lenderCode))}
                >
                  Edit Lender
                </Button>
              )}
              {hasPermission("create_business_loan") && (
                <Button
                  leftIcon={<CirclePlusIcon />}
                  onClick={() =>
                    navigate(
                      `${routePaths.businessLoanCreate}?lender=${encodeURIComponent(lenderCode)}`,
                    )
                  }
                  variant="secondary"
                >
                  New Business Loan
                </Button>
              )}
              <Button
                onClick={() => navigate(routePaths.lenders)}
                variant="ghost"
              >
                Back
              </Button>
            </div>
          </section>
          <div className="lender-profile-grid">
            <DetailPanel icon={<ContactPageIcon />} title="Contact Details">
              <DetailField label="Phone" value={lender.phone || "-"} />
              <DetailField label="Email" value={lender.email || "-"} />
              <DetailField label="NRC" value={lender.nrc || "-"} />
              <DetailField label="Address" value={lender.address || "-"} />
            </DetailPanel>
            <DetailPanel icon={<SecurityIcon />} title="Record Details">
              <DetailField label="Status" value="Active" />
              <DetailField
                label="Created"
                value={formatDate(lender.created_at)}
              />
              <DetailField
                label="Last Updated"
                value={formatDate(lender.updated_at)}
              />
              <DetailField label="Lender Code" value={lender.code} />
            </DetailPanel>
          </div>
        </>
      ) : (
        <Alert
          message="This lender is unavailable."
          title="Lender not found"
          tone="warning"
        />
      )}
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="lender-profile-summary-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetailPanel({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="lender-profile-panel">
      <header>
        {icon}
        <h2>{title}</h2>
      </header>
      <div>{children}</div>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="lender-profile-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
