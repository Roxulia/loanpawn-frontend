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
import { settingsService, type BrandingSettings, type ChangeLanguageResponse, type ContactSettings, type DefaultTypeListPage, type DefaultTypeOption, type TenantSettings } from '../services/settingsService'

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

const emptyTypeForm: TypeForm = {
  name: '',
  code: '',
  duration_in_days: '30',
  update_key: 0,
}

const typeDataPerPage = 5

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
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { currentUser, session, setCurrentUser, setLocale, setSession, tenantResolution } = useTenantSession()
  const { hasPermission } = usePermissions()
  const canManageMasterData = hasEnabledFeature(tenantResolution, 'master_data_management')
  const canViewGeneralSettings = hasPermission('manage_slip_document')
  const canViewFinancialAccountTypes = hasEnabledFeature(tenantResolution, 'accounting_management') && hasPermission('list_financial_account_type')
  const canManageFinancialAccountTypes = hasAnyEnabledFeature(tenantResolution, ['accounting_type_management', 'master_data_management'])
  const canCreateFinancialAccountType = canManageFinancialAccountTypes && hasPermission('create_financial_account_type')
  const canUpdateFinancialAccountType = canManageFinancialAccountTypes && hasPermission('update_financial_account_type')
  const canDeleteFinancialAccountType = canManageFinancialAccountTypes && hasPermission('delete_financial_account_type')
  const canManageTenantBranding = hasEnabledFeature(tenantResolution, 'tenant_branding')
  const canManageTimezone = hasEnabledFeature(tenantResolution, 'tenant_timezone_management') && hasPermission('manage_tenant_timezone')
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>([])
  const [timezone, setTimezone] = useState('Asia/Yangon')
  const [timezoneInitial, setTimezoneInitial] = useState('Asia/Yangon')
  const [timezoneUpdateKey, setTimezoneUpdateKey] = useState(0)
  const currentLanguage = getUserLocale(currentUser)

  const brandingChanged = useMemo(() => hasChanged(branding, brandingInitial), [branding, brandingInitial])
  const contactChanged = useMemo(() => hasChanged(contact, contactInitial), [contact, contactInitial])
  const tenantChanged = useMemo(() => hasChanged(tenant, tenantInitial), [tenant, tenantInitial])
  const userLanguageChanged = selectedLanguage !== currentLanguage

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [generalData, financialResponse] = await Promise.all([
        canViewGeneralSettings
          ? Promise.all([
              settingsService.getSettings(),
              settingsService.listInterestTypes({ page: 1, perPage: typeDataPerPage }),
              settingsService.listExpenseTypes({ page: 1, perPage: typeDataPerPage }),
              settingsService.listMaterialTypes({ page: 1, perPage: typeDataPerPage }),
              settingsService.listItemCategoryTypes({ page: 1, perPage: typeDataPerPage }),
            ])
          : Promise.resolve(null),
        canViewFinancialAccountTypes
          ? settingsService.listFinancialAccountTypes({ page: 1, perPage: typeDataPerPage })
          : Promise.resolve(null),
      ])

      if (generalData) {
        const [settingsResponse, interestResponse, expenseResponse, materialResponse, itemCategoryResponse] = generalData
        const nextBranding = normalizeBranding(settingsResponse.branding)
        const nextContact = normalizeContact(settingsResponse.contact)
        const nextTenant = normalizeTenant(settingsResponse.tenant_setting)

        setBrandingInitial(nextBranding)
        setBranding(nextBranding)
        setContactInitial(nextContact)
        setContact(nextContact)
        setTenantInitial(nextTenant)
        setTenant(nextTenant)
        setTypePageData('interest', interestResponse, 1)
        setTypePageData('expense', expenseResponse, 1)
        setTypePageData('material', materialResponse, 1)
        setTypePageData('itemCategory', itemCategoryResponse, 1)
      }

      if (financialResponse) {
        setTypePageData('financialAccount', financialResponse, 1)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load settings.')
    } finally {
      setIsLoading(false)
    }
  }, [canViewFinancialAccountTypes, canViewGeneralSettings])

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

  async function saveTimezone() {
    await saveSection('timezone', async () => {
      const response = await settingsService.updateTimezone({ timezone, update_key: timezoneUpdateKey })
      setTimezone(response.value)
      setTimezoneInitial(response.value)
      setTimezoneUpdateKey(response.update_key)
    }, 'Business timezone saved successfully.')
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

        {(canViewGeneralSettings || canViewFinancialAccountTypes) && <Card title="Type Data Setting" description="Create tenant-specific options for operational forms.">
          <div className="workflow-stack">
            {canViewGeneralSettings && <>
            <TypeDataBlock
              form={interestForm}
              isSaving={savingSection === 'interest-types'}
              items={interestTypes}
              kind="interest"
              canManage={canManageMasterData}
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
            />
            <TypeDataBlock
              form={expenseForm}
              isSaving={savingSection === 'expense-types'}
              items={expenseTypes}
              kind="expense"
              canManage={canManageMasterData}
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
            />
            <TypeDataBlock
              form={materialForm}
              isSaving={savingSection === 'material-types'}
              items={materialTypes}
              kind="material"
              canManage={canManageMasterData}
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
            />
            <TypeDataBlock
              form={itemCategoryForm}
              isSaving={savingSection === 'itemCategory-types'}
              items={itemCategoryTypes}
              kind="itemCategory"
              canManage={canManageMasterData}
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
            />
            </>}
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
