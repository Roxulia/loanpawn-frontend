import type { PaginatedResult } from '../../dataobjects/common/api'
import type { LoanContractSlip, LoanContractSlipPayload } from '../../dataobjects/pawn/slip'
import { apiClient } from '../http/apiClient'

type TenantAuth = {
  token?: string
  tenantCode?: string
}

type MessageResponse = {
  message: string
}

function authOptions(auth: TenantAuth = {}) {
  return {
    tenantCode: auth.tenantCode,
    token: auth.token,
  }
}

export const pawnService = {
  listLoanContractSlips(auth?: TenantAuth) {
    return apiClient.get<PaginatedResult<LoanContractSlip>>('/tenant/loan-contract-slips', authOptions(auth))
  },

  createLoanContractSlip(payload: LoanContractSlipPayload, auth?: TenantAuth) {
    return apiClient.post<LoanContractSlip>('/tenant/loan-contract-slips', payload, authOptions(auth))
  },

  getLoanContractSlip(slipNo: string, auth?: TenantAuth) {
    return apiClient.get<LoanContractSlip>(`/tenant/loan-contract-slips/${slipNo}`, authOptions(auth))
  },

  deleteLoanContractSlip(slipNo: string, auth?: TenantAuth) {
    return apiClient.delete<MessageResponse>(`/tenant/loan-contract-slips/${encodeURIComponent(slipNo)}`, authOptions(auth))
  },

  calculateInterest(slipNo: string, auth?: TenantAuth) {
    return apiClient.get<unknown>(`/tenant/interest-payments/${slipNo}/calculate`, authOptions(auth))
  },

  payInterest(slipNo: string, payload: { payment_amount: number; record_debt?: boolean }, auth?: TenantAuth) {
    return apiClient.post<unknown>(`/tenant/interest-payments/${slipNo}/pay`, payload, authOptions(auth))
  },

  listRedemptions(auth?: TenantAuth) {
    return apiClient.get<PaginatedResult<unknown>>('/tenant/redemptions', authOptions(auth))
  },

  calculateRedemption(slipNo: string, auth?: TenantAuth) {
    return apiClient.get<unknown>(`/tenant/redemptions/${slipNo}/calculate`, authOptions(auth))
  },

  createRedemption(payload: unknown, auth?: TenantAuth) {
    return apiClient.post<unknown>('/tenant/redemptions', payload, authOptions(auth))
  },

  getRedemptionRecord(slipNumber: string, auth?: TenantAuth) {
    return apiClient.get<unknown>(`/tenant/redemption-records/${encodeURIComponent(slipNumber)}`, authOptions(auth))
  },

  getSlipDocumentConfig(auth?: TenantAuth) {
    return apiClient.get<unknown>('/tenant/slip-documents/config', authOptions(auth))
  },

  previewSlipDocument(slipNo: string, auth?: TenantAuth) {
    return apiClient.get<unknown>(`/tenant/loan-contract-slips/${slipNo}/document/preview`, authOptions(auth))
  },

  downloadSlipDocument(slipNo: string, auth?: TenantAuth) {
    return apiClient.get<unknown>(`/tenant/loan-contract-slips/${slipNo}/document/download`, authOptions(auth))
  },
}
