import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Badge, Button, Input, Select } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ActionBar, Card, FormField, FormGroup, KeyValueList, SectionHeader } from '../../../components/molecules'
import { DataTable, type DataTableColumn } from '../../../components/organisms'
import { routePaths } from '../../../app/routes/paths'
import type { DebtInterestAccrual, DebtInterestCalculation, DebtPaymentHistoryItem, TenantDebt } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { useFeatures, usePermissions } from '../../auth'
import { AccountCurrencyAmount } from '../../finance/AccountCurrencyAmount'
import { formatDate, getStringField } from '../../finance/financeFormat'
import { formatDebtLink } from '../components/debtFormat'
import { formatTenantDateTime } from '../../../utils/localDateTime'

const accrualColumns: Array<DataTableColumn<DebtInterestAccrual>> = [
  { header: 'Period', key: 'period', render: (row) => `${formatTenantDateTime(row.start_period_at, row.period_timezone)} - ${formatTenantDateTime(row.end_period_at, row.period_timezone)}` },
  { header: 'Principal', key: 'principal', render: (row) => row.principal_amount },
  { header: 'Interest', key: 'interest', render: (row) => row.interest_amount },
  { header: 'Paid', key: 'paid', render: (row) => row.paid_amount },
  { header: 'Compounded', key: 'compounded', render: (row) => row.compounded_amount },
  { header: 'Outstanding', key: 'outstanding', render: (row) => row.outstanding_amount },
]

const historyColumns: Array<DataTableColumn<DebtPaymentHistoryItem>> = [
  { header: 'Payment', key: 'code', render: (row) => row.code },
  { header: 'Paid amount', key: 'amount', render: (row) => row.payment_amount },
  { header: 'Principal', key: 'principal', render: (row) => row.principal_paid },
  { header: 'Interest', key: 'interest', render: (row) => row.interest_paid },
  { header: 'Paid at', key: 'date', render: (row) => formatDate(row.payment_at) },
]

