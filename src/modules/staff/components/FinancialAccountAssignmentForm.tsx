import { useMemo, useState } from 'react'
import { Button, Input } from '../../../components/atoms'
import { ActionBar, Card } from '../../../components/molecules'
import { useUiLocale } from '../../../locales/UiLocale'
import type { FinancialAccount, FinancialAccountSummary } from '../../financialAccounts/types'
import './financialAccountAssignments.css'

type Props = {
  accounts: Array<FinancialAccount | FinancialAccountSummary>
  disabled?: boolean
  isLoading?: boolean
  isSaving?: boolean
  onSave?: () => void
  onToggle?: (accountId: number) => void
  readOnly?: boolean
  selectedAccountIds: number[]
  protectedReason?: string | null
}

export function FinancialAccountAssignmentForm({ accounts, disabled = false, isLoading = false, isSaving = false, onSave, onToggle, readOnly = false, selectedAccountIds, protectedReason }: Props) {
  const { t } = useUiLocale()
  const selected = new Set(selectedAccountIds)
  const [search, setSearch] = useState('')
  const visibleAccounts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query ? accounts.filter((account) => `${account.account_name} ${account.account_code} ${account.currency.code}`.toLowerCase().includes(query)) : accounts
  }, [accounts, search])

  return (
    <Card title={t('Financial Account Access')} description={t('Choose which accounts this staff member can use for financial operations.')}>
      {protectedReason && <p className="financial-account-assignment__notice">{t(protectedReason)}</p>}
      {accounts.length > 0 && <div className="financial-account-assignment__search"><label htmlFor="financial-account-assignment-search">{t('Search')}</label><Input id="financial-account-assignment-search" onChange={(event) => setSearch(event.target.value)} placeholder={t('Account name, code, or currency')} value={search} /></div>}
      {isLoading ? (
        <p>{t('Loading financial accounts...')}</p>
      ) : accounts.length === 0 ? (
        <p>{t('No financial accounts are available.')}</p>
      ) : visibleAccounts.length === 0 ? (
        <p>{t('No financial accounts match your search.')}</p>
      ) : (
        <>
          <FinancialAccountAssignmentDesktop accounts={visibleAccounts} disabled={disabled || readOnly || isSaving} onToggle={onToggle} selected={selected} />
          <FinancialAccountAssignmentMobile accounts={visibleAccounts} disabled={disabled || readOnly || isSaving} onToggle={onToggle} selected={selected} />
        </>
      )}
      {!readOnly && onSave && (
        <ActionBar>
          <Button disabled={disabled || isLoading} isLoading={isSaving} onClick={onSave} variant="primary">
            {t('Save Account Access')}
          </Button>
        </ActionBar>
      )}
    </Card>
  )
}

function FinancialAccountAssignmentDesktop({ accounts, disabled, onToggle, selected }: AssignmentListProps) {
  const { t } = useUiLocale()
  return <div className="financial-account-assignment--desktop"><table><thead><tr><th>{t('Account')}</th><th>{t('Currency')}</th><th>{t('Status')}</th><th>{t('Access')}</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id}><td><strong>{account.account_name}</strong><small>{account.account_code}</small></td><td>{account.currency.code}</td><td>{t(account.is_active ? 'Active' : 'Inactive')}</td><td><AssignmentToggle account={account} disabled={disabled} onToggle={onToggle} selected={selected} /></td></tr>)}</tbody></table></div>
}

function FinancialAccountAssignmentMobile({ accounts, disabled, onToggle, selected }: AssignmentListProps) {
  const { t } = useUiLocale()
  return <div className="financial-account-assignment--mobile">{accounts.map((account) => <article className="financial-account-assignment-card" key={account.id}><div><strong>{account.account_name}</strong><span>{account.account_code} · {account.currency.code}</span><small>{t(account.is_active ? 'Active' : 'Inactive')}</small></div><AssignmentToggle account={account} disabled={disabled} onToggle={onToggle} selected={selected} /></article>)}</div>
}

type AssignmentListProps = { accounts: Array<FinancialAccount | FinancialAccountSummary>; disabled: boolean; onToggle?: (accountId: number) => void; selected: Set<number> }
function AssignmentToggle({ account, disabled, onToggle, selected }: { account: FinancialAccount | FinancialAccountSummary } & Omit<AssignmentListProps, 'accounts'>) {
  const { t } = useUiLocale()
  const isSelected = selected.has(account.id)
  return <button aria-pressed={isSelected} className={isSelected ? 'financial-account-assignment-toggle is-active' : 'financial-account-assignment-toggle'} disabled={disabled} onClick={() => onToggle?.(account.id)} type="button">{t(isSelected ? 'Assigned' : 'Not assigned')}</button>
}
