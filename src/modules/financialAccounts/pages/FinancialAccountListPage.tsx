import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { CirclePlusIcon, EditIcon, TrashIcon } from '../../../components/icons/icon'
import { Card, SearchField, SectionHeader, TableToolbar } from '../../../components/molecules'
import { ConfirmDialog, DataTable, type DataTableColumn } from '../../../components/organisms'
import { usePermissions } from '../../auth'
import { financialAccountService } from '../financialAccountService'
import type { FinancialAccount, FinancialAccountPage } from '../types'

const emptyPage: FinancialAccountPage = { items: [], current_page: 1, last_page: 1, per_page: 15, total: 0 }

export function FinancialAccountListPage() {
  const navigate = useNavigate(); const location = useLocation(); const { hasPermission } = usePermissions()
  const [page, setPage] = useState(emptyPage); const [pageNumber, setPageNumber] = useState(1); const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false); const [deleting, setDeleting] = useState(false); const [target, setTarget] = useState<FinancialAccount | null>(null)
  const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(() => routeNotice(location.state))
  const load = useCallback(async () => { setLoading(true); setError(null); try { setPage(await financialAccountService.list({ page: pageNumber, search: search.trim() || undefined })) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load financial accounts.') } finally { setLoading(false) } }, [pageNumber, search])
  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer) }, [load])
  useEffect(() => { if (routeNotice(location.state)) navigate(location.pathname, { replace: true, state: null }) }, [location, navigate])
  async function remove() { if (!target) return; setDeleting(true); try { await financialAccountService.delete(target.account_code); setTarget(null); setNotice('Financial account deleted.'); await load() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete financial account.') } finally { setDeleting(false) } }
  const columns: Array<DataTableColumn<FinancialAccount>> = [
    { header: 'Account', key: 'account', render: (item) => <><strong>{item.account_name}</strong><div>{item.account_code}</div></> },
    { header: 'Type', key: 'type', render: (item) => item.account_type.name },
    { header: 'Currency', key: 'currency', render: (item) => item.currency.code },
    { header: 'Balance', key: 'balance', render: (item) => `${item.currency.symbol ?? item.currency.code} ${Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { header: 'Status', key: 'status', render: (item) => <>{item.is_default && <Badge tone="info">Default</Badge>} <Badge tone={item.is_active ? 'success' : 'warning'}>{item.is_active ? 'Active' : 'Inactive'}</Badge></> },
  ]

  return <section className="page">
    <SectionHeader title="Financial Accounts" subtitle="Manage cash, bank, and online payment balances." action={<div className="row-actions">{hasPermission('transfer_financial_account') && <Button onClick={() => navigate(routePaths.financialAccountTransfer)} variant="secondary">Transfer</Button>}{hasPermission('create_financial_account') && <Button leftIcon={<CirclePlusIcon />} onClick={() => navigate(routePaths.financialAccountCreate)} variant="primary">Add Account</Button>}</div>} />
    <Card title="Accounts" description={`${page.total} financial account${page.total === 1 ? '' : 's'}`}>
      {error && <Alert message={error} onDismiss={() => setError(null)} title="Account action failed" tone="danger" />}{notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Accounts updated" tone="success" />}
      <TableToolbar actions={<Button onClick={() => void load()}>Refresh</Button>} search={<SearchField id="financial-account-search" label="Search accounts" placeholder="Code, name, or account number" value={search} onChange={(event) => { setSearch(event.target.value); setPageNumber(1) }} />} />
      <DataTable items={page.items} columns={columns} isLoading={loading} getItemId={(item) => item.id} getItemTitle={(item) => item.account_name} emptyTitle="No financial accounts" pagination={{ currentPage: page.current_page, lastPage: page.last_page, total: page.total, onPrevious: () => setPageNumber((current) => Math.max(1, current - 1)), onNext: () => setPageNumber((current) => Math.min(page.last_page, current + 1)) }} actions={(item) => <div className="row-actions">{hasPermission('update_financial_account') && <Button aria-label={`Edit ${item.account_name}`} className="ui-button--icon" onClick={() => navigate(routePaths.financialAccountEdit(item.account_code))}><EditIcon /></Button>}{hasPermission('delete_financial_account') && !item.is_default && <Button aria-label={`Delete ${item.account_name}`} className="ui-button--icon" variant="danger" onClick={() => setTarget(item)}><TrashIcon /></Button>}</div>} />
    </Card>
    <ConfirmDialog title="Delete financial account" message={`Delete ${target?.account_name ?? 'this account'}? Transaction history will be retained.`} confirmLabel="Delete" isOpen={Boolean(target)} isLoading={deleting} onCancel={() => setTarget(null)} onConfirm={() => void remove()} />
  </section>
}

function routeNotice(state: unknown) { return typeof state === 'object' && state !== null && 'notice' in state && typeof state.notice === 'string' ? state.notice : null }
