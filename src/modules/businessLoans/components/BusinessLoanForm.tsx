import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button, Input, Select, Textarea } from "../../../components/atoms";
import {
  ActionBar,
  Card,
  FinancialAmountInput,
  FormField,
  FormGroup,
} from "../../../components/molecules";
import { FinancialAccountSelect } from "../../financialAccounts/components/FinancialAccountSelect";
import { ReportingExchangeRateField } from "../../finance/ReportingExchangeRateField";
import type { FinancialUnitCode } from "../../finance/financialUnits";
import {
  lenderService,
  type TenantLender,
} from "../../lenders/services/lenderService";
import {
  slipService,
  type InterestType,
} from "../../slips/services/slipService";

export type BusinessLoanFormState = {
  amount: string;
  amount_unit: FinancialUnitCode;
  lender_code: string;
  receipt_account_id: string;
  description: string;
  tag: string;
  apply_interest: boolean;
  interest_rate: string;
  interest_type_id: string;
  reporting_exchange_rate: string;
  reporting_exchange_rate_inversed: boolean;
  update_key?: number;
};
export const emptyBusinessLoanForm: BusinessLoanFormState = {
  amount: "",
  amount_unit: "UNIT",
  lender_code: "",
  receipt_account_id: "",
  description: "",
  tag: "",
  apply_interest: false,
  interest_rate: "",
  interest_type_id: "",
  reporting_exchange_rate: "",
  reporting_exchange_rate_inversed: false,
};
export function businessLoanPayload(form: BusinessLoanFormState) {
  return {
    amount: Number(form.amount),
    amount_unit: form.amount_unit,
    lender_code: form.lender_code || null,
    receipt_account_id: form.receipt_account_id
      ? Number(form.receipt_account_id)
      : undefined,
    description: form.description.trim(),
    tag: form.tag.trim() || null,
    apply_interest: form.apply_interest,
    interest_rate: form.apply_interest ? Number(form.interest_rate) : undefined,
    interest_type_id: form.apply_interest
      ? Number(form.interest_type_id)
      : undefined,
    reporting_exchange_rate: form.reporting_exchange_rate
      ? Number(form.reporting_exchange_rate)
      : undefined,
    reporting_exchange_rate_inversed: form.reporting_exchange_rate_inversed,
    update_key: form.update_key,
  };
}

type Props = {
  value: BusinessLoanFormState;
  mode: "create" | "edit";
  saving: boolean;
  error?: ReactNode;
  onChange: <K extends keyof BusinessLoanFormState>(
    field: K,
    value: BusinessLoanFormState[K],
  ) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};
export function BusinessLoanForm({
  value,
  mode,
  saving,
  error,
  onChange,
  onCancel,
  onSubmit,
}: Props) {
  const [lenders, setLenders] = useState<TenantLender[]>([]);
  const [interestTypes, setInterestTypes] = useState<InterestType[]>([]);
  useEffect(() => {
    void lenderService
      .list({ perPage: 100 })
      .then((result) => setLenders(result.data))
      .catch(() => setLenders([]));
    if (mode === "create")
      void slipService
        .listInterestTypes()
        .then(setInterestTypes)
        .catch(() => setInterestTypes([]));
  }, [mode]);
  const renderFields = (idPrefix: string, mobile = false) => (
    <FormGroup columns={mobile ? 1 : 2}>
      <FormField
        id={`${idPrefix}-lender`}
        label="Lender"
        helperText="Leave empty to record Unknown Lender."
      >
        <Select
          id={`${idPrefix}-lender`}
          onChange={(event) => onChange("lender_code", event.target.value)}
          value={value.lender_code}
        >
          <option value="">Unknown Lender</option>
          {lenders.map((item) => (
            <option key={item.id} value={item.code}>
              {item.name} ({item.code})
            </option>
          ))}
        </Select>
      </FormField>
      <FormField id={`${idPrefix}-amount`} label="Loan Amount">
        <FinancialAmountInput
          disabled={mode === "edit" && value.apply_interest}
          id={`${idPrefix}-amount`}
          min="0.01"
          onChange={(next) => {
            onChange("amount", next.amount);
            onChange("amount_unit", next.unit);
          }}
          step="0.01"
          value={{ amount: value.amount, unit: value.amount_unit }}
        />
      </FormField>
      <FormField id={`${idPrefix}-account`} label="Receiving Account">
        <FinancialAccountSelect
          id={`${idPrefix}-account`}
          onChange={(id) => onChange("receipt_account_id", id)}
          portalMenu
          value={value.receipt_account_id}
        />
      </FormField>
      <ReportingExchangeRateField
        accountId={value.receipt_account_id}
        inversed={value.reporting_exchange_rate_inversed}
        manualRate={value.reporting_exchange_rate}
        onInversedChange={(next) =>
          onChange("reporting_exchange_rate_inversed", next)
        }
        onManualRateChange={(next) => onChange("reporting_exchange_rate", next)}
      />
      <FormField id={`${idPrefix}-description`} label="Description">
        <Textarea
          id={`${idPrefix}-description`}
          onChange={(event) => onChange("description", event.target.value)}
          value={value.description}
        />
      </FormField>
      <FormField id={`${idPrefix}-tag`} label="Tag">
        <Input
          id={`${idPrefix}-tag`}
          onChange={(event) => onChange("tag", event.target.value)}
          value={value.tag}
        />
      </FormField>
      {mode === "create" && (
        <>
          <FormField id={`${idPrefix}-interest-enabled`} label="Interest">
            <label className="business-loan-interest-toggle">
              <input
                checked={value.apply_interest}
                onChange={(event) =>
                  onChange("apply_interest", event.target.checked)
                }
                type="checkbox"
              />
              <span>Apply recurring interest</span>
            </label>
          </FormField>
          {value.apply_interest && (
            <>
              <FormField id={`${idPrefix}-interest-rate`} label="Interest Rate">
                <Input
                  id={`${idPrefix}-interest-rate`}
                  min="0.01"
                  onChange={(event) =>
                    onChange("interest_rate", event.target.value)
                  }
                  step="0.01"
                  type="number"
                  value={value.interest_rate}
                />
              </FormField>
              <FormField id={`${idPrefix}-interest-type`} label="Interest Type">
                <Select
                  id={`${idPrefix}-interest-type`}
                  onChange={(event) =>
                    onChange("interest_type_id", event.target.value)
                  }
                  value={value.interest_type_id}
                >
                  <option value="">Select interest type</option>
                  {interestTypes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </>
          )}
        </>
      )}
    </FormGroup>
  );
  return (
    <Card
      title={mode === "create" ? "Business Loan Details" : "Edit Business Loan"}
      description="Record the lender, receiving account, amount, and applicable interest terms."
    >
      {error}
      <form className="ui-form business-loan-form" onSubmit={onSubmit}>
        {renderFields("business-loan")}
        <ActionBar>
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={!value.description.trim() || Number(value.amount) <= 0}
            isLoading={saving}
            type="submit"
            variant="primary"
          >
            {mode === "create" ? "Create Business Loan" : "Save Changes"}
          </Button>
        </ActionBar>
      </form>
    </Card>
  );
}