export function DebtDetailPage() {
  const navigate = useNavigate()
  const { debtCode: rawDebtCode } = useParams()
  const debtCode = rawDebtCode?.trim() ?? ''
  const { hasPermission } = usePermissions()
  const { hasEnabledFeature } = useFeatures()
  const [debt, setDebt] = useState<TenantDebt | null>(null)
  const [calculation, setCalculation] = useState<DebtInterestCalculation | null>(null)
  const [history, setHistory] = useState<DebtPaymentHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [compoundEvery, setCompoundEvery] = useState('1')
  const [compoundEveryType, setCompoundEveryType] = useState('Month')
  const [nextCompoundAt, setNextCompoundAt] = useState('')
  const [savingAction, setSavingAction] = useState<string | null>(null)

  const loadDebt = useCallback(async () => {
    if (!debtCode) return
    setIsLoading(true)
    setError(null)
    try {
      const [nextDebt, nextCalculation, nextHistory] = await Promise.all([
        tenantResourceService.getDebt(debtCode),
        tenantResourceService.calculateDebtInterest(debtCode),
        tenantResourceService.listDebtPayments(debtCode),
      ])
      setDebt(nextDebt)
      setScheduleEnabled(Boolean(nextDebt.compound_schedule_enabled ?? nextDebt.compoundScheduleEnabled))
      setCompoundEvery(String(nextDebt.compound_every ?? nextDebt.compoundEvery ?? 1))
      setCompoundEveryType(nextDebt.compound_every_type ?? nextDebt.compoundEveryType ?? 'Month')
      setNextCompoundAt(toDateInput(nextDebt.next_compound_at ?? nextDebt.nextCompoundAt))
      setCalculation(nextCalculation)
      setHistory(nextHistory)
    } catch (loadError) {
      setDebt(null)
      setCalculation(null)
      setHistory([])
      setError(loadError instanceof Error ? loadError.message : 'Unable to load debt detail.')
    } finally {
      setIsLoading(false)
    }
  }, [debtCode])

  useEffect(() => { const timer = window.setTimeout(() => void loadDebt(), 0); return () => window.clearTimeout(timer) }, [loadDebt])
  if (!debtCode) return <Navigate replace to={routePaths.debts} />

  const canManageSchedule = hasEnabledFeature('advanced_interest_process') && calculation?.compounding_enabled && hasPermission('manage_debt_compound_schedule')
  const canCompound = hasEnabledFeature('advanced_interest_process') && calculation?.compounding_enabled && hasPermission('compound_debt_interest')

  async function runAction(name: string, action: () => Promise<void>) {
    setSavingAction(name); setError(null); setNotice(null)
    try { await action() } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'Unable to update debt interest.') } finally { setSavingAction(null) }
  }

  async function saveSchedule() {
    if (!debt) return
    await runAction('schedule', async () => {
      await tenantResourceService.updateDebtCompoundSchedule(debt.code, { debt_update_key: debt.update_key ?? debt.updateKey ?? 0, enabled: scheduleEnabled, compound_every: scheduleEnabled ? Number(compoundEvery) : null, compound_every_type: scheduleEnabled ? compoundEveryType : null, next_compound_at: scheduleEnabled ? nextCompoundAt : null })
      await loadDebt(); setNotice('Debt compound schedule saved.')
    })
  }

  async function compoundInterest() {
    if (!debt) return
    await runAction('compound', async () => {
      const response = await tenantResourceService.compoundDebtInterest(debt.code)
      await loadDebt(); setNotice(`Compounded ${response.compounded_interest} into debt principal.`)
    })
  }

  return <section className="page debt-detail-page">
    <SectionHeader title="Debt Detail" subtitle={debtCode} action={<div className="row-actions"><Button onClick={() => navigate(routePaths.debts)} variant="secondary">Back</Button>{debt && !debt.is_paid && hasPermission('update_debt') && <Button onClick={() => navigate(routePaths.debtPayment(debt.code))} variant="primary">Pay Debt</Button>}</div>} />
    {error && <Alert message={error} onDismiss={() => setError(null)} title="Debt lookup failed" tone="danger" />}
    {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Debt updated" tone="success" />}
    {isLoading ? <LoadingState rows={6} /> : debt && calculation ? <>
      <DebtDetailDesktop calculation={calculation} debt={debt} />
      <DebtDetailMobile calculation={calculation} debt={debt} />
      {!debt.is_paid && calculation.apply_interest && (canManageSchedule || canCompound) && <Card title="Interest Compounding" description="Capitalize outstanding interest into the debt principal.">
        <div className="debt-compounding--desktop"><DebtCompoundingForm canCompound={Boolean(canCompound)} canManageSchedule={Boolean(canManageSchedule)} compoundEvery={compoundEvery} compoundEveryType={compoundEveryType} isSaving={savingAction} nextCompoundAt={nextCompoundAt} onCompound={() => void compoundInterest()} onEveryChange={setCompoundEvery} onNextDateChange={setNextCompoundAt} onPeriodChange={setCompoundEveryType} onSave={() => void saveSchedule()} onToggle={setScheduleEnabled} scheduleEnabled={scheduleEnabled} /></div>
        <div className="debt-compounding--mobile"><DebtCompoundingForm canCompound={Boolean(canCompound)} canManageSchedule={Boolean(canManageSchedule)} compoundEvery={compoundEvery} compoundEveryType={compoundEveryType} isSaving={savingAction} nextCompoundAt={nextCompoundAt} onCompound={() => void compoundInterest()} onEveryChange={setCompoundEvery} onNextDateChange={setNextCompoundAt} onPeriodChange={setCompoundEveryType} onSave={() => void saveSchedule()} onToggle={setScheduleEnabled} scheduleEnabled={scheduleEnabled} /></div>
      </Card>}
      <Card title="Interest Accruals"><DataTable columns={accrualColumns} emptyDescription="This debt has no interest accruals." emptyTitle="No accrued interest" getItemId={(row) => row.id} getItemTitle={(row) => `Accrual ${row.id}`} items={calculation.interest_breakdown} /></Card>
      <Card title="Payment History"><DataTable columns={historyColumns} emptyDescription="Payments will appear here." emptyTitle="No payments" getItemId={(row) => row.id} getItemTitle={(row) => row.code} items={history} /></Card>
    </> : !error && <Alert message="This debt is unavailable." title="Debt not found" tone="warning" />}
  </section>
}

