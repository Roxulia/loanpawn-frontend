import { apiClient } from '../../../services/http/apiClient'
import type { TenantUser } from '../../../dataobjects/tenant/auth'
import type { UiLocale } from '../../../locales/UiLocale'

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

  updateDefaultUserPassword(payload: { default_tenant_user_password: string; update_key?: number }) {
    return apiClient.put<TenantSettings>('/tenant/settings/default-user-password', payload)
  },

  getTimezone() { return apiClient.get<TimezoneSetting>('/tenant/settings/timezone') },
  listTimezoneOptions() { return apiClient.get<string[]>('/tenant/settings/timezone-options') },
  updateTimezone(payload: { timezone: string; update_key: number }) { return apiClient.put<TimezoneSetting>('/tenant/settings/timezone', payload) },

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
}
