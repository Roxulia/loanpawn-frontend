import { useEffect, useMemo, useState } from 'react'
import { SearchableSelect } from '../../../components/molecules'
import { financialAccountService } from '../financialAccountService'
import type { FinancialAccount } from '../types'
import { useTenantSession } from '../../../contexts/useTenantSession'
import { usePermissions } from '../../auth'
import { useTenantCurrencies } from '../../finance/useTenantCurrencies'

type FinancialAccountSelectProps = {
  hasError?: boolean
  id: string
  locked?: boolean
  matchAccountId?: number | null
  onChange: (accountId: string) => void
  value: string
}

export function FinancialAccountSelect({ hasError = false, id, locked = false, matchAccountId, onChange, value }: FinancialAccountSelectProps) {
  const { tenantResolution } = useTenantSession()
  const { defaultCurrencyId } = useTenantCurrencies()
  const { hasPermission } = usePermissions()
  const feature = tenantResolution.status === 'resolved' ? tenantResolution.tenant.tenant_features?.multi_account_management : null
  const featureEnabled = Boolean(feature?.is_active && feature.is_enabled)
  const canSelectAccount = featureEnabled && hasPermission('list_financial_account')
  const lockedValue = locked ? value : ''
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!canSelectAccount) {
      setIsLoading(false)
      if (value && !locked) onChange('')
      return
    }
    let isCurrent = true

    void financialAccountService.list({ perPage: 100, assignedOnly: true }).then((page) => {
      if (!isCurrent) return
      setAccounts(page.items.filter((account) => (
        (account.is_active && !account.is_deleted)
        || (locked && String(account.id) === lockedValue)
      )))
      setLoadError(false)
    }).catch(() => {
      if (isCurrent) setLoadError(true)
    }).finally(() => {
      if (isCurrent) setIsLoading(false)
    })

    return () => { isCurrent = false }
  }, [canSelectAccount, locked, lockedValue])

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
    if (locked) return
    if (isLoading || options.some((account) => String(account.id) === value)) return

    if (options.length === 0) {
      if (value) onChange('')
      return
    }

    const preferred = options.find((account) => account.currency.id === defaultCurrencyId && account.is_default)
      ?? options.find((account) => account.currency.id === defaultCurrencyId)
      ?? options.find((account) => account.is_default)
      ?? options[0]
    onChange(String(preferred.id))
  }, [defaultCurrencyId, isLoading, locked, onChange, options, value])

  if (!canSelectAccount) {
    return <div className="ui-form-field__hint" id={id}>{locked ? 'The account used by this posted transaction is locked.' : 'The active default account will be used.'}</div>
  }

  return (
    <SearchableSelect
      disabled={locked}
      emptyMessage="No financial accounts found."
      error={loadError ? 'Unable to load accounts.' : null}
      getOptionDescription={(account) => `${account.currency.code} · ${Number(account.balance).toLocaleString()}`}
      getOptionLabel={(account) => account.account_name}
      getOptionValue={(account) => String(account.id)}
      hasError={hasError || loadError}
      id={id}
      isLoading={isLoading}
      loadingMessage="Loading accounts..."
      onChange={onChange}
      options={options}
      placeholder="Search financial accounts"
      value={value}
    />
  )
}
