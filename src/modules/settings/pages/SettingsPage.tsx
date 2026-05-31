import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button, Input, Textarea } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ActionBar, Card, FormField, FormGroup, SectionHeader } from '../../../components/molecules'
import { ConfirmDialog, DataTable, type DataTableColumn } from '../../../components/organisms'
import { settingsService, type BrandingSettings, type ContactSettings, type DefaultTypeOption, type TenantSettings } from '../services/settingsService'
import { useTenantSession } from '../../../contexts/useTenantSession'

type TypeForm = {
  name: string
  code: string
  duration_in_days: string
}

type TypeKind = 'interest' | 'expense' | 'material'

type TypeToDelete = {
  code: string
  kind: TypeKind
  name: string
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
  const [interestForm, setInterestForm] = useState(emptyTypeForm)
  const [expenseForm, setExpenseForm] = useState(emptyTypeForm)
  const [materialForm, setMaterialForm] = useState(emptyTypeForm)
  const [isLoading, setIsLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [deletingType, setDeletingType] = useState<TypeToDelete | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const { tenantResolution } = useTenantSession()
  const tenantPlan = tenantResolution.status === 'resolved'
    ? tenantResolution.tenant.tenant_license.plan_type
    : null

  const brandingChanged = useMemo(() => hasChanged(branding, brandingInitial), [branding, brandingInitial])
  const contactChanged = useMemo(() => hasChanged(contact, contactInitial), [contact, contactInitial])
  const tenantChanged = useMemo(() => hasChanged(tenant, tenantInitial), [tenant, tenantInitial])

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [settingsResponse, interestResponse, expenseResponse, materialResponse] = await Promise.all([
        settingsService.getSettings(),
        settingsService.listInterestTypes(),
        settingsService.listExpenseTypes(),
        settingsService.listMaterialTypes(),
      ])
      const nextBranding = normalizeBranding(settingsResponse.data.branding)
      const nextContact = normalizeContact(settingsResponse.data.contact)
      const nextTenant = normalizeTenant(settingsResponse.data.tenant_setting)

      setBrandingInitial(nextBranding)
      setBranding(nextBranding)
      setContactInitial(nextContact)
      setContact(nextContact)
      setTenantInitial(nextTenant)
      setTenant(nextTenant)
      setInterestTypes(interestResponse.data ?? [])
      setExpenseTypes(expenseResponse.data ?? [])
      setMaterialTypes(materialResponse.data ?? [])
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

  async function saveBranding() {
    await saveSection('branding', async () => {
      const response = await settingsService.updateBranding(branding)
      const nextBranding = normalizeBranding(response.data)
      setBrandingInitial(nextBranding)
      setBranding(nextBranding)
    })
  }

  async function saveContact() {
    await saveSection('contact', async () => {
      const response = await settingsService.updateContact(contact)
      const nextContact = normalizeContact(response.data)
      setContactInitial(nextContact)
      setContact(nextContact)
    })
  }

  async function saveTenant() {
    await saveSection('tenant', async () => {
      const response = await settingsService.updateDefaultUserPassword(tenant)
      const nextTenant = normalizeTenant(response.data)
      setTenantInitial(nextTenant)
      setTenant(nextTenant)
    })
  }

  async function saveTypeData(kind: TypeKind) {
    const form = getTypeForm(kind)

    if (!form.name.trim() || !form.code.trim()) {
      setError('Type name and code are required.')
      return
    }

    await saveSection(`${kind}-types`, async () => {
      let createdType: DefaultTypeOption | null = null

      if (kind === 'interest') {
        const response = await settingsService.createInterestType(toTypePayload(form, true))
        createdType = response.data
        setInterestForm(emptyTypeForm)
      } else if (kind === 'expense') {
        const response = await settingsService.createExpenseType(toTypePayload(form, false))
        createdType = response.data
        setExpenseForm(emptyTypeForm)
      } else {
        const response = await settingsService.createMaterialType(toTypePayload(form, false))
        createdType = response.data
        setMaterialForm(emptyTypeForm)
      }

      if (createdType) {
        upsertTypeData(kind, createdType)
      } else {
        await reloadTypeData(kind)
      }
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
      } else {
        await settingsService.deleteMaterialType(deletingType.code)
      }

      removeTypeData(deletingType.kind, deletingType.code)
      setDeletingType(null)
    }, `${deletingType.name} deleted successfully.`)
  }

  function upsertTypeData(kind: TypeKind, item: DefaultTypeOption) {
    const updater = (current: DefaultTypeOption[]) => {
      const itemKey = getTypeKey(item)
      const existingIndex = current.findIndex((candidate) => getTypeKey(candidate) === itemKey)

      if (existingIndex === -1) {
        return [...current, item]
      }

      return current.map((candidate, index) => index === existingIndex ? item : candidate)
    }

    if (kind === 'interest') {
      setInterestTypes(updater)
    } else if (kind === 'expense') {
      setExpenseTypes(updater)
    } else {
      setMaterialTypes(updater)
    }
  }

  function removeTypeData(kind: TypeKind, code: string) {
    const updater = (current: DefaultTypeOption[]) => current.filter((item) => item.code !== code)

    if (kind === 'interest') {
      setInterestTypes(updater)
    } else if (kind === 'expense') {
      setExpenseTypes(updater)
    } else {
      setMaterialTypes(updater)
    }
  }

  async function reloadTypeData(kind: TypeKind) {
    if (kind === 'interest') {
      const response = await settingsService.listInterestTypes()
      setInterestTypes(response.data ?? [])
    } else if (kind === 'expense') {
      const response = await settingsService.listExpenseTypes()
      setExpenseTypes(response.data ?? [])
    } else {
      const response = await settingsService.listMaterialTypes()
      setMaterialTypes(response.data ?? [])
    }
  }

  function getTypeForm(kind: TypeKind) {
    if (kind === 'interest') {
      return interestForm
    }

    if (kind === 'expense') {
      return expenseForm
    }

    return materialForm
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
        {tenantPlan === 'premium' && (
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
              onCancel={() => setInterestForm(emptyTypeForm)}
              onChange={setInterestForm}
              onDelete={(item) => item.code && setDeletingType({ code: item.code, kind: 'interest', name: item.name })}
              onSave={() => void saveTypeData('interest')}
              title="Interest Types"
              withDuration
            />
            <TypeDataBlock
              form={expenseForm}
              isSaving={savingSection === 'expense-types'}
              items={expenseTypes}
              kind="expense"
              onCancel={() => setExpenseForm(emptyTypeForm)}
              onChange={setExpenseForm}
              onDelete={(item) => item.code && setDeletingType({ code: item.code, kind: 'expense', name: item.name })}
              onSave={() => void saveTypeData('expense')}
              title="Expense Types"
            />
            <TypeDataBlock
              form={materialForm}
              isSaving={savingSection === 'material-types'}
              items={materialTypes}
              kind="material"
              onCancel={() => setMaterialForm(emptyTypeForm)}
              onChange={setMaterialForm}
              onDelete={(item) => item.code && setDeletingType({ code: item.code, kind: 'material', name: item.name })}
              onSave={() => void saveTypeData('material')}
              title="Material Types"
            />
          </div>
        </Card>

        <Card title="Tenant Setting">
          <FormGroup columns={2}>
            <FormField id="settings-default-password" label="Default Password">
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
  form,
  isSaving,
  items,
  kind,
  onCancel,
  onChange,
  onDelete,
  onSave,
  title,
  withDuration = false,
}: {
  form: TypeForm
  isSaving: boolean
  items: DefaultTypeOption[]
  kind: TypeKind
  onCancel: () => void
  onChange: (form: TypeForm) => void
  onDelete: (item: DefaultTypeOption) => void
  onSave: () => void
  title: string
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
        <Badge tone="info">{items.length}</Badge>
      </header>
      <DataTable
        actions={(item) => !isBuiltInType(item) && item.code ? (
          <Button onClick={() => onDelete(item)} variant="danger">Delete</Button>
        ) : null}
        columns={columns}
        emptyDescription={`Create the first ${typeKindLabel(kind).toLowerCase()} for this tenant.`}
        emptyTitle={`No ${title.toLowerCase()}`}
        getItemId={(item) => item.code ?? item.id}
        getItemTitle={(item) => item.name}
        items={items}
        showEmptyStructure
      />
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
    </section>
  )
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

function getTypeKey(item: DefaultTypeOption) {
  return item.code ?? String(item.id)
}

function typeKindLabel(kind: TypeKind) {
  if (kind === 'interest') {
    return 'Interest type'
  }

  if (kind === 'expense') {
    return 'Expense type'
  }

  return 'Material type'
}
