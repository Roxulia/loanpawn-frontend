import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { Card, KeyValueList, SectionHeader } from '../../../components/molecules'
import type { TenantUser } from '../../../dataobjects/tenant/auth'
import { usePermissions, type PermissionCode } from '../../auth'
import { PermissionToggleForm } from '../components/PermissionToggleForm'
import { formatValue, getUserRoleName } from '../staffFormat'
import { staffService } from '../services/staffService'

export function StaffDetailPage() {
  const navigate = useNavigate()
  const { staffId } = useParams()
  const staffCode = staffId?.trim() ?? ''
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission('update_user_admin') || hasPermission('update_user_all')
  const [staffUser, setStaffUser] = useState<TenantUser | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStaffUser = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await staffService.getUser(code)
      setStaffUser(response.data)
      setSelectedPermissions((response.data.permissions ?? []) as PermissionCode[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load staff account.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!staffCode) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadStaffUser(staffCode)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadStaffUser, staffCode])

  if (!staffCode) {
    return <Navigate to={routePaths.staff} replace />
  }

  return (
    <section className="page">
      <SectionHeader
        title="Staff Detail"
        subtitle="Review account details and permission access."
        action={
          <div className="row-actions">
            <Button onClick={() => navigate(routePaths.staff)} variant="secondary">
              Back
            </Button>
            {canEdit && (
              <Button onClick={() => navigate(routePaths.staffEdit(staffCode))} variant="primary">
                Edit
              </Button>
            )}
          </div>
        }
      />

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Staff action failed" tone="danger" />}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : staffUser ? (
        <>
          <Card
            title={staffUser.name}
            description={staffUser.email ?? 'No email recorded.'}
            action={<Badge tone={staffUser.status === 'active' ? 'success' : 'warning'}>{staffUser.status}</Badge>}
          >
            <KeyValueList
              items={[
                { key: 'Username', value: staffUser.username },
                { key: 'Role', value: getUserRoleName(staffUser) },
                { key: 'Phone', value: staffUser.phone },
                { key: 'NRC', value: staffUser.nrc },
                { key: 'Address', value: formatValue(staffUser.address) },
              ]}
            />
          </Card>

          <PermissionToggleForm
            readOnly
            value={selectedPermissions}
          />
        </>
      ) : (
        <Alert message="Staff account was not found." title="No staff account" tone="warning" />
      )}
    </section>
  )
}
