import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { CirclePlusIcon, EditIcon, TrashIcon } from '../../../components/icons/icon'
import { Card, SearchField, SectionHeader, TableToolbar } from '../../../components/molecules'
import { ConfirmDialog, DataTable, type DataTableColumn } from '../../../components/organisms'
import type { TenantUser } from '../../../dataobjects/tenant/auth'
import { usePermissions } from '../../auth'
import { getUserRoleName } from '../staffFormat'
import { staffService } from '../services/staffService'

export function StaffListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('create_user')
  const canDelete = hasPermission('delete_user')
  const canUpdate = hasPermission('update_user_admin') || hasPermission('update_user_all')
  const [users, setUsers] = useState<TenantUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(() => getRouteNotice(location.state))
  const [userToDelete, setUserToDelete] = useState<TenantUser | null>(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await staffService.listUsers()
      setUsers(response.data.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load staff users.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (getRouteNotice(location.state)) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadUsers()
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadUsers])

  const filteredUsers = users.filter((user) => {
    const haystack = `${user.name} ${user.username} ${user.email ?? ''} ${user.phone} ${getUserRoleName(user)}`.toLowerCase()

    return haystack.includes(searchTerm.trim().toLowerCase())
  })

  const columns: Array<DataTableColumn<TenantUser>> = [
    { header: 'Name', key: 'name', render: (user) => <strong>{user.name}</strong> },
    { header: 'Username', key: 'username', render: (user) => user.username },
    { header: 'Phone', key: 'phone', render: (user) => user.phone },
    { header: 'Role', key: 'role', render: (user) => <Badge tone="info">{getUserRoleName(user)}</Badge> },
    { header: 'Status', key: 'status', render: (user) => <Badge tone={user.status === 'active' ? 'success' : 'warning'}>{user.status}</Badge> },
  ]

  async function handleDelete() {
    if (!userToDelete) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await staffService.deleteUser(userToDelete.code)
      setNotice('Staff account deactivated.')
      setUserToDelete(null)
      await loadUsers()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to deactivate staff account.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="page">
      <SectionHeader
        title="Staff"
        subtitle="Manage tenant user accounts and their permissions."
        action={
          canCreate ? (
            <Button leftIcon={<CirclePlusIcon />} onClick={() => navigate(routePaths.staffCreate)} variant="primary">
              Add Staff
            </Button>
          ) : null
        }
      />

      <Card title="Staff accounts" description={`${users.length} active account${users.length === 1 ? '' : 's'}`}>
        <div className="customer-management">
          {error && <Alert message={error} onDismiss={() => setError(null)} title="Staff action failed" tone="danger" />}
          {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Staff updated" tone="success" />}

          <TableToolbar
            actions={
              <Button onClick={() => void loadUsers()} variant="secondary">
                Refresh
              </Button>
            }
            search={
              <SearchField
                id="staff-search"
                label="Search staff"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Name, username, phone, or role"
                value={searchTerm}
              />
            }
          />

          <DataTable
            actions={(user) => (
              <div className="row-actions">
                {canUpdate && (
                  <Button
                    aria-label={`Edit ${user.name}`}
                    className="ui-button--icon"
                    onClick={() => navigate(routePaths.staffEdit(user.code))}
                    title="Edit staff"
                    variant="secondary"
                  >
                    <EditIcon />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    aria-label={`Deactivate ${user.name}`}
                    className="ui-button--icon"
                    onClick={() => setUserToDelete(user)}
                    title="Deactivate staff"
                    variant="danger"
                  >
                    <TrashIcon />
                  </Button>
                )}
              </div>
            )}
            columns={columns}
            emptyDescription="Create the first staff account."
            emptyTitle="No staff accounts"
            getItemId={(user) => user.id}
            getItemTitle={(user) => user.name}
            isLoading={isLoading}
            items={filteredUsers}
            onRowClick={(user) => navigate(routePaths.staffDetail(user.code))}
          />
        </div>
      </Card>

      <ConfirmDialog
        confirmLabel="Deactivate"
        isLoading={isDeleting}
        isOpen={Boolean(userToDelete)}
        message={`Deactivate ${userToDelete?.name ?? 'this staff account'}?`}
        onCancel={() => setUserToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Confirm staff deactivation"
      />
    </section>
  )
}

function getRouteNotice(state: unknown) {
  if (typeof state === 'object' && state !== null && 'notice' in state && typeof state.notice === 'string') {
    return state.notice
  }

  return null
}
