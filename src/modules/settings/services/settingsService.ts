import { apiClient } from '../../../services/http/apiClient'
import type { TenantUser } from '../../../dataobjects/tenant/auth'
import type { UiLocale } from '../../../locales/UiLocale'
import type { Currency, CurrencyPage } from '../../currency/types'
import type { AccountingDaySchedule } from '../../../dataobjects/tenant/finance'
import type { FinancialUnitCode } from '../../finance/financialUnits'

export type DefaultTypeOption = {
  id: number
  tenant_id?: number | null
  tenantId?: number | null
  name: string
  code?: string
  duration_in_days?: number
  durationInDays?: number
  is_default?: boolean
  isDefault?: boolean
  is_active?: boolean
  isActive?: boolean
  update_key?: number
  updateKey?: number
  source?: 'PLATFORM' | 'TENANT'
  can_update?: boolean
  canUpdate?: boolean
  can_delete?: boolean
  canDelete?: boolean
}

export type DefaultTypeListPage = {
  items: DefaultTypeOption[]
  current_page?: number
  currentPage?: number
  last_page?: number
  lastPage?: number
  per_page?: number
  perPage?: number
  total: number
}

export type BrandingSettings = {
  id?: number
  tenant_id?: number
  update_key?: number
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
  slip_header_text?: string | null
  slip_footer_text?: string | null
  slip_header_layout?: SlipDocumentLayout | null
  slip_footer_layout?: SlipDocumentLayout | null
}

export type SlipDocumentLayout = {
  version?: number
  components?: unknown[]
}

export type SlipLayoutSettings = {
  id?: number
  tenant_id?: number
  update_key?: number
  slip_header_layout?: SlipDocumentLayout | null
  slip_footer_layout?: SlipDocumentLayout | null
}

export type ContactSettings = {
  id?: number
  tenant_id?: number
  update_key?: number
  address?: string | null
  phone?: string | null
  city?: string | null
  country?: string | null
}

export type TenantSettings = {
  id?: number
  tenant_id?: number
  key?: string | null
  value?: string | null
  update_key?: number
  default_tenant_user_password?: string | null
}

export type TimezoneSetting = { id: number; key: string; value: string; update_key: number }

export type CurrencyPreferences = {
  id: number
  tenant_id: number
  default_currency_id: number
  reporting_currency_id: number
  update_key: number
  default_currency: Currency
  reporting_currency: Currency
  effective_reporting_currency_id: number
  effective_reporting_currency: Currency
  reporting_currency_recalculation: {
    id: number
    status: 'queued' | 'processing' | 'waiting_for_rates' | 'failed'
    window_start: string
    window_end: string
    missing_rates: Array<{
      date: string
      from_currency_id: number
      to_currency_id: number
    }>
  } | null
  default_financial_unit: FinancialUnitCode | null
}

export type InterestProcessSettings = {
  id: number
  tenant_id: number
  update_key: number
  compounding_enabled: boolean
  partial_principal_collection_enabled: boolean
}

export type LoanSlipCreationSettings = {
  id: number
  tenant_id: number
  update_key: number
  customer_info_required: boolean
}

export type SettingsPayload = {
  branding?: BrandingSettings
  contact?: ContactSettings
  tenant_setting?: TenantSettings
}

export type SettingsResponse = {
  branding: BrandingSettings
  contact: ContactSettings
  tenant_setting: TenantSettings
}

export type TenantSettingsBootstrap = Partial<SettingsResponse> & {
  loan_slip_creation_settings?: LoanSlipCreationSettings
  timezone?: TimezoneSetting
  timezone_options?: string[]
}

export type FinanceSettingsBootstrap = {
  currency_preferences?: CurrencyPreferences
  currency_options?: Currency[]
  accounting_schedule?: AccountingDaySchedule
  financial_account_types?: DefaultTypeListPage
  interest_process_settings?: InterestProcessSettings
}

export type DefaultDataSettingsBootstrap = {
  interest_types?: DefaultTypeListPage
  expense_types?: DefaultTypeListPage
  material_types?: DefaultTypeListPage
  item_category_types?: DefaultTypeListPage
}

