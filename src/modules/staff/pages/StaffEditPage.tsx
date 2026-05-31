import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { ConfirmDialog } from '../../../components/organisms'
import { useTenantSession } from '../../../contexts/useTenantSession'
import { permissionCodes, type PermissionCode } from '../../auth'
import { PermissionToggleForm } from '../components/PermissionToggleForm'
import { StaffForm } from '../components/StaffForm'
import {
  emptyStaffForm,
  formToStaffPayload,
  validateStaffForm,
  type StaffFormErrors,
  type StaffFormState,
} from '../components/staffFormModel'
import { staffToForm } from '../staffFormat'
import { staffService } from '../services/staffService'
import { usePermissions } from '../../auth'

export function StaffEditPage() {
  const navigate = useNavigate()
  const { staffId } = useParams()
  const staffCode = staffId?.trim() ?? ''
  const { hasPermission } = usePermissions()
  const { currentUser, session, setSession } = useTenantSession()
  const canManagePermissions = hasPermission('update_user_admin')
  const canResetPassword = hasPermission('update_user_admin') || hasPermission('update_user_all')
  const [form, setForm] = useState<StaffFormState>(emptyStaffForm)
  const [errors, setErrors] = useState<StaffFormErrors>({})
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadStaffUser = useCallback(async (code: string) => {
    setIsLoading(true)
    setPageError(null)

    try {
      const response = await staffService.getUser(code)
      setForm(staffToForm(response.data))
      setSelectedPermissions((response.data.permissions ?? []) as PermissionCode[])
    } catch (loadError) {
      setPageError(loadError instanceof Error ? loadError.message : 'Unable to load staff account.')
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

  function updateFormField(field: keyof StaffFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handlePermissionToggle(permission: PermissionCode) {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((currentPermission) => currentPermission !== permission)
        : [...current, permission],
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateStaffForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setPageError(null)

    try {
      await staffService.updateUser(staffCode, formToStaffPayload(form))
      navigate(routePaths.staff, { state: { notice: 'Staff account updated.' } })
    } catch (saveError) {
      setPageError(saveError instanceof Error ? saveError.message : 'Unable to update staff account.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePermissionSave() {
    setIsSavingPermissions(true)
    setPageError(null)
    setNotice(null)

    try {
      const selectedPermissionSet = new Set(selectedPermissions)
      const payload = Object.fromEntries(permissionCodes.map((permission) => [permission, selectedPermissionSet.has(permission)]))
      const response = await staffService.updatePermissions(staffCode, payload)
      setSelectedPermissions((response.data.permissions ?? []) as PermissionCode[])
      setNotice('Permissions updated.')
    } catch (saveError) {
      setPageError(saveError instanceof Error ? saveError.message : 'Unable to update permissions.')
    } finally {
      setIsSavingPermissions(false)
    }
  }

  async function handleResetPasswordToDefault() {
    setIsResettingPassword(true)
    setPageError(null)
    setNotice(null)

    try {
      const response = await staffService.resetPasswordToDefault(staffCode, { logoutFromAll: true })
      setIsResetConfirmOpen(false)

      if ((currentUser?.code ?? session?.user.code) === staffCode) {
        setNotice(response.message || 'Password reset to tenant default.')
        setSession(null)
        navigate(routePaths.login, { replace: true })
        return
      }

      setNotice(response.message || 'Password reset to tenant default.')
    } catch (resetError) {
      setPageError(resetError instanceof Error ? resetError.message : 'Unable to reset password.')
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <section className="page">
      <SectionHeader
        title="Edit Staff"
        subtitle="Update account details and permission access."
        action={canResetPassword ? (
          <Button isLoading={isResettingPassword} onClick={() => setIsResetConfirmOpen(true)} variant="secondary">
            Reset password to default
          </Button>
        ) : null}
      />

      {pageError && <Alert message={pageError} onDismiss={() => setPageError(null)} title="Staff action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Staff updated" tone="success" />}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : (
        <>
          <StaffForm
            errors={errors}
            isSaving={isSaving}
            mode="edit"
            onCancel={() => navigate(routePaths.staff)}
            onChange={updateFormField}
            onSubmit={handleSubmit}
            value={form}
          />

          <PermissionToggleForm
            disabled={!canManagePermissions}
            isSaving={isSavingPermissions}
            onSave={() => void handlePermissionSave()}
            onToggle={handlePermissionToggle}
            value={selectedPermissions}
          />
        </>
      )}
      <ConfirmDialog
        confirmLabel="Reset Password"
        isLoading={isResettingPassword}
        isOpen={isResetConfirmOpen}
        message="Reset this staff account password to the tenant default and log out all sessions for this user?"
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={() => void handleResetPasswordToDefault()}
        title="Confirm password reset"
      />
    </section>
  )
}
