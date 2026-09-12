import { apiClient } from "../../../services/http/apiClient";
import type { PaginatedResult } from "../../../dataobjects/common/api";

export type BusinessLoan = {
  id: number;
  code: string;
  update_key: number;
  lender_code?: string | null;
  lender_name: string;
  receipt_account_id: number;
  amount: string;
  principal_balance: string;
  apply_interest: boolean;
  interest_rate?: string | null;
  interest_type_id?: number | null;
  interest_type_name?: string | null;
  outstanding_interest: string;
  total_outstanding: string;
  description: string;
  tag?: string | null;
  is_paid: boolean;
  compound_schedule_enabled?: boolean;
  compound_every?: number | null;
  compound_every_type?: string | null;
  next_compound_at?: string | null;
  last_compounded_at?: string | null;
  created_at?: string | null;
};

export type BusinessLoanInterestRow = {
  id: number;
  principal_amount: number;
  interest_amount: number;
  paid_amount: number;
  compounded_amount: number;
  outstanding_amount: number;
  start_period_at: string;
  end_period_at: string;
  period_timezone?: string;
};

export type BusinessLoanCalculation = {
  loan_code: string;
  loan_update_key: number;
  account_id: number;
  principal_balance: string;
  outstanding_interest: string;
  total_outstanding: string;
  apply_interest: boolean;
  interest_rate?: string | null;
  interest_type_name?: string | null;
  allow_partial_payments: boolean;
  compounding_enabled: boolean;
  interest_breakdown: BusinessLoanInterestRow[];
  interest_rows?: PaginatedResult<BusinessLoanInterestRow>;
};

export type BusinessLoanPayment = {
  id: number;
  code: string;
  payment_amount: string;
  principal_paid: string;
  interest_paid: string;
  allocation_order: string;
  payment_at: string;
};
export type BusinessLoanListPage = {
  data: BusinessLoan[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export const businessLoanService = {
  list(params: { page?: number; perPage?: number; search?: string } = {}) {
    return apiClient.get<BusinessLoanListPage>("/tenant/business-loans", {
      params: {
        page: params.page,
        per_page: params.perPage,
        search: params.search,
      },
    });
  },
  create(payload: unknown, idempotencyKey: string) {
    return apiClient.post<BusinessLoan>("/tenant/business-loans", payload, {
      idempotencyKey,
    });
  },
  get(code: string) {
    return apiClient.get<BusinessLoan>(
      `/tenant/business-loans/${encodeURIComponent(code)}`,
    );
  },
  update(code: string, payload: unknown) {
    return apiClient.put<BusinessLoan>(
      `/tenant/business-loans/${encodeURIComponent(code)}`,
      payload,
    );
  },
  delete(code: string) {
    return apiClient.deleteMessage(
      `/tenant/business-loans/${encodeURIComponent(code)}`,
    );
  },
  calculation(code: string) {
    return apiClient.get<BusinessLoanCalculation>(
      `/tenant/business-loans/${encodeURIComponent(code)}/interest`,
    );
  },
  calculationPage(code: string, params: { page?: number; perPage?: number } = {}) {
    return apiClient.get<BusinessLoanCalculation>(
      `/tenant/business-loans/${encodeURIComponent(code)}/interest`,
      { params: { page: params.page, per_page: params.perPage } },
    );
  },
  payments(code: string) {
    return apiClient.get<PaginatedResult<BusinessLoanPayment>>(
      `/tenant/business-loans/${encodeURIComponent(code)}/payments`,
    ).then((page) => page.items);
  },
  paymentPage(code: string, params: { page?: number; perPage?: number } = {}) {
    return apiClient.get<PaginatedResult<BusinessLoanPayment>>(
      `/tenant/business-loans/${encodeURIComponent(code)}/payments`,
      { params: { page: params.page, per_page: params.perPage } },
    );
  },
  pay(code: string, payload: unknown, idempotencyKey: string) {
    return apiClient.post(
      `/tenant/business-loans/${encodeURIComponent(code)}/payments`,
      payload,
      { idempotencyKey },
    );
  },
  updateCompoundSchedule(code: string, payload: unknown) {
    return apiClient.put<BusinessLoan>(
      `/tenant/business-loans/${encodeURIComponent(code)}/compound-schedule`,
      payload,
    );
  },
  compound(code: string) {
    return apiClient.post<{ compounded_interest: number }>(
      `/tenant/business-loans/${encodeURIComponent(code)}/compound-interest`,
      {},
    );
  },
};
