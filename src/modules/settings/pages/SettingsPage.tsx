import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button, Input, Select, Textarea } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ActionBar, Card, FormField, FormGroup, SearchableSelect, SectionHeader } from '../../../components/molecules'
import { ConfirmDialog, DataTable, type DataTableColumn } from '../../../components/organisms'
import type { TenantUser } from '../../../dataobjects/tenant/auth'
import { useTenantSession } from '../../../contexts/useTenantSession'
import { usePermissions } from '../../auth'
import type { UiLocale } from '../../../locales/UiLocale'
import type { Currency } from '../../currency/types'
import type { AccountingDayScheduleDay } from '../../../dataobjects/tenant/finance'
import { useNotifications } from '../../notifications/useNotifications'
import type { TenantNotification } from '../../notifications/types'
import { settingsService, type BrandingSettings, type ChangeLanguageResponse, type ContactSettings, type CurrencyPreferences, type DefaultTypeListPage, type DefaultTypeOption, type TenantSettings } from '../services/settingsService'
import { DashboardFinancialUnitSetting } from '../components/DashboardFinancialUnitSetting'

type TypeForm = {
  name: string
  code: string
  duration_in_days: string
  update_key: number
}

type TypeKind = 'interest' | 'expense' | 'material' | 'itemCategory' | 'financialAccount'

type TypeToDelete = {
  code: string
  kind: TypeKind
  name: string
}

type TypePageState = {
  currentPage: number
  lastPage: number
  total: number
}

type BrandingForm = {
  primary_color: string
  secondary_color: string
  accent_color: string
  update_key: number
}

type ContactForm = {
  address: string
  phone: string
  city: string
  country: string
  update_key: number
}

type TenantForm = {
  default_tenant_user_password: string
  update_key: number
}

const emptyBranding: BrandingForm = {
  primary_color: '',
  secondary_color: '',
  accent_color: '',
  update_key: 0,
}

const emptyContact: ContactForm = {
  address: '',
  phone: '',
  city: '',
  country: '',
  update_key: 0,
}

const emptyTenant: TenantForm = {
  default_tenant_user_password: '',
  update_key: 0,
}

const emptyCurrencyPreferences: Pick<CurrencyPreferences, 'default_currency_id' | 'reporting_currency_id' | 'default_financial_unit' | 'update_key'> = {
  default_currency_id: 0,
  reporting_currency_id: 0,
  default_financial_unit: null,
  update_key: 0,
}

const emptyTypeForm: TypeForm = {
  name: '',
  code: '',
  duration_in_days: '30',
  update_key: 0,
}

const typeDataPerPage = 5
const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const emptyAccountingSchedule = weekdayNames.map((_, weekday): AccountingDayScheduleDay => ({
  weekday,
  is_enabled: false,
  open_time: '09:00',
  close_time: '17:00',
  update_key: 0,
}))

const brandColorOptions = [
  '#03003D',
  '#F5A700',
  '#2563EB',
  '#16A34A',
  '#DC2626',
  '#0F172A',
  '#4B5563',
  '#FFFFFF',
]

