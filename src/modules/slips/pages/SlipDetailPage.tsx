import { useCallback, useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button, Input, Select } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ActionBar, Card, FinancialAmountInput, FormField, FormGroup, KeyValueList, SectionHeader } from '../../../components/molecules'
import { LocalizedText } from '../../../locales/UiLocale'
import { useFeatures, usePermissions } from '../../auth'
import { FinancialAccountSelect } from '../../financialAccounts/components/FinancialAccountSelect'
import type { FinancialUnitCode } from '../../finance/financialUnits'
import { formatDate, formatMoney, getSlipCustomerName, getStatusTone } from '../slipFormat'
import { slipService, type LoanContractSlip, type SlipCollateralItem } from '../services/slipService'

export function SlipDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { slipNo } = useParams()
  const [slip, setSlip] = useState<LoanContractSlip | null>(null)
  const [notice, setNotice] = useState<string | null>(() => getRouteNotice(location.state))
  const [isLoading, setIsLoading] = useState(true)
  const [savingAction, setSavingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [compoundEvery, setCompoundEvery] = useState('1')
  const [compoundEveryType, setCompoundEveryType] = useState('Month')
  const [nextCompoundAt, setNextCompoundAt] = useState('')
  const [principalAmount, setPrincipalAmount] = useState('')
  const [principalAmountUnit, setPrincipalAmountUnit] = useState<FinancialUnitCode>('UNIT')
  const [principalAccountId, setPrincipalAccountId] = useState('')
  const { hasEnabledFeature } = useFeatures()
  const { hasPermission } = usePermissions()
  const hasAdvancedInterestProcess = hasEnabledFeature('advanced_interest_process')
  const canManageCompoundSchedule = hasAdvancedInterestProcess && hasPermission('manage_slip_compound_schedule')
  const canCompoundInterest = hasAdvancedInterestProcess && hasPermission('compound_slip_interest')
  const canCollectPartialPrincipal = hasAdvancedInterestProcess && hasPermission('collect_partial_principal')

  const loadSlip = useCallback(async (nextSlipNo: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await slipService.getSlip(nextSlipNo)
      setSlip(response)
      setScheduleEnabled(getCompoundScheduleEnabled(response))
      setCompoundEvery(String(getCompoundEvery(response) ?? 1))
      setCompoundEveryType(getCompoundEveryType(response) ?? 'Month')
      setNextCompoundAt(toDateInputValue(getNextCompoundAt(response)))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load loan slip.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!slipNo?.trim()) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadSlip(slipNo)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadSlip, slipNo])

  useEffect(() => {
    if (getRouteNotice(location.state)) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  async function saveCompoundSchedule() {
    if (!slip) return
    await runSlipAction('compound-schedule', async () => {
      await slipService.updateCompoundSchedule(slip.slip_no, {
        slip_update_key: slip.update_key ?? 0,
        enabled: scheduleEnabled,
        compound_every: scheduleEnabled ? Number(compoundEvery) : null,
        compound_every_type: scheduleEnabled ? compoundEveryType : null,
        next_compound_at: scheduleEnabled ? nextCompoundAt : null,
      })
      await loadSlip(slip.slip_no)
    }, 'Compound schedule saved.')
  }

  async function compoundInterest() {
    if (!slip) return
    await runSlipAction('compound-interest', async () => {
      const response = await slipService.compoundInterest(slip.slip_no)
      await loadSlip(slip.slip_no)
      setNotice(`Compounded ${formatMoney(response.compounded_interest)} into principal.`)
    })
  }

  async function collectPartialPrincipal() {
    if (!slip) return
    await runSlipAction('partial-principal', async () => {
      const response = await slipService.collectPartialPrincipal(slip.slip_no, {
        slip_update_key: slip.update_key ?? 0,
        amount: Number(principalAmount),
        amount_unit: principalAmountUnit,
        accept_account_id: principalAccountId ? Number(principalAccountId) : null,
      })
      setPrincipalAmount('')
      await loadSlip(slip.slip_no)
      setNotice(`Collected ${formatMoney(response.collected_amount)}. Remaining principal is ${formatMoney(response.remaining_principal)}.`)
    })
  }

  async function runSlipAction(action: string, callback: () => Promise<void>, successNotice?: string) {
    setSavingAction(action)
    setError(null)
    setNotice(null)
    try {
      await callback()
      if (successNotice) setNotice(successNotice)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to process slip action.')
    } finally {
      setSavingAction(null)
    }
  }

  if (!slipNo?.trim()) {
    return <Navigate to={routePaths.slips} replace />
  }

  return (
    <section className="page">
      <SectionHeader
        title="Slip Detail"
        subtitle="Read-only loan contract information for lookup and audit."
        action={
          <Button onClick={() => navigate(routePaths.slips)} variant="secondary">
            Back
          </Button>
        }
      />

      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Loan slip created" tone="success" />}
      {error && <Alert message={error} onDismiss={() => setError(null)} title="Loan slip lookup failed" tone="danger" />}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : slip ? (
        <div className="workflow-stack">
          <Card
            title={slip.slip_no}
            description={slip.notes || 'No internal note recorded.'}
            action={<Badge tone={getStatusTone(slip.status)}>{slip.status}</Badge>}
          >
            <KeyValueList items={[
              { key: 'Customer', value: getSlipCustomerName(slip) },
              { key: 'Loan Amount', value: formatMoney(slip.loan_amount) },
              { key: 'Interest Rate', value: `${slip.interest_rate}%` },
              { key: 'Interest Type', value: slip.interest_type_name ?? '-' },
              { key: 'Created', value: formatDate(slip.created_at) },
              { key: 'Expire Date', value: formatDate(slip.expire_at) },
              { key: 'Expiry Quota', value: formatExpiry(slip.expiry_quota, slip.expiry_quota_type) },
              { key: 'Compound Schedule', value: getCompoundScheduleEnabled(slip) ? formatCompoundSchedule(slip) : 'Disabled' },
              { key: 'Last Compounded', value: formatDate(getLastCompoundedAt(slip)) },
            ]} />
          </Card>

          {(canCompoundInterest || canManageCompoundSchedule || canCollectPartialPrincipal) && <Card title="Advanced Interest Process" description="Manage principal and interest compounding for this slip.">
            <div className="workflow-stack">
              {(canCompoundInterest || canManageCompoundSchedule) && <section className="subform-panel">
                <header className="subform-panel__header">
                  <strong>Interest Compounding</strong>
                  <Badge tone={scheduleEnabled ? 'success' : 'info'}>{scheduleEnabled ? 'Scheduled' : 'Manual'}</Badge>
                </header>

                {canCompoundInterest && <ActionBar>
                  <Button isLoading={savingAction === 'compound-interest'} onClick={() => void compoundInterest()} variant="primary">Compound Interest</Button>
                </ActionBar>}

                {canManageCompoundSchedule && <FormGroup columns={3}>
                  <label className="accounting-schedule__toggle">
                    <input checked={scheduleEnabled} onChange={(event) => setScheduleEnabled(event.target.checked)} type="checkbox" />
                    <span>Schedule enabled</span>
                  </label>
                  <FormField id="slip-compound-every" label="Every">
                    <Input disabled={!scheduleEnabled} id="slip-compound-every" min="1" onChange={(event) => setCompoundEvery(event.target.value)} type="number" value={compoundEvery} />
                  </FormField>
                  <FormField id="slip-compound-type" label="Period">
                    <Select disabled={!scheduleEnabled} id="slip-compound-type" onChange={(event) => setCompoundEveryType(event.target.value)} value={compoundEveryType}>
                      <option value="Day">Day</option>
                      <option value="Week">Week</option>
                      <option value="Month">Month</option>
                    </Select>
                  </FormField>
                  <FormField id="slip-next-compound-at" label="Next Date">
                    <Input disabled={!scheduleEnabled} id="slip-next-compound-at" onChange={(event) => setNextCompoundAt(event.target.value)} type="date" value={nextCompoundAt} />
                  </FormField>
                  <ActionBar>
                    <Button isLoading={savingAction === 'compound-schedule'} onClick={() => void saveCompoundSchedule()} variant="secondary">Save Schedule</Button>
                  </ActionBar>
                </FormGroup>}
              </section>}

              {canCollectPartialPrincipal && <section className="subform-panel">
                <header className="subform-panel__header">
                  <strong>Principal Collection</strong>
                </header>
                <FormGroup columns={2}>
                  <FormField id="slip-partial-principal" label="Principal Amount">
                    <FinancialAmountInput
                      id="slip-partial-principal"
                      min="0.01"
                      onChange={(value) => {
                        setPrincipalAmount(value.amount)
                        setPrincipalAmountUnit(value.unit)
                      }}
                      step="0.01"
                      value={{ amount: principalAmount, unit: principalAmountUnit }}
                    />
                  </FormField>
                  <FormField id="slip-partial-principal-account" label="Account">
                    <FinancialAccountSelect
                      id="slip-partial-principal-account"
                      matchAccountId={slip.account_id ?? slip.accountId ?? null}
                      onChange={setPrincipalAccountId}
                      value={principalAccountId}
                    />
                  </FormField>
                  <ActionBar>
                    <Button disabled={!Number(principalAmount)} isLoading={savingAction === 'partial-principal'} onClick={() => void collectPartialPrincipal()} variant="primary">Collect Principal</Button>
                  </ActionBar>
                </FormGroup>
              </section>}
            </div>
          </Card>}

          <Card title="Collateral Items" description={`${(slip.items ?? []).length} item${(slip.items ?? []).length === 1 ? '' : 's'}`}>
            {(slip.items ?? []).length === 0 ? <p className="muted"><LocalizedText text="No collateral items returned." /></p> : (
              <div className="workflow-stack">
                {(slip.items ?? []).map((item) => <SlipItemCard item={item} key={item.id} />)}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Alert message="Loan slip was not found." title="No slip" tone="warning" />
      )}
    </section>
  )
}

function SlipItemCard({ item }: { item: SlipCollateralItem }) {
  const isJewellery = item.type.toLowerCase() === 'jewellery'

  return (
    <section className="subform-panel">
      <header className="subform-panel__header">
        <strong>{item.name}</strong>
        <Badge tone={item.item_status === 'active' ? 'success' : 'info'}>{item.item_status ?? '-'}</Badge>
      </header>
      <KeyValueList items={[
        { key: 'Type', value: item.type },
        { key: 'Brand', value: item.brand_name ?? '-' },
        { key: 'Quantity', value: item.quantity ?? '-' },
        { key: 'Estimated Value', value: formatMoney(item.estimated_value) },
        { key: 'Minimum Retail Price', value: formatMoney(item.minimum_retail_price) },
        { key: 'Description', value: item.description || '-' },
        ...(isJewellery ? [
          { key: 'Material', value: item.material_type_name ?? '-' },
          { key: 'Kyat', value: item.kyat ?? '-' },
          { key: 'Pal', value: item.pal ?? '-' },
          { key: 'Yway', value: item.yway ?? '-' },
        ] : [
          { key: 'Category', value: item.item_category_type_name ?? '-' },
        ]),
      ]} />
    </section>
  )
}

function formatExpiry(quota?: number, type?: string) {
  if (!quota || !type) {
    return '-'
  }

  return `${quota} ${type}${quota === 1 ? '' : 's'}`
}

function formatCompoundSchedule(slip: LoanContractSlip) {
  const every = getCompoundEvery(slip)
  const type = getCompoundEveryType(slip)
  const next = getNextCompoundAt(slip)

  return every && type ? `Every ${every} ${type}${every === 1 ? '' : 's'}, next ${formatDate(next)}` : 'Enabled'
}

function getCompoundScheduleEnabled(slip: LoanContractSlip) {
  return Boolean(slip.compound_schedule_enabled ?? slip.compoundScheduleEnabled)
}

function getCompoundEvery(slip: LoanContractSlip) {
  return slip.compound_every ?? slip.compoundEvery ?? null
}

function getCompoundEveryType(slip: LoanContractSlip) {
  return slip.compound_every_type ?? slip.compoundEveryType ?? null
}

function getNextCompoundAt(slip: LoanContractSlip) {
  return slip.next_compound_at ?? slip.nextCompoundAt ?? null
}

function getLastCompoundedAt(slip: LoanContractSlip) {
  return slip.last_compounded_at ?? slip.lastCompoundedAt ?? null
}

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : ''
}

function getRouteNotice(state: unknown) {
  if (typeof state === 'object' && state && 'notice' in state && typeof state.notice === 'string') {
    return state.notice
  }

  return null
}