export type ChangeLanguagePayload = {
  updateKey: number
  preferLang: UiLocale
}

export type ChangeLanguageResponse = Partial<TenantUser> & {
  user?: TenantUser
  message?: string
}

function defaultTypeListPath(path: string, params: { page?: number; perPage?: number } = {}) {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page))
  }

  if (params.perPage !== undefined) {
    searchParams.set('per_page', String(params.perPage))
  }

  const query = searchParams.toString()

  return `${path}${query ? `?${query}` : ''}`
}

export const settingsService = {
  getTenantBootstrap() {
    return apiClient.get<TenantSettingsBootstrap>('/tenant/settings/tenant')
  },

  getFinanceBootstrap() {
    return apiClient.get<FinanceSettingsBootstrap>('/tenant/settings/finance')
  },

  getDefaultDataBootstrap() {
    return apiClient.get<DefaultDataSettingsBootstrap>('/tenant/settings/default-data')
  },
  getSettings() {
    return apiClient.get<SettingsResponse>('/tenant/settings')
  },

  updateSettings(payload: SettingsPayload) {
    return apiClient.put<SettingsResponse>('/tenant/settings', payload)
  },

  updateBranding(payload: BrandingSettings) {
    return apiClient.put<BrandingSettings>('/tenant/settings/branding', payload)
  },

  updateContact(payload: ContactSettings) {
    return apiClient.put<ContactSettings>('/tenant/settings/contact', payload)
  },

  getContact() {
    return apiClient.get<ContactSettings>('/tenant/settings/contact')
  },

  updateDefaultUserPassword(payload: { default_tenant_user_password: string; update_key?: number }) {
    return apiClient.put<TenantSettings>('/tenant/settings/default-user-password', payload)
  },

  getTimezone() { return apiClient.get<TimezoneSetting>('/tenant/settings/timezone') },
  listTimezoneOptions() { return apiClient.get<string[]>('/tenant/settings/timezone-options') },
  updateTimezone(payload: { timezone: string; update_key: number }) { return apiClient.put<TimezoneSetting>('/tenant/settings/timezone', payload) },
  getCurrencyPreferences() { return apiClient.get<CurrencyPreferences>('/tenant/settings/currencies') },
  updateCurrencyPreferences(payload: { default_currency_id: number; reporting_currency_id: number; default_financial_unit: FinancialUnitCode | null; update_key: number }) { return apiClient.put<CurrencyPreferences>('/tenant/settings/currencies', payload) },
  getInterestProcessSettings() { return apiClient.get<InterestProcessSettings>('/tenant/settings/interest-process') },
  updateInterestProcessSettings(payload: { compounding_enabled: boolean; partial_principal_collection_enabled: boolean; update_key: number }) { return apiClient.put<InterestProcessSettings>('/tenant/settings/interest-process', payload) },
  getLoanSlipCreationSettings() { return apiClient.get<LoanSlipCreationSettings>('/tenant/settings/loan-slip-creation') },
  updateLoanSlipCreationSettings(payload: { customer_info_required: boolean; update_key: number }) { return apiClient.put<LoanSlipCreationSettings>('/tenant/settings/loan-slip-creation', payload) },
  abortReportingCurrencyChange(payload: { recalculation_id: number; update_key: number }) { return apiClient.post<CurrencyPreferences>('/tenant/settings/reporting-currency-recalculation/abort', payload) },
  getAccountingDaySchedule() { return apiClient.get<AccountingDaySchedule>('/tenant/accounting-days/schedule') },
  updateAccountingDaySchedule(days: AccountingDaySchedule['days']) { return apiClient.put<AccountingDaySchedule>('/tenant/accounting-days/schedule', { days }) },
  listCurrencyOptions() { return apiClient.get<CurrencyPage>('/tenant/currencies', { params: { per_page: 100 } }) },

  changeLanguage(payload: ChangeLanguagePayload) {
    //console.log('Changing language with payload:', payload);
    return apiClient.put<ChangeLanguageResponse>('tenant/me/change-language', payload)
  },

  getSlipLayouts() {
    return apiClient.get<SlipLayoutSettings>('/tenant/branding/slip-layouts')
  },

  updateSlipLayouts(payload: { slip_header_layout?: SlipDocumentLayout; slip_footer_layout?: SlipDocumentLayout; update_key?: number }) {
    return apiClient.put<SlipLayoutSettings>('/tenant/branding/slip-layouts', payload)
  },

  previewDummySlipDocument(slipNo: string, paperType = 'A4') {
    return apiClient.get<string>(`/tenant/loan-contract-slips/${encodeURIComponent(slipNo)}/document/preview`, {
      params: {
        orientation: 'portrait',
        paper_type: paperType,
      },
      responseType: 'text',
    })
  },

  listInterestTypes(params: { page?: number; perPage?: number } = {}) {
    return apiClient.get<DefaultTypeListPage>(defaultTypeListPath('/tenant/interest-types/paginated', params))
  },

  listExpenseTypes(params: { page?: number; perPage?: number } = {}) {
    return apiClient.get<DefaultTypeListPage>(defaultTypeListPath('/tenant/expense-types/paginated', params))
  },

  listMaterialTypes(params: { page?: number; perPage?: number } = {}) {
    return apiClient.get<DefaultTypeListPage>(defaultTypeListPath('/tenant/material-types/paginated', params))
  },

  listItemCategoryTypes(params: { page?: number; perPage?: number } = {}) {
    return apiClient.get<DefaultTypeListPage>(defaultTypeListPath('/tenant/item-category-types/paginated', params))
  },

  listFinancialAccountTypes(params: { page?: number; perPage?: number } = {}) {
    return apiClient.get<DefaultTypeListPage>(defaultTypeListPath('/tenant/financial-account-types', params))
  },

  listMaterialTypeOptions() {
    return apiClient.get<DefaultTypeOption[]>('/tenant/material-types')
  },

  listInterestTypeOptions() {
    return apiClient.get<DefaultTypeOption[]>('/tenant/interest-types')
  },

  listExpenseTypeOptions() {
    return apiClient.get<DefaultTypeOption[]>('/tenant/expense-types')
  },

  listItemCategoryTypeOptions() {
    return apiClient.get<DefaultTypeOption[]>('/tenant/item-category-types')
  },

  createInterestType(payload: { name: string; code: string; durationInDays?: number }) {
    return apiClient.post<DefaultTypeOption>('/tenant/interest-types', payload)
  },

  createExpenseType(payload: { name: string; code: string }) {
    return apiClient.post<DefaultTypeOption>('/tenant/expense-types', payload)
  },

  createMaterialType(payload: { name: string; code: string }) {
    return apiClient.post<DefaultTypeOption>('/tenant/material-types', payload)
  },

  createItemCategoryType(payload: { name: string; code: string }) {
    return apiClient.post<DefaultTypeOption>('/tenant/item-category-types', payload)
  },

  createFinancialAccountType(payload: { name: string; code: string }) {
    return apiClient.post<DefaultTypeOption>('/tenant/financial-account-types', payload)
  },

  updateFinancialAccountType(currentCode: string, payload: { name: string; code: string; update_key: number }) {
    return apiClient.put<DefaultTypeOption>(`/tenant/financial-account-types/${encodeURIComponent(currentCode)}`, payload)
  },

  deleteInterestType(code: string) {
    return apiClient.delete<{ message: string }>(`/tenant/interest-types/${encodeURIComponent(code)}`)
  },

  deleteExpenseType(code: string) {
    return apiClient.delete<{ message: string }>(`/tenant/expense-types/${encodeURIComponent(code)}`)
  },

  deleteMaterialType(code: string) {
    return apiClient.delete<{ message: string }>(`/tenant/material-types/${encodeURIComponent(code)}`)
  },

  deleteItemCategoryType(code: string) {
    return apiClient.delete<{ message: string }>(`/tenant/item-category-types/${encodeURIComponent(code)}`)
  },

  deleteFinancialAccountType(code: string) {
    return apiClient.delete<{ message: string }>(`/tenant/financial-account-types/${encodeURIComponent(code)}`)
  },
}