export function SettingsPage() {
  const navigate = useNavigate()
  const [brandingInitial, setBrandingInitial] = useState(emptyBranding)
  const [branding, setBranding] = useState(emptyBranding)
  const [contactInitial, setContactInitial] = useState(emptyContact)
  const [contact, setContact] = useState(emptyContact)
  const [tenantInitial, setTenantInitial] = useState(emptyTenant)
  const [tenant, setTenant] = useState(emptyTenant)
  const [currencyOptions, setCurrencyOptions] = useState<Currency[]>([])
  const [currencyPreferencesInitial, setCurrencyPreferencesInitial] = useState(emptyCurrencyPreferences)
  const [currencyPreferences, setCurrencyPreferences] = useState(emptyCurrencyPreferences)
  const [currencyRecalculation, setCurrencyRecalculation] = useState<CurrencyPreferences['reporting_currency_recalculation']>(null)
  const [interestTypes, setInterestTypes] = useState<DefaultTypeOption[]>([])
  const [expenseTypes, setExpenseTypes] = useState<DefaultTypeOption[]>([])
  const [materialTypes, setMaterialTypes] = useState<DefaultTypeOption[]>([])
  const [itemCategoryTypes, setItemCategoryTypes] = useState<DefaultTypeOption[]>([])
  const [financialAccountTypes, setFinancialAccountTypes] = useState<DefaultTypeOption[]>([])
  const [interestForm, setInterestForm] = useState(emptyTypeForm)
  const [expenseForm, setExpenseForm] = useState(emptyTypeForm)
  const [materialForm, setMaterialForm] = useState(emptyTypeForm)
  const [itemCategoryForm, setItemCategoryForm] = useState(emptyTypeForm)
  const [financialAccountForm, setFinancialAccountForm] = useState(emptyTypeForm)
  const [editingFinancialAccountCode, setEditingFinancialAccountCode] = useState<string | null>(null)
  const [interestPage, setInterestPage] = useState<TypePageState>({ currentPage: 1, lastPage: 1, total: 0 })
  const [expensePage, setExpensePage] = useState<TypePageState>({ currentPage: 1, lastPage: 1, total: 0 })
  const [materialPage, setMaterialPage] = useState<TypePageState>({ currentPage: 1, lastPage: 1, total: 0 })
  const [itemCategoryPage, setItemCategoryPage] = useState<TypePageState>({ currentPage: 1, lastPage: 1, total: 0 })
  const [financialAccountPage, setFinancialAccountPage] = useState<TypePageState>({ currentPage: 1, lastPage: 1, total: 0 })
  const [selectedLanguage, setSelectedLanguage] = useState<UiLocale>('en')
  const [isLoading, setIsLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [deletingType, setDeletingType] = useState<TypeToDelete | null>(null)
  const [isAbortCurrencyDialogOpen, setIsAbortCurrencyDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { currentUser, session, setCurrentUser, setLocale, setSession, setTenantResolution, tenantResolution } = useTenantSession()
  const { notifications } = useNotifications()
  const { hasPermission } = usePermissions()
  const canManageMasterData = hasEnabledFeature(tenantResolution, 'master_data_management')
  const canViewGeneralSettings = hasPermission('manage_slip_document')
  const canViewMaterialTypes = hasPermission('list_material_type')
  const canViewInterestTypes = hasPermission('list_interest_type')
  const canViewItemCategoryTypes = hasPermission('list_item_category_type')
  const canViewExpenseTypes = hasPermission('list_expense_type')
  const canCreateMaterialType = canManageMasterData && hasPermission('create_material_type')
  const canDeleteMaterialType = canManageMasterData && hasPermission('delete_material_type')
  const canCreateInterestType = canManageMasterData && hasPermission('create_interest_type')
  const canDeleteInterestType = canManageMasterData && hasPermission('delete_interest_type')
  const canCreateItemCategoryType = canManageMasterData && hasPermission('create_item_category_type')
  const canDeleteItemCategoryType = canManageMasterData && hasPermission('delete_item_category_type')
  const canCreateExpenseType = canManageMasterData && hasPermission('create_expense_type')
  const canDeleteExpenseType = canManageMasterData && hasPermission('delete_expense_type')
  const canViewFinancialAccountTypes = hasEnabledFeature(tenantResolution, 'accounting_management') && hasPermission('list_financial_account_type')
  const canManageFinancialAccountTypes = hasAnyEnabledFeature(tenantResolution, ['accounting_type_management', 'master_data_management'])
  const canCreateFinancialAccountType = canManageFinancialAccountTypes && hasPermission('create_financial_account_type')
  const canUpdateFinancialAccountType = canManageFinancialAccountTypes && hasPermission('update_financial_account_type')
  const canDeleteFinancialAccountType = canManageFinancialAccountTypes && hasPermission('delete_financial_account_type')
  const canManageTenantBranding = hasEnabledFeature(tenantResolution, 'tenant_branding')
  const canManageTimezone = hasEnabledFeature(tenantResolution, 'tenant_timezone_management') && hasPermission('manage_tenant_timezone')
  const canViewCurrencyPreferences = hasEnabledFeature(tenantResolution, 'currency_management') && hasPermission('list_currency')
  const canUpdateCurrencyPreferences = canViewCurrencyPreferences && hasPermission('update_currency')
  const canProvideHistoricalRates = canUpdateCurrencyPreferences && hasPermission('list_exchange_rate') && hasPermission('create_exchange_rate')
  const canManageAccountingSchedule = hasEnabledFeature(tenantResolution, 'automatic_open_close')
    && hasPermission('open_accounting_day')
    && hasPermission('close_accounting_day')
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>([])
  const [timezone, setTimezone] = useState('Asia/Yangon')
  const [timezoneInitial, setTimezoneInitial] = useState('Asia/Yangon')
  const [timezoneUpdateKey, setTimezoneUpdateKey] = useState(0)
  const [accountingScheduleTimezone, setAccountingScheduleTimezone] = useState('Asia/Yangon')
  const [accountingScheduleInitial, setAccountingScheduleInitial] = useState(emptyAccountingSchedule)
  const [accountingSchedule, setAccountingSchedule] = useState(emptyAccountingSchedule)
  const [accountingScheduleErrors, setAccountingScheduleErrors] = useState<Record<number, string>>({})
  const currentLanguage = getUserLocale(currentUser)

  const brandingChanged = useMemo(() => hasChanged(branding, brandingInitial), [branding, brandingInitial])
  const contactChanged = useMemo(() => hasChanged(contact, contactInitial), [contact, contactInitial])
  const tenantChanged = useMemo(() => hasChanged(tenant, tenantInitial), [tenant, tenantInitial])
  const currencyPreferencesChanged = useMemo(() => hasChanged(currencyPreferences, currencyPreferencesInitial), [currencyPreferences, currencyPreferencesInitial])
  const userLanguageChanged = selectedLanguage !== currentLanguage
  const accountingScheduleChanged = useMemo(() => hasChanged(accountingSchedule, accountingScheduleInitial), [accountingSchedule, accountingScheduleInitial])
  const currencyRecalculationNotification = useMemo(() => {
    if (!currencyRecalculation) return null

    return notifications.find((notification) => (
      notification.type === 'reporting_currency_recalculation'
      && notification.recalculation_id === currencyRecalculation.id
    )) ?? null
  }, [currencyRecalculation, notifications])
  const currencyRecalculationNotice = reportingCurrencyNotice(
    currencyRecalculation,
    currencyRecalculationNotification,
  )

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [settingsResponse, interestResponse, expenseResponse, materialResponse, itemCategoryResponse, financialResponse] = await Promise.all([
        canViewGeneralSettings
          ? settingsService.getSettings()
          : Promise.resolve(null),
        canViewInterestTypes
          ? settingsService.listInterestTypes({ page: 1, perPage: typeDataPerPage })
          : Promise.resolve(null),
        canViewExpenseTypes
          ? settingsService.listExpenseTypes({ page: 1, perPage: typeDataPerPage })
          : Promise.resolve(null),
        canViewMaterialTypes
          ? settingsService.listMaterialTypes({ page: 1, perPage: typeDataPerPage })
          : Promise.resolve(null),
        canViewItemCategoryTypes
          ? settingsService.listItemCategoryTypes({ page: 1, perPage: typeDataPerPage })
          : Promise.resolve(null),
        canViewFinancialAccountTypes
          ? settingsService.listFinancialAccountTypes({ page: 1, perPage: typeDataPerPage })
          : Promise.resolve(null),
      ])

      if (settingsResponse) {
        const nextBranding = normalizeBranding(settingsResponse.branding)
        const nextContact = normalizeContact(settingsResponse.contact)
        const nextTenant = normalizeTenant(settingsResponse.tenant_setting)

        setBrandingInitial(nextBranding)
        setBranding(nextBranding)
        setContactInitial(nextContact)
        setContact(nextContact)
        setTenantInitial(nextTenant)
        setTenant(nextTenant)
      }

      if (interestResponse) setTypePageData('interest', interestResponse, 1)
      if (expenseResponse) setTypePageData('expense', expenseResponse, 1)
      if (materialResponse) setTypePageData('material', materialResponse, 1)
      if (itemCategoryResponse) setTypePageData('itemCategory', itemCategoryResponse, 1)
      if (financialResponse) {
        setTypePageData('financialAccount', financialResponse, 1)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load settings.')
    } finally {
      setIsLoading(false)
    }
  }, [canViewExpenseTypes, canViewFinancialAccountTypes, canViewGeneralSettings, canViewInterestTypes, canViewItemCategoryTypes, canViewMaterialTypes])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadSettings()
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadSettings])

  useEffect(() => {
    if (!canManageTimezone) return
    Promise.all([settingsService.getTimezone(), settingsService.listTimezoneOptions()]).then(([setting, options]) => {
      setTimezone(setting.value || 'Asia/Yangon')
      setTimezoneInitial(setting.value || 'Asia/Yangon')
      setTimezoneUpdateKey(setting.update_key ?? 0)
      setTimezoneOptions(options)
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load timezone settings.'))
  }, [canManageTimezone])

  useEffect(() => {
    if (!canViewCurrencyPreferences) return

    Promise.all([settingsService.getCurrencyPreferences(), settingsService.listCurrencyOptions()]).then(([preferences, currencyPage]) => {
      const nextPreferences = normalizeCurrencyPreferences(preferences)
      setCurrencyPreferencesInitial(nextPreferences)
      setCurrencyPreferences(nextPreferences)
      setCurrencyRecalculation(preferences.reporting_currency_recalculation)
      setCurrencyOptions(currencyPage.items.filter((currency) => currency.is_active))
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load currency settings.'))
  }, [canViewCurrencyPreferences])

  useEffect(() => {
    if (!canManageAccountingSchedule) return

    settingsService.getAccountingDaySchedule().then((response) => {
      const days = normalizeAccountingSchedule(response.days)
      setAccountingScheduleTimezone(response.timezone)
      setAccountingScheduleInitial(days)
      setAccountingSchedule(days)
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load accounting schedule.'))
  }, [canManageAccountingSchedule])

  async function saveTimezone() {
    await saveSection('timezone', async () => {
      const response = await settingsService.updateTimezone({ timezone, update_key: timezoneUpdateKey })
      setTimezone(response.value)
      setTimezoneInitial(response.value)
      setTimezoneUpdateKey(response.update_key)
    }, 'Business timezone saved successfully.')
  }

  async function saveCurrencyPreferences() {
    await saveSection('currency-preferences', async () => {
      const response = await settingsService.updateCurrencyPreferences({
        default_currency_id: currencyPreferences.default_currency_id,
        reporting_currency_id: currencyPreferences.reporting_currency_id,
        default_financial_unit: currencyPreferences.default_financial_unit,
        update_key: currencyPreferences.update_key,
      })
      const nextPreferences = normalizeCurrencyPreferences(response)
      setCurrencyPreferencesInitial(nextPreferences)
      setCurrencyPreferences(nextPreferences)
      setCurrencyRecalculation(response.reporting_currency_recalculation)
      if (tenantResolution.status === 'resolved') {
        setTenantResolution({
          ...tenantResolution,
          tenant: {
            ...tenantResolution.tenant,
            tenant_setting: {
              ...tenantResolution.tenant.tenant_setting,
              default_financial_unit: response.default_financial_unit,
            },
          },
        })
      }
    }, 'Currency settings saved successfully.')
  }

  async function abortReportingCurrencyChange() {
    if (!currencyRecalculation) return
    await saveSection('abort-reporting-currency', async () => {
      const response = await settingsService.abortReportingCurrencyChange({
        recalculation_id: currencyRecalculation.id,
        update_key: currencyPreferences.update_key,
      })
      const nextPreferences = normalizeCurrencyPreferences(response)
      setCurrencyPreferencesInitial(nextPreferences)
      setCurrencyPreferences(nextPreferences)
      setCurrencyRecalculation(null)
      setIsAbortCurrencyDialogOpen(false)
      if (tenantResolution.status === 'resolved') {
        setTenantResolution({
          ...tenantResolution,
          tenant: {
            ...tenantResolution.tenant,
            tenant_setting: {
              ...tenantResolution.tenant.tenant_setting,
              reporting_currency_id: response.reporting_currency_id,
              effective_reporting_currency_id: response.effective_reporting_currency_id,
              reporting_currency_symbol: response.reporting_currency.symbol ?? '',
              effective_reporting_currency_symbol: response.effective_reporting_currency.symbol ?? '',
              reporting_currency_recalculation: null,
            },
          },
        })
      }
    }, 'Reporting currency change aborted successfully.')
  }

  async function saveAccountingSchedule() {
    const errors = Object.fromEntries(accountingSchedule
      .filter((day) => day.is_enabled && day.close_time <= day.open_time)
      .map((day) => [day.weekday, 'Close time must be after open time.']))

    setAccountingScheduleErrors(errors)
    if (Object.keys(errors).length > 0) return

    await saveSection('accounting-schedule', async () => {
      const response = await settingsService.updateAccountingDaySchedule(accountingSchedule)
      const days = normalizeAccountingSchedule(response.days)
      setAccountingScheduleTimezone(response.timezone)
      setAccountingScheduleInitial(days)
      setAccountingSchedule(days)
      setAccountingScheduleErrors({})
    }, 'Accounting day schedule saved successfully.')
  }

  function updateAccountingScheduleDay(weekday: number, changes: Partial<AccountingDayScheduleDay>) {
    setAccountingSchedule((current) => current.map((day) => day.weekday === weekday ? { ...day, ...changes } : day))
    setAccountingScheduleErrors((current) => {
      const next = { ...current }
      delete next[weekday]
      return next
    })
  }

  useEffect(() => {
    setSelectedLanguage(currentLanguage)
  }, [currentLanguage])

  async function saveBranding() {
    await saveSection('branding', async () => {
      const response = await settingsService.updateBranding(branding)
      const nextBranding = normalizeBranding(response)
      setBrandingInitial(nextBranding)
      setBranding(nextBranding)
    })
  }

  async function saveContact() {
    await saveSection('contact', async () => {
      const response = await settingsService.updateContact(contact)
      const nextContact = normalizeContact(response)
      setContactInitial(nextContact)
      setContact(nextContact)
    })
  }

  async function saveTenant() {
    await saveSection('tenant', async () => {
      const response = await settingsService.updateDefaultUserPassword(tenant)
      const nextTenant = normalizeTenant(response)
      setTenantInitial(nextTenant)
      setTenant(nextTenant)
    })
  }

  async function saveUserLanguage() {
    const updateKey = getUserUpdateKey(currentUser)

    if (!currentUser || updateKey === null) {
      setNotice(null)
      setError('Unable to save language because current user update key is missing.')
      return
    }

    await saveSection('user-language', async () => {
      const response = await settingsService.changeLanguage({
        updateKey,
        preferLang: selectedLanguage,
      })
      const updatedUser = mergeLanguageResponse(currentUser, response, selectedLanguage)

      setCurrentUser(updatedUser)
      if (session) {
        setSession({ ...session, user: updatedUser })
      }
      setLocale(selectedLanguage)
    }, 'User language saved successfully.')
  }

  async function saveTypeData(kind: TypeKind) {
    const form = getTypeForm(kind)

    if (!form.name.trim() || !form.code.trim()) {
      setError('Type name and code are required.')
      return
    }

    await saveSection(`${kind}-types`, async () => {
      if (kind === 'interest') {
        await settingsService.createInterestType(toTypePayload(form, true))
        setInterestForm(emptyTypeForm)
      } else if (kind === 'expense') {
        await settingsService.createExpenseType(toTypePayload(form, false))
        setExpenseForm(emptyTypeForm)
      } else if (kind === 'material') {
        await settingsService.createMaterialType(toTypePayload(form, false))
        setMaterialForm(emptyTypeForm)
      } else if (kind === 'itemCategory') {
        await settingsService.createItemCategoryType(toTypePayload(form, false))
        setItemCategoryForm(emptyTypeForm)
      } else if (editingFinancialAccountCode) {
        await settingsService.updateFinancialAccountType(editingFinancialAccountCode, {
          name: form.name.trim(),
          code: form.code.trim(),
          update_key: form.update_key,
        })
        setFinancialAccountForm(emptyTypeForm)
        setEditingFinancialAccountCode(null)
      } else {
        await settingsService.createFinancialAccountType(toTypePayload(form, false))
        setFinancialAccountForm(emptyTypeForm)
      }

      await reloadTypeData(kind, 1)
    }, `${typeKindLabel(kind)} saved successfully.`)
  }

  async function deleteTypeData() {
    if (!deletingType) {
      return
    }

    await saveSection(`delete-${deletingType.kind}-types`, async () => {
      if (deletingType.kind === 'interest') {
        await settingsService.deleteInterestType(deletingType.code)
      } else if (deletingType.kind === 'expense') {
        await settingsService.deleteExpenseType(deletingType.code)
      } else if (deletingType.kind === 'material') {
        await settingsService.deleteMaterialType(deletingType.code)
      } else if (deletingType.kind === 'itemCategory') {
        await settingsService.deleteItemCategoryType(deletingType.code)
      } else {
        await settingsService.deleteFinancialAccountType(deletingType.code)

        if (editingFinancialAccountCode === deletingType.code) {
          setFinancialAccountForm(emptyTypeForm)
          setEditingFinancialAccountCode(null)
        }
      }

      const currentPage = getTypePage(deletingType.kind)
      const nextPage = getTypeItems(deletingType.kind).length === 1 && currentPage.currentPage > 1
        ? currentPage.currentPage - 1
        : currentPage.currentPage

      await reloadTypeData(deletingType.kind, nextPage)

      setDeletingType(null)
    }, `${deletingType.name} deleted successfully.`)
  }

  function setTypePageData(kind: TypeKind, response: DefaultTypeListPage, fallbackPage: number) {
    const pageState = toTypePageState(response, fallbackPage)

    if (kind === 'interest') {
      setInterestPage(pageState)
      setInterestTypes(response.items ?? [])
    } else if (kind === 'expense') {
      setExpensePage(pageState)
      setExpenseTypes(response.items ?? [])
    } else if (kind === 'material') {
      setMaterialPage(pageState)
      setMaterialTypes(response.items ?? [])
    } else if (kind === 'itemCategory') {
      setItemCategoryPage(pageState)
      setItemCategoryTypes(response.items ?? [])
    } else {
      setFinancialAccountPage(pageState)
      setFinancialAccountTypes(response.items ?? [])
    }
  }

  function getTypePage(kind: TypeKind) {
    if (kind === 'interest') {
      return interestPage
    }

    if (kind === 'expense') {
      return expensePage
    }

    if (kind === 'material') {
      return materialPage
    }

    if (kind === 'financialAccount') {
      return financialAccountPage
    }

    return itemCategoryPage
  }

  function getTypeItems(kind: TypeKind) {
    if (kind === 'interest') {
      return interestTypes
    }

    if (kind === 'expense') {
      return expenseTypes
    }

    if (kind === 'material') {
      return materialTypes
    }

    if (kind === 'financialAccount') {
      return financialAccountTypes
    }

    return itemCategoryTypes
  }

  async function reloadTypeData(kind: TypeKind, page?: number) {
    const nextPage = page ?? getTypePage(kind).currentPage
    const params = { page: nextPage, perPage: typeDataPerPage }

    if (kind === 'interest') {
      const response = await settingsService.listInterestTypes(params)
      setTypePageData(kind, response, nextPage)
    } else if (kind === 'expense') {
      const response = await settingsService.listExpenseTypes(params)
      setTypePageData(kind, response, nextPage)
    } else if (kind === 'material') {
      const response = await settingsService.listMaterialTypes(params)
      setTypePageData(kind, response, nextPage)
    } else if (kind === 'itemCategory') {
      const response = await settingsService.listItemCategoryTypes(params)
      setTypePageData(kind, response, nextPage)
    } else {
      const response = await settingsService.listFinancialAccountTypes(params)
      setTypePageData(kind, response, nextPage)
    }
  }

  function getTypeForm(kind: TypeKind) {
    if (kind === 'interest') {
      return interestForm
    }

    if (kind === 'expense') {
      return expenseForm
    }

    if (kind === 'material') {
      return materialForm
    }

    if (kind === 'financialAccount') {
      return financialAccountForm
    }

    return itemCategoryForm
  }

  async function saveSection(section: string, action: () => Promise<void>, successMessage = 'Settings saved successfully.') {
    setSavingSection(section)
    setError(null)
    setNotice(null)

    try {
      await action()
      setNotice(successMessage)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save settings.')
    } finally {
      setSavingSection(null)
    }
  }

  if (isLoading) {
    return (
      <section className="page">
        <SectionHeader title="Settings" subtitle="Tenant configuration, branding, and default data controls." />
        <LoadingState rows={6} />
      </section>
    )
  }

  return (
    <section className="page">
      <SectionHeader title="Settings" subtitle="Tenant configuration, branding, and default data controls." />

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Settings action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Settings updated" tone="success" />}

      <div className="workflow-stack">
        <Card title="User Setting" description="Choose the language used for your account.">
          <FormGroup columns={1}>
            <FormField id="settings-user-language" label="Language">
              <Select
                id="settings-user-language"
                onChange={(event) => setSelectedLanguage(event.target.value === 'mm' ? 'mm' : 'en')}
                value={selectedLanguage}
              >
                <option value="en">English</option>
                <option value="mm">Myanmar</option>
              </Select>
            </FormField>
          </FormGroup>
          <ActionBar>
            <Button
              disabled={!userLanguageChanged || savingSection === 'user-language'}
              onClick={() => setSelectedLanguage(currentLanguage)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={!userLanguageChanged}
              isLoading={savingSection === 'user-language'}
              onClick={() => void saveUserLanguage()}
              variant="primary"
            >
              Save
            </Button>
          </ActionBar>
        </Card>

        {canViewGeneralSettings && canManageTenantBranding && (
          <Card title="Branding Setting">
            <FormGroup columns={3}>
              <FormField id="settings-primary-color" label="Primary Color">
                <ColorPickerField
                  id="settings-primary-color"
                  fallback="#03003D"
                  value={branding.primary_color}
                  onChange={(primary_color) => setBranding({ ...branding, primary_color })}
                />
              </FormField>
              <FormField id="settings-secondary-color" label="Secondary Color">
                <ColorPickerField
                  id="settings-secondary-color"
                  fallback="#4B5563"
                  value={branding.secondary_color}
                  onChange={(secondary_color) => setBranding({ ...branding, secondary_color })}
                />
              </FormField>
              <FormField id="settings-accent-color" label="Accent Color">
                <ColorPickerField
                  id="settings-accent-color"
                  fallback="#F5A700"
                  value={branding.accent_color}
                  onChange={(accent_color) => setBranding({ ...branding, accent_color })}
                />
              </FormField>
            </FormGroup>
            <ActionBar>
              <Button onClick={() => navigate(routePaths.templateEditor)} variant="secondary">Template Editor</Button>
              <Button disabled={!brandingChanged || savingSection === 'branding'} onClick={() => setBranding(brandingInitial)} variant="secondary">Cancel</Button>
              <Button disabled={!brandingChanged} isLoading={savingSection === 'branding'} onClick={() => void saveBranding()} variant="primary">Save</Button>
            </ActionBar>
          </Card>

        )}
        
        {canViewGeneralSettings && <Card title="Tenant Contact Setting">
          <FormGroup columns={2}>
            <FormField id="settings-contact-phone" label="Phone">
              <Input id="settings-contact-phone" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} />
            </FormField>
            <FormField id="settings-contact-city" label="City">
              <Input id="settings-contact-city" value={contact.city} onChange={(event) => setContact({ ...contact, city: event.target.value })} />
            </FormField>
            <FormField id="settings-contact-country" label="Country">
              <Input id="settings-contact-country" value={contact.country} onChange={(event) => setContact({ ...contact, country: event.target.value })} />
            </FormField>
            <FormField id="settings-contact-address" label="Address">
              <Textarea id="settings-contact-address" value={contact.address} onChange={(event) => setContact({ ...contact, address: event.target.value })} />
            </FormField>
          </FormGroup>
          <ActionBar>
            <Button disabled={!contactChanged || savingSection === 'contact'} onClick={() => setContact(contactInitial)} variant="secondary">Cancel</Button>
            <Button disabled={!contactChanged} isLoading={savingSection === 'contact'} onClick={() => void saveContact()} variant="primary">Save</Button>
          </ActionBar>
        </Card>}

        {(canViewInterestTypes || canViewExpenseTypes || canViewMaterialTypes || canViewItemCategoryTypes || canViewFinancialAccountTypes) && <Card title="Type Data Setting" description="Create tenant-specific options for operational forms.">
          <div className="workflow-stack">
            {canViewInterestTypes && <TypeDataBlock
              canCreate={canCreateInterestType}
              canDelete={canDeleteInterestType}
              form={interestForm}
              isSaving={savingSection === 'interest-types'}
              items={interestTypes}
              kind="interest"
              canManage={canCreateInterestType}
              onCancel={() => setInterestForm(emptyTypeForm)}
              onChange={setInterestForm}
              onDelete={(item) => item.code && setDeletingType({ code: item.code, kind: 'interest', name: item.name })}
              onSave={() => void saveTypeData('interest')}
              pagination={{
                currentPage: interestPage.currentPage,
                lastPage: interestPage.lastPage,
                onNext: () => void reloadTypeData('interest', interestPage.currentPage + 1),
                onPrevious: () => void reloadTypeData('interest', interestPage.currentPage - 1),
                total: interestPage.total,
              }}
              title="Interest Types"
              totalCount={interestPage.total}
              withDuration
            />}
            {canViewExpenseTypes && <TypeDataBlock
              canCreate={canCreateExpenseType}
              canDelete={canDeleteExpenseType}
              form={expenseForm}
              isSaving={savingSection === 'expense-types'}
              items={expenseTypes}
              kind="expense"
              canManage={canCreateExpenseType}
              onCancel={() => setExpenseForm(emptyTypeForm)}
              onChange={setExpenseForm}
              onDelete={(item) => item.code && setDeletingType({ code: item.code, kind: 'expense', name: item.name })}
              onSave={() => void saveTypeData('expense')}
              pagination={{
                currentPage: expensePage.currentPage,
                lastPage: expensePage.lastPage,
                onNext: () => void reloadTypeData('expense', expensePage.currentPage + 1),
                onPrevious: () => void reloadTypeData('expense', expensePage.currentPage - 1),
                total: expensePage.total,
              }}
              title="Expense Types"
              totalCount={expensePage.total}
            />}
            {canViewMaterialTypes && <TypeDataBlock
              canCreate={canCreateMaterialType}
              canDelete={canDeleteMaterialType}
              form={materialForm}
              isSaving={savingSection === 'material-types'}
              items={materialTypes}
              kind="material"
              canManage={canCreateMaterialType}
              onCancel={() => setMaterialForm(emptyTypeForm)}
              onChange={setMaterialForm}
              onDelete={(item) => item.code && setDeletingType({ code: item.code, kind: 'material', name: item.name })}
              onSave={() => void saveTypeData('material')}
              pagination={{
                currentPage: materialPage.currentPage,
                lastPage: materialPage.lastPage,
                onNext: () => void reloadTypeData('material', materialPage.currentPage + 1),
                onPrevious: () => void reloadTypeData('material', materialPage.currentPage - 1),
                total: materialPage.total,
              }}
              title="Material Types"
              totalCount={materialPage.total}
            />}
            {canViewItemCategoryTypes && <TypeDataBlock
              canCreate={canCreateItemCategoryType}
              canDelete={canDeleteItemCategoryType}
              form={itemCategoryForm}
              isSaving={savingSection === 'itemCategory-types'}
              items={itemCategoryTypes}
              kind="itemCategory"
              canManage={canCreateItemCategoryType}
              onCancel={() => setItemCategoryForm(emptyTypeForm)}
              onChange={setItemCategoryForm}
              onDelete={(item) => item.code && setDeletingType({ code: item.code, kind: 'itemCategory', name: item.name })}
              onSave={() => void saveTypeData('itemCategory')}
              pagination={{
                currentPage: itemCategoryPage.currentPage,
                lastPage: itemCategoryPage.lastPage,
                onNext: () => void reloadTypeData('itemCategory', itemCategoryPage.currentPage + 1),
                onPrevious: () => void reloadTypeData('itemCategory', itemCategoryPage.currentPage - 1),
                total: itemCategoryPage.total,
              }}
              title="Item Category Types"
              totalCount={itemCategoryPage.total}
            />}
            {canViewFinancialAccountTypes && <TypeDataBlock
              canCreate={canCreateFinancialAccountType}
              canDelete={canDeleteFinancialAccountType}
              canManage={canCreateFinancialAccountType}
              canUpdate={canUpdateFinancialAccountType}
              form={financialAccountForm}
              isEditing={editingFinancialAccountCode !== null}
              isSaving={savingSection === 'financialAccount-types'}
              items={financialAccountTypes}
              kind="financialAccount"
              onCancel={() => {
                setFinancialAccountForm(emptyTypeForm)
                setEditingFinancialAccountCode(null)
              }}
              onChange={setFinancialAccountForm}
              onDelete={(item) => item.code && setDeletingType({ code: item.code, kind: 'financialAccount', name: item.name })}
              onEdit={(item) => {
                if (!item.code) return
                setEditingFinancialAccountCode(item.code)
                setFinancialAccountForm({
                  name: item.name,
                  code: item.code,
                  duration_in_days: '30',
                  update_key: item.update_key ?? item.updateKey ?? 0,
                })
              }}
              onSave={() => void saveTypeData('financialAccount')}
              pagination={{
                currentPage: financialAccountPage.currentPage,
                lastPage: financialAccountPage.lastPage,
                onNext: () => void reloadTypeData('financialAccount', financialAccountPage.currentPage + 1),
                onPrevious: () => void reloadTypeData('financialAccount', financialAccountPage.currentPage - 1),
                total: financialAccountPage.total,
              }}
              title="Financial Account Types"
              totalCount={financialAccountPage.total}
            />}
          </div>
        </Card>}

        {canViewCurrencyPreferences && <Card title="Currency Settings" description="Choose the currencies used for account defaults and financial reporting.">
          {currencyRecalculationNotice && <Alert
            action={!currencyRecalculationNotice.isTerminal && <div className="settings-recalculation-actions">
              {currencyRecalculationNotice.status === 'waiting_for_rates' && canProvideHistoricalRates && <Button onClick={() => navigate(routePaths.reportingCurrencyRates)} variant="primary">Provide Required Rates</Button>}
              {canUpdateCurrencyPreferences && <Button onClick={() => setIsAbortCurrencyDialogOpen(true)} variant="danger">Abort Currency Change</Button>}
            </div>}
            message={currencyRecalculationNotice.message}
            title={currencyRecalculationNotice.title}
            tone={currencyRecalculationNotice.tone}
          />}
          <FormGroup columns={3}>
            <FormField id="settings-default-currency" label="Default Currency">
              <Select id="settings-default-currency" disabled={!canUpdateCurrencyPreferences} value={String(currencyPreferences.default_currency_id || '')} onChange={(event) => setCurrencyPreferences({ ...currencyPreferences, default_currency_id: Number(event.target.value) })}>
                <option value="">Select currency</option>
                {currencyOptions.map((currency) => <option key={currency.id} value={currency.id}>{currency.code} — {currency.name}</option>)}
              </Select>
            </FormField>
            <FormField id="settings-reporting-currency" label="Reporting Currency">
              <Select id="settings-reporting-currency" disabled={!canUpdateCurrencyPreferences} value={String(currencyPreferences.reporting_currency_id || '')} onChange={(event) => setCurrencyPreferences({ ...currencyPreferences, reporting_currency_id: Number(event.target.value) })}>
                <option value="">Select currency</option>
                {currencyOptions.map((currency) => <option key={currency.id} value={currency.id}>{currency.code} — {currency.name}</option>)}
              </Select>
            </FormField>
            <DashboardFinancialUnitSetting
              disabled={!canUpdateCurrencyPreferences}
              onChange={(default_financial_unit) => setCurrencyPreferences({ ...currencyPreferences, default_financial_unit })}
              value={currencyPreferences.default_financial_unit}
            />
          </FormGroup>
          {canUpdateCurrencyPreferences && <ActionBar>
            <Button disabled={!currencyPreferencesChanged || savingSection === 'currency-preferences'} onClick={() => setCurrencyPreferences(currencyPreferencesInitial)} variant="secondary">Cancel</Button>
            <Button disabled={!currencyPreferencesChanged || !currencyPreferences.default_currency_id || !currencyPreferences.reporting_currency_id} isLoading={savingSection === 'currency-preferences'} onClick={() => void saveCurrencyPreferences()} variant="primary">Save</Button>
          </ActionBar>}
        </Card>}

        {canManageTimezone && <Card title="Business Timezone" description="Controls exchange-rate opening days and correction windows.">
          <FormField id="settings-timezone" label="Timezone">
            <SearchableSelect id="settings-timezone" options={timezoneOptions} value={timezone} onChange={setTimezone} getOptionLabel={(option) => option} getOptionValue={(option) => option} placeholder="Search timezones" />
          </FormField>
          <ActionBar>
            <Button disabled={timezone === timezoneInitial} onClick={() => setTimezone(timezoneInitial)} variant="secondary">Cancel</Button>
            <Button disabled={timezone === timezoneInitial} isLoading={savingSection === 'timezone'} onClick={() => void saveTimezone()} variant="primary">Save</Button>
          </ActionBar>
        </Card>}
        {canViewGeneralSettings && <Card title="Tenant Setting">
          <div className="settings-info-box" role="status">
            <span>Current default password</span>
            <strong>{tenantInitial.default_tenant_user_password || '-'}</strong>
          </div>
          <FormGroup columns={2}>
            <FormField id="settings-default-password" label="New Default Password">
              <Input id="settings-default-password" minLength={8} type="password" value={tenant.default_tenant_user_password} onChange={(event) => setTenant({ ...tenant, default_tenant_user_password: event.target.value })} />
            </FormField>
          </FormGroup>
          <ActionBar>
            <Button disabled={!tenantChanged || savingSection === 'tenant'} onClick={() => setTenant(tenantInitial)} variant="secondary">Cancel</Button>
            <Button disabled={!tenantChanged} isLoading={savingSection === 'tenant'} onClick={() => void saveTenant()} variant="primary">Save</Button>
          </ActionBar>
        </Card>}
        {canManageAccountingSchedule && <Card title="Automatic Accounting Day Schedule" description={`Times use ${accountingScheduleTimezone}. The scheduler processes due actions every 15 minutes.`}>
          <div className="accounting-schedule accounting-schedule--desktop" role="group" aria-label="Weekly accounting schedule">
            <div className="accounting-schedule__header" aria-hidden="true">
              <span>Day</span><span>Enabled</span><span>Open</span><span>Close</span>
            </div>
            {accountingSchedule.map((day) => <div className="accounting-schedule__row" key={day.weekday}>
              <strong>{weekdayNames[day.weekday]}</strong>
              <label className="accounting-schedule__toggle"><input checked={day.is_enabled} onChange={(event) => updateAccountingScheduleDay(day.weekday, { is_enabled: event.target.checked })} type="checkbox" /><span>{day.is_enabled ? 'Enabled' : 'Disabled'}</span></label>
              <Input aria-label={`${weekdayNames[day.weekday]} open time`} disabled={!day.is_enabled} onChange={(event) => updateAccountingScheduleDay(day.weekday, { open_time: event.target.value })} type="time" value={day.open_time.slice(0, 5)} />
              <div><Input aria-label={`${weekdayNames[day.weekday]} close time`} disabled={!day.is_enabled} onChange={(event) => updateAccountingScheduleDay(day.weekday, { close_time: event.target.value })} type="time" value={day.close_time.slice(0, 5)} />{accountingScheduleErrors[day.weekday] && <small className="accounting-schedule__error">{accountingScheduleErrors[day.weekday]}</small>}</div>
            </div>)}
          </div>
          <div className="accounting-schedule accounting-schedule--mobile" role="group" aria-label="Weekly accounting schedule mobile">
            {accountingSchedule.map((day) => <section className="accounting-schedule__card" key={day.weekday}>
              <header><strong>{weekdayNames[day.weekday]}</strong><label className="accounting-schedule__toggle"><input checked={day.is_enabled} onChange={(event) => updateAccountingScheduleDay(day.weekday, { is_enabled: event.target.checked })} type="checkbox" /><span>{day.is_enabled ? 'Enabled' : 'Disabled'}</span></label></header>
              <FormGroup columns={2}>
                <FormField id={`schedule-mobile-open-${day.weekday}`} label="Open time"><Input id={`schedule-mobile-open-${day.weekday}`} disabled={!day.is_enabled} onChange={(event) => updateAccountingScheduleDay(day.weekday, { open_time: event.target.value })} type="time" value={day.open_time.slice(0, 5)} /></FormField>
                <FormField id={`schedule-mobile-close-${day.weekday}`} label="Close time"><Input id={`schedule-mobile-close-${day.weekday}`} disabled={!day.is_enabled} onChange={(event) => updateAccountingScheduleDay(day.weekday, { close_time: event.target.value })} type="time" value={day.close_time.slice(0, 5)} /></FormField>
              </FormGroup>
              {accountingScheduleErrors[day.weekday] && <small className="accounting-schedule__error">{accountingScheduleErrors[day.weekday]}</small>}
            </section>)}
          </div>
          <ActionBar>
            <Button disabled={!accountingScheduleChanged || savingSection === 'accounting-schedule'} onClick={() => { setAccountingSchedule(accountingScheduleInitial); setAccountingScheduleErrors({}) }} variant="secondary">Cancel</Button>
            <Button disabled={!accountingScheduleChanged} isLoading={savingSection === 'accounting-schedule'} onClick={() => void saveAccountingSchedule()} variant="primary">Save Schedule</Button>
          </ActionBar>
        </Card>}
      </div>
      <ConfirmDialog
        confirmLabel="Delete Type"
        isLoading={deletingType ? savingSection === `delete-${deletingType.kind}-types` : false}
        isOpen={Boolean(deletingType)}
        message={`Delete ${deletingType?.name ?? 'this type'}? Built-in types cannot be deleted.`}
        onCancel={() => setDeletingType(null)}
        onConfirm={() => void deleteTypeData()}
        title="Confirm type deletion"
      />
      <ConfirmDialog
        confirmLabel="Abort Currency Change"
        isLoading={savingSection === 'abort-reporting-currency'}
        isOpen={isAbortCurrencyDialogOpen && !currencyRecalculationNotice?.isTerminal}
        message="Return reporting reports to the previous currency? Historical rates already submitted will be retained."
        onCancel={() => setIsAbortCurrencyDialogOpen(false)}
        onConfirm={() => void abortReportingCurrencyChange()}
        title="Abort reporting currency change"
      />
    </section>
  )
}

function ColorPickerField({
  fallback,
  id,
  onChange,
  value,
}: {
  fallback: string
  id: string
  onChange: (value: string) => void
  value: string
}) {
  const colorValue = normalizeHexColor(value) ?? fallback

  return (
    <div className="color-picker-field">
      <label className="color-picker-field__control" htmlFor={id}>
        <span className="color-picker-field__preview" style={{ backgroundColor: colorValue }} />
        <span className="color-picker-field__value">{colorValue.toUpperCase()}</span>
        <input id={id} type="color" value={colorValue} onChange={(event) => onChange(event.target.value.toUpperCase())} />
      </label>
      <div className="color-picker-field__palette" aria-label="Brand color palette">
        {brandColorOptions.map((color) => (
          <button
            aria-label={`Use ${color}`}
            className={colorValue.toLowerCase() === color.toLowerCase() ? 'is-active' : undefined}
            key={color}
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            title={color}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}

function TypeDataBlock({
  canCreate,
  canDelete,
  canManage,
  canUpdate,
  form,
  isEditing = false,
  isSaving,
  items,
  kind,
  onCancel,
  onChange,
  onDelete,
  onEdit,
  onSave,
  pagination,
  title,
  totalCount,
  withDuration = false,
}: {
  canCreate?: boolean
  canDelete?: boolean
  canManage: boolean
  canUpdate?: boolean
  form: TypeForm
  isEditing?: boolean
  isSaving: boolean
  items: DefaultTypeOption[]
  kind: TypeKind
  onCancel: () => void
  onChange: (form: TypeForm) => void
  onDelete: (item: DefaultTypeOption) => void
  onEdit?: (item: DefaultTypeOption) => void
  onSave: () => void
  pagination?: {
    currentPage: number
    lastPage: number
    onNext: () => void
    onPrevious: () => void
    total: number
  }
  title: string
  totalCount?: number
  withDuration?: boolean
}) {
  const changed = isTypeFormChanged(form)
  const allowCreate = canCreate ?? canManage
  const allowDelete = canDelete ?? canManage
  const allowUpdate = canUpdate ?? false
  const showForm = isEditing ? allowUpdate : allowCreate
  const columns: Array<DataTableColumn<DefaultTypeOption>> = [
    { header: 'Name', key: 'name', render: (item) => <strong>{item.name}</strong> },
    { header: 'Code', key: 'code', render: (item) => item.code ?? '-' },
    {
      header: 'Source',
      key: 'source',
      render: (item) => isBuiltInType(item) ? <Badge tone="info">Built-in</Badge> : <Badge tone="success">Custom</Badge>,
    },
  ]

  if (withDuration) {
    columns.splice(2, 0, {
      header: 'Duration',
      key: 'duration',
      render: (item) => `${getTypeDuration(item) ?? '-'} days`,
    })
  }

  return (
    <section className="subform-panel">
      <header className="subform-panel__header">
        <strong>{title}</strong>
        <Badge tone="info">{totalCount ?? items.length}</Badge>
      </header>
      <DataTable
        actions={(allowUpdate || allowDelete) ? (item) => !isBuiltInType(item) && item.code ? (
          <div className="dashboard-table-actions">
            {allowUpdate && onEdit && <Button onClick={() => onEdit(item)} variant="secondary">Edit</Button>}
            {allowDelete && <Button onClick={() => onDelete(item)} variant="danger">Delete</Button>}
          </div>
        ) : null : undefined}
        columns={columns}
        emptyDescription={canManage
          ? `Create the first ${typeKindLabel(kind).toLowerCase()} for this tenant.`
          : `${title} will appear here when they are available for this tenant.`}
        emptyTitle={`No ${title.toLowerCase()}`}
        getItemId={(item) => item.code ?? item.id}
        getItemTitle={(item) => item.name}
        items={items}
        pagination={pagination}
        showEmptyStructure
      />
      {showForm && (
        <>
          <FormGroup columns={withDuration ? 3 : 2}>
            <FormField id={`${title}-name`} label="Name">
              <Input id={`${title}-name`} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
            </FormField>
            <FormField id={`${title}-code`} label="Code">
              <Input id={`${title}-code`} value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value })} />
            </FormField>
            {withDuration && (
              <FormField id={`${title}-duration`} label="Duration In Days">
                <Input id={`${title}-duration`} min="1" type="number" value={form.duration_in_days} onChange={(event) => onChange({ ...form, duration_in_days: event.target.value })} />
              </FormField>
            )}
          </FormGroup>
          <ActionBar>
            <Button disabled={!changed || isSaving} onClick={onCancel} variant="secondary">Cancel</Button>
            <Button disabled={!changed} isLoading={isSaving} onClick={onSave} variant="primary">{isEditing ? 'Update' : 'Save'}</Button>
          </ActionBar>
        </>
      )}
    </section>
  )
}

function hasEnabledFeature(
  tenantResolution: ReturnType<typeof useTenantSession>['tenantResolution'],
  featureCode: string,
) {
  const feature = tenantResolution.status === 'resolved'
    ? tenantResolution.tenant.tenant_features?.[featureCode]
    : null

  return Boolean(feature?.is_active && feature.is_enabled)
}

function hasAnyEnabledFeature(
  tenantResolution: ReturnType<typeof useTenantSession>['tenantResolution'],
  featureCodes: string[],
) {
  return featureCodes.some((featureCode) => hasEnabledFeature(tenantResolution, featureCode))
}

function getUserLocale(user: TenantUser | null): UiLocale {
  const locale = user?.preferLang ?? user?.prefer_lang

  return locale === 'mm' ? 'mm' : 'en'
}

function getUserUpdateKey(user: TenantUser | null) {
  const updateKey = user?.updateKey ?? user?.update_key

  return typeof updateKey === 'number' ? updateKey : null
}

function mergeLanguageResponse(
  currentUser: TenantUser,
  response: ChangeLanguageResponse,
  preferLang: UiLocale,
): TenantUser {
  const responseUser = response.user ?? response
  const nextUpdateKey = responseUser.updateKey ?? responseUser.update_key ?? currentUser.updateKey ?? currentUser.update_key

  return {
    ...currentUser,
    ...responseUser,
    preferLang,
    prefer_lang: preferLang,
    updateKey: nextUpdateKey,
    update_key: nextUpdateKey,
  }
}

function normalizeBranding(value?: BrandingSettings | null) {
  return {
    primary_color: value?.primary_color ?? '',
    secondary_color: value?.secondary_color ?? '',
    accent_color: value?.accent_color ?? '',
    update_key: value?.update_key ?? 0,
  }
}

function normalizeHexColor(value: string) {
  const color = value.trim()

  return /^#[0-9a-f]{6}$/i.test(color) ? color : null
}

function normalizeContact(value?: ContactSettings | null) {
  return {
    address: value?.address ?? '',
    phone: value?.phone ?? '',
    city: value?.city ?? '',
    country: value?.country ?? '',
    update_key: value?.update_key ?? 0,
  }
}

function normalizeTenant(value?: TenantSettings | null) {
  return {
    default_tenant_user_password: value?.default_tenant_user_password ?? value?.value ?? '',
    update_key: value?.update_key ?? 0,
  }
}

function normalizeCurrencyPreferences(value: CurrencyPreferences) {
  return {
    default_currency_id: value.default_currency_id,
    reporting_currency_id: value.reporting_currency_id,
    default_financial_unit: value.default_financial_unit ?? null,
    update_key: value.update_key,
  }
}

function reportingCurrencyNotice(
  recalculation: CurrencyPreferences['reporting_currency_recalculation'],
  notification: TenantNotification | null,
) {
  if (!recalculation) return null

  const status = notification?.status ?? recalculation.status
  const previousCode = notification?.data.previous_currency.code ?? 'the previous currency'
  const requestedCode = notification?.data.requested_currency.code ?? 'the requested currency'

  if (status === 'completed') {
    return {
      isTerminal: true,
      message: `Reporting totals now use ${requestedCode}. The recalculation completed successfully.`,
      status,
      title: 'Reporting currency update completed',
      tone: 'success' as const,
    }
  }

  if (status === 'cancelled') {
    return {
      isTerminal: true,
      message: `The reporting currency change was cancelled. Reporting totals continue to use ${previousCode}.`,
      status,
      title: 'Reporting currency update cancelled',
      tone: 'info' as const,
    }
  }

  if (status === 'failed') {
    return {
      isTerminal: false,
      message: `The recalculation to ${requestedCode} failed. You can abort the currency change or retry after correcting the required exchange rates.`,
      status,
      title: 'Reporting currency update failed',
      tone: 'danger' as const,
    }
  }

  if (status === 'waiting_for_rates') {
    const dates = recalculation.missing_rates.map((rate) => rate.date)
    const missingRateCount = notification?.data.missing_rate_count ?? dates.length
    const requirement = dates.length > 0
      ? `Add exact-date rates for: ${dates.join(', ')}.`
      : `Add the required exchange rates for ${missingRateCount} date${missingRateCount === 1 ? '' : 's'}.`

    return {
      isTerminal: false,
      message: `Reporting totals remain in ${previousCode}. ${requirement}`,
      status,
      title: 'Historical exchange rates required',
      tone: 'warning' as const,
    }
  }

  if (status === 'processing') {
    return {
      isTerminal: false,
      message: `Reporting totals remain in ${previousCode} while transactions are recalculated to ${requestedCode}.`,
      status,
      title: 'Reporting currency recalculation in progress',
      tone: 'info' as const,
    }
  }

  return {
    isTerminal: false,
    message: `The change from ${previousCode} to ${requestedCode} is queued. Reporting totals will remain in ${previousCode} until recalculation completes.`,
    status,
    title: 'Reporting currency recalculation queued',
    tone: 'warning' as const,
  }
}

function normalizeAccountingSchedule(days: AccountingDayScheduleDay[]) {
  const byWeekday = new Map(days.map((day) => [day.weekday, day]))

  return emptyAccountingSchedule.map((fallback) => {
    const day = byWeekday.get(fallback.weekday)
    return day ? { ...fallback, ...day, open_time: day.open_time.slice(0, 5), close_time: day.close_time.slice(0, 5) } : { ...fallback }
  })
}

function toTypePageState(response: DefaultTypeListPage, fallbackPage: number) {
  return {
    currentPage: getTypePageValue(response, 'currentPage', 'current_page', fallbackPage),
    lastPage: getTypePageValue(response, 'lastPage', 'last_page', 1),
    total: response.total ?? response.items?.length ?? 0,
  }
}

function getTypePageValue(
  response: DefaultTypeListPage,
  camelKey: 'currentPage' | 'lastPage' | 'perPage',
  snakeKey: 'current_page' | 'last_page' | 'per_page',
  fallback: number,
) {
  return response[camelKey] ?? response[snakeKey] ?? fallback
}

function hasChanged<TValue>(current: TValue, initial: TValue) {
  return JSON.stringify(current) !== JSON.stringify(initial)
}

function isTypeFormChanged(form: TypeForm) {
  return Boolean(form.name.trim() || form.code.trim())
}

function toTypePayload(form: TypeForm, withDuration: boolean) {
  const payload = {
    name: form.name.trim(),
    code: form.code.trim(),
  }

  return withDuration
    ? { ...payload, durationInDays: Number(form.duration_in_days || 30) }
    : payload
}

function isBuiltInType(item: DefaultTypeOption) {
  return (item.tenant_id ?? item.tenantId ?? null) === null
}

function getTypeDuration(item: DefaultTypeOption) {
  return item.duration_in_days ?? item.durationInDays ?? null
}

function typeKindLabel(kind: TypeKind) {
  if (kind === 'interest') {
    return 'Interest type'
  }

  if (kind === 'expense') {
    return 'Expense type'
  }

  if (kind === 'material') {
    return 'Material type'
  }

  if (kind === 'financialAccount') {
    return 'Financial account type'
  }

  return 'Item category type'
}
