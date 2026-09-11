import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { routePaths } from "../../../app/routes/paths";
import { Alert, LoadingState } from "../../../components/feedback";
import { SectionHeader } from "../../../components/molecules";
import {
  BusinessLoanForm,
  businessLoanPayload,
  type BusinessLoanFormState,
} from "../components/BusinessLoanForm";
import { businessLoanService } from "../services/businessLoanService";

export function BusinessLoanUpdatePage() {
  const { loanCode = "" } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<BusinessLoanFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (loanCode)
      void businessLoanService
        .get(loanCode)
        .then((loan) =>
          setForm({
            amount: loan.amount,
            amount_unit: "UNIT",
            lender_code: loan.lender_code ?? "",
            receipt_account_id: String(loan.receipt_account_id),
            description: loan.description,
            tag: loan.tag ?? "",
            apply_interest: loan.apply_interest,
            interest_rate: loan.interest_rate ?? "",
            interest_type_id: String(loan.interest_type_id ?? ""),
            reporting_exchange_rate: "",
            reporting_exchange_rate_inversed: false,
            update_key: loan.update_key,
          }),
        )
        .catch((reason) =>
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load business loan.",
          ),
        );
  }, [loanCode]);
  if (!loanCode) return <Navigate replace to={routePaths.businessLoans} />;
  function change<K extends keyof BusinessLoanFormState>(
    field: K,
    value: BusinessLoanFormState[K],
  ) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const payload = businessLoanPayload(form);
      await businessLoanService.update(loanCode, {
        amount: payload.amount,
        amount_unit: payload.amount_unit,
        lender_code: payload.lender_code,
        receipt_account_id: payload.receipt_account_id,
        description: payload.description,
        tag: payload.tag,
        reporting_exchange_rate: payload.reporting_exchange_rate,
        reporting_exchange_rate_inversed:
          payload.reporting_exchange_rate_inversed,
        update_key: form.update_key,
      });
      navigate(routePaths.businessLoanDetail(loanCode));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to update business loan.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="page business-loan-update-page">
      <SectionHeader title="Edit Business Loan" subtitle={loanCode} />
      {form ? (
        <BusinessLoanForm
          error={
            error ? (
              <Alert
                message={error}
                onDismiss={() => setError(null)}
                title="Update failed"
                tone="danger"
              />
            ) : null
          }
          mode="edit"
          onCancel={() => navigate(routePaths.businessLoanDetail(loanCode))}
          onChange={change}
          onSubmit={submit}
          saving={saving}
          value={form}
        />
      ) : (
        <LoadingState rows={5} />
      )}
    </section>
  );
}