function DebtDetailDesktop({ calculation, debt }: { calculation: DebtInterestCalculation; debt: TenantDebt }) {
  return <div className="debt-detail-summary--desktop"><DebtSummary calculation={calculation} debt={debt} /></div>
}

function DebtDetailMobile({ calculation, debt }: { calculation: DebtInterestCalculation; debt: TenantDebt }) {
  return <div className="debt-detail-summary--mobile"><DebtSummary calculation={calculation} debt={debt} /></div>
}

function DebtSummary({ calculation, debt }: { calculation: DebtInterestCalculation; debt: TenantDebt }) {
  return <Card title={debt.code} description={debt.description} action={<Badge tone={debt.is_paid ? 'success' : 'warning'}>{debt.is_paid ? 'Paid' : 'Unpaid'}</Badge>}>
    <KeyValueList items={[
      { key: 'Linked to', value: formatDebtLink(debt) },
      { key: 'Tag', value: debt.tag || '-' },
      { key: 'Original amount', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.original_principal} /> },
      { key: 'Principal balance', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.principal_balance} /> },
      { key: 'Accrued interest', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.outstanding_interest} /> },
      { key: 'Total outstanding', value: <AccountCurrencyAmount accountId={calculation.account_id} amount={calculation.total_outstanding} /> },
      { key: 'Interest', value: calculation.apply_interest ? `${calculation.interest_rate}% ${calculation.interest_type_name ?? ''}` : 'Not applied' },
      { key: 'Compound schedule', value: (debt.compound_schedule_enabled ?? debt.compoundScheduleEnabled) ? `${debt.compound_every ?? debt.compoundEvery} ${debt.compound_every_type ?? debt.compoundEveryType}` : 'Disabled' },
      { key: 'Last compounded', value: formatDate(debt.last_compounded_at ?? debt.lastCompoundedAt) },
      { key: 'Created', value: formatDate(getStringField(debt, 'created_at', 'createdAt')) },
      { key: 'Updated', value: formatDate(getStringField(debt, 'updated_at', 'updatedAt')) },
    ]} />
  </Card>
}

type DebtCompoundingFormProps = { canCompound: boolean; canManageSchedule: boolean; compoundEvery: string; compoundEveryType: string; isSaving: string | null; nextCompoundAt: string; scheduleEnabled: boolean; onCompound: () => void; onEveryChange: (value: string) => void; onNextDateChange: (value: string) => void; onPeriodChange: (value: string) => void; onSave: () => void; onToggle: (value: boolean) => void }

function DebtCompoundingForm(props: DebtCompoundingFormProps) {
  return <div className="workflow-stack">
    {props.canCompound && <ActionBar><Button isLoading={props.isSaving === 'compound'} onClick={props.onCompound} variant="primary">Compound Interest</Button></ActionBar>}
    {props.canManageSchedule && <FormGroup columns={3}>
      <label className="accounting-schedule__toggle"><input checked={props.scheduleEnabled} onChange={(event) => props.onToggle(event.target.checked)} type="checkbox" /><span>Schedule enabled</span></label>
      <FormField id="debt-compound-every" label="Every"><Input disabled={!props.scheduleEnabled} id="debt-compound-every" min="1" onChange={(event) => props.onEveryChange(event.target.value)} type="number" value={props.compoundEvery} /></FormField>
      <FormField id="debt-compound-period" label="Period"><Select disabled={!props.scheduleEnabled} id="debt-compound-period" onChange={(event) => props.onPeriodChange(event.target.value)} value={props.compoundEveryType}><option value="Day">Day</option><option value="Week">Week</option><option value="Month">Month</option></Select></FormField>
      <FormField id="debt-next-compound" label="Next Date"><Input disabled={!props.scheduleEnabled} id="debt-next-compound" onChange={(event) => props.onNextDateChange(event.target.value)} type="date" value={props.nextCompoundAt} /></FormField>
      <ActionBar><Button isLoading={props.isSaving === 'schedule'} onClick={props.onSave} variant="secondary">Save Schedule</Button></ActionBar>
    </FormGroup>}
  </div>
}

function toDateInput(value?: string | null) { return value ? value.slice(0, 10) : '' }
