import { useEffect, useMemo, useState } from 'react'
import { Select } from '../../../components/atoms'
import { financialAccountService } from '../financialAccountService'
import type { FinancialAccount } from '../types'
import { useTenantSession } from '../../../contexts/useTenantSession'
import { usePermissions } from '../../auth'

type FinancialAccountSelectProps = {
  hasError?: boolean
  id: string
  matchAccountId?: number | null
  onChange: (accountId: string) => void
  value: string
}

export function FinancialAccountSelect({ hasError = false, id, matchAccountId, onChange, value }: FinancialAccountSelectProps) {
  const { tenantResolution } = useTenantSession()
  const { hasPermission } = usePermissions()
  const feature = tenantResolution.status === 'resolved' ? tenantResolution.tenant.tenant_features?.multi_account_management : null
  const featureEnabled = Boolean(feature?.is_active && feature.is_enabled)
  const canSelectAccount = featureEnabled && hasPermission('list_financial_account')
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!canSelectAccount) {
      setIsLoading(false)
      if (value) onChange('')
      return
    }
    let isCurrent = true

    void financialAccountService.list({ perPage: 100 }).then((page) => {
      if (!isCurrent) return
      setAccounts(page.items.filter((account) => account.is_active && !account.is_deleted))
      setLoadError(false)
    }).catch(() => {
      if (isCurrent) setLoadError(true)
    }).finally(() => {
      if (isCurrent) setIsLoading(false)
    })

    return () => { isCurrent = false }
  }, [canSelectAccount])

  const matchingCurrencyId = matchAccountId
    ? accounts.find((account) => account.id === matchAccountId)?.currency.id
    : undefined
  const options = useMemo(
    () => matchAccountId == null
      ? accounts
      : matchingCurrencyId === undefined
        ? []
        : accounts.filter((account) => account.currency.id === matchingCurrencyId),
    [accounts, matchAccountId, matchingCurrencyId],
  )

  useEffect(() => {
    if (isLoading || options.some((account) => String(account.id) === value)) return

    if (options.length === 0) {
      if (value) onChange('')
      return
    }

    const preferred = options.find((account) => account.is_default) ?? options[0]
    onChange(String(preferred.id))
  }, [isLoading, onChange, options, value])

  if (!canSelectAccount) {
    return <div className="ui-form-field__hint" id={id}>The active default account will be used.</div>
  }

  return (
    <Select disabled={isLoading || loadError || options.length === 0} hasError={hasError || loadError} id={id} onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="">{isLoading ? 'Loading accounts...' : loadError ? 'Unable to load accounts' : 'Select account'}</option>
      {options.map((account) => (
        <option key={account.id} value={account.id}>
          {account.account_name} · {account.account_code} · {account.currency.code} {Number(account.balance).toLocaleString()}
        </option>
      ))}
    </Select>
  )
}
