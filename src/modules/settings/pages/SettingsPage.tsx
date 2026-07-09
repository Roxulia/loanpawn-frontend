import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button, Input, Select, Textarea } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ActionBar, Card, FormField, FormGroup, SectionHeader } from '../../../components/molecules'
import { ConfirmDialog, DataTable, type DataTableColumn } from '../../../components/organisms'
import type { TenantUser } from '../../../dataobjects/tenant/auth'
import { useTenantSession } from '../../../contexts/useTenantSession'
import type { UiLocale } from '../../../locales/UiLocale'
import { settingsService, type BrandingSettings, type ChangeLanguageResponse, type ContactSettings, type DefaultTypeListPage, type DefaultTypeOption, type TenantSettings } from '../services/settingsService'

type TypeForm = {
  name: string
  code: string
  duration_in_days: string
}

type TypeKind = 'interest' | 'expense' | 'material' | 'itemCategory'

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
  const [interestForm, setInterestForm] = useState(emptyTypeForm)
  const [expenseForm, setExpenseForm] = useState(emptyTypeForm)
  const [materialForm, setMaterialForm] = useState(emptyTypeForm)
  const [itemCategoryForm, setItemCategoryForm] = useState(emptyTypeForm)
  const [interestPage, setInterestPage] = useState<TypePageState>({ currentPage: 1, lastPage: 1, total: 0 })
  const [expensePage, setExpensePage] = useState<TypePageState>({ currentPage: 1, lastPage: 1, total: 0 })
  const [materialPage, setMaterialPage] = useState<TypePageState>({ currentPage: 1, lastPage: 1, total: 0 })
  const [itemCategoryPage, setItemCategoryPage] = useState<TypePageState>({ currentPage: 1, lastPage: 1, total: 0 })
  const [selectedLanguage, setSelectedLanguage] = useState<UiLocale>('en')
  const [isLoading, setIsLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [deletingType, setDeletingType] = useState<TypeToDelete | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { currentUser, session, setCurrentUser, setLocale, setSession, tenantResolution } = useTenantSession()
  const canManageMasterData = hasEnabledFeature(tenantResolution, 'master_data_management')
  const canManageTenantBranding = hasEnabledFeature(tenantResolution, 'tenant_branding')
  const currentLanguage = getUserLocale(currentUser)

  const brandingChanged = useMemo(() => hasChanged(branding, brandingInitial), [branding, brandingInitial])
  const contactChanged = useMemo(() => hasChanged(contact, contactInitial), [contact, contactInitial])
  const tenantChanged = useMemo(() => hasChanged(tenant, tenantInitial), [tenant, tenantInitial])
  const userLanguageChanged = selectedLanguage !== currentLanguage

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [settingsResponse, interestResponse, expenseResponse, materialResponse, itemCategoryResponse] = await Promise.all([
        settingsService.getSettings(),
        settingsService.listInterestTypes({ page: 1, perPage: typeDataPerPage }),
        settingsService.listExpenseTypes({ page: 1, perPage: typeDataPerPage }),
        settingsService.listMaterialTypes({ page: 1, perPage: typeDataPerPage }),
        settingsService.listItemCategoryTypes({ page: 1, perPage: typeDataPerPage }),
      ])
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
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load settings.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadSettings()
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadSettings])

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
      } else {
        await settingsService.createItemCategoryType(toTypePayload(form, false))
        setItemCategoryForm(emptyTypeForm)
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
      } else {
        await settingsService.deleteItemCategoryType(deletingType.code)
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
    } else {
      setItemCategoryPage(pageState)
      setItemCategoryTypes(response.items ?? [])
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
    } else {
      const response = await settingsService.listItemCategoryTypes(params)
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

        {canManageTenantBranding && (
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
        
        <Card title="Tenant Contact Setting">
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
        </Card>

        <Card title="Type Data Setting" description="Create tenant-specific options for operational forms.">
          <div className="workflow-stack">
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
          </div>
        </Card>

        <Card title="Tenant Setting">
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
        </Card>
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
  canManage,
  form,
  isSaving,
  items,
  kind,
  onCancel,
  onChange,
  onDelete,
  onSave,
  pagination,
  title,
  totalCount,
  withDuration = false,
}: {
  canManage: boolean
  form: TypeForm
  isSaving: boolean
  items: DefaultTypeOption[]
  kind: TypeKind
  onCancel: () => void
  onChange: (form: TypeForm) => void
  onDelete: (item: DefaultTypeOption) => void
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
        actions={canManage ? (item) => !isBuiltInType(item) && item.code ? (
          <Button onClick={() => onDelete(item)} variant="danger">Delete</Button>
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
      {canManage && (
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
            <Button disabled={!changed} isLoading={isSaving} onClick={onSave} variant="primary">Save</Button>
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

  return 'Item category type'
}
