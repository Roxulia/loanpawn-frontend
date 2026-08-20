import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ActionBar, Card, SectionHeader } from '../../../components/molecules'
import type { TenantCapital } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import type { FinanceFormErrors } from '../../finance/FinanceResourcePage'
import { getNumberField } from '../../finance/financeFormat'
import { CapitalFormFields, capitalPayload, initialCapitalForm, type CapitalForm, validateCapitalForm } from './CapitalsPage'

export function CapitalCreatePage() {
  return <CapitalFormPage mode="create" />
}

export function CapitalEditPage() {
  return <CapitalFormPage mode="edit" />
}

function CapitalFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate()
  const { capitalCode = '' } = useParams()
  const [capital, setCapital] = useState<TenantCapital | null>(null)
  const [form, setForm] = useState<CapitalForm>(initialCapitalForm)
  const [errors, setErrors] = useState<FinanceFormErrors<CapitalForm>>({})
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== 'edit' || !capitalCode) return
    let active = true
    void tenantResourceService.getCapital(capitalCode).then((item) => {
      if (!active) return
      setCapital(item)
      setForm({
        account_id: String(item.account_id ?? item.accountId ?? ''),
        amount: item.amount,
        amount_unit: 'UNIT',
        description: item.description,
        reporting_exchange_rate: '',
        reporting_exchange_rate_inversed: false,
      })
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Unable to load capital record.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [capitalCode, mode])

  function updateField(field: keyof CapitalForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function save() {
    const nextErrors = validateCapitalForm(form)
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return }
    setSaving(true); setError(null)
    try {
      if (mode === 'create') await tenantResourceService.createCapital(capitalPayload(form))
      else await tenantResourceService.updateCapital(capitalCode, { ...capitalPayload(form), update_key: getNumberField(capital ?? {}, 'update_key', 'updateKey') ?? 0 })
      navigate(routePaths.capitals, { state: { notice: `Capital ${mode === 'create' ? 'created' : 'updated'} successfully.` } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save capital record.')
    } finally { setSaving(false) }
  }

  return <section className="page capital-form-page capital-form-page--mobile">
    <SectionHeader title={mode === 'create' ? 'Add Capital' : 'Edit Capital'} subtitle="Record capital against an assigned financial account." />
    {error && <Alert message={error} onDismiss={() => setError(null)} title="Capital action failed" tone="danger" />}
    <Card title="Capital details">
      {loading ? <LoadingState rows={4} /> : <form onSubmit={(event) => { event.preventDefault(); void save() }}>
        <CapitalFormFields errors={errors} form={form} isEditing={mode === 'edit'} updateField={updateField} />
        <ActionBar><Button onClick={() => navigate(routePaths.capitals)} variant="secondary">Cancel</Button><Button isLoading={saving} type="submit" variant="primary">{mode === 'create' ? 'Add Capital' : 'Save Changes'}</Button></ActionBar>
      </form>}
    </Card>
  </section>
}
