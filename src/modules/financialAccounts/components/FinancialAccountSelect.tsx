import { useEffect, useMemo, useState } from 'react'
import { Select } from '../../../components/atoms'
import { financialAccountService } from '../financialAccountService'
import type { FinancialAccount } from '../types'

type FinancialAccountSelectProps = {
  hasError?: boolean
  id: string
  matchAccountId?: number | null
  onChange: (accountId: string) => void
  value: string
}

export function FinancialAccountSelect({ hasError = false, id, matchAccountId, onChange, value }: FinancialAccountSelectProps) {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
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
  }, [])

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

  return (
    <Select disabled={isLoading || loadError || options.length === 0} hasError={hasError || loadError} id={id} onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="">{isLoading ? 'Loading accounts...' : loadError ? 'Unable to load accounts' : 'Select account'}</option>
      {options.map((account) => (
        <option key={account.id} value={account.id}>
          {account.account_name} · {account.account_code} · {account.currency.code}
        </option>
      ))}
    </Select>
  )
}
