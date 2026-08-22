import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { ConfirmDialog } from '../../../components/organisms'
import { useTenantSession } from '../../../contexts/useTenantSession'
import type { TenantRoleOption } from '../../../dataobjects/tenant/staff'
import { UnauthorizedPage } from '../../../pages/UnauthorizedPage'
import { permissionCodes, type PermissionCode } from '../../auth'
import { PermissionToggleForm } from '../components/PermissionToggleForm'
import { FinancialAccountAssignmentForm } from '../components/FinancialAccountAssignmentForm'
import { financialAccountService } from '../../financialAccounts/financialAccountService'
import type { FinancialAccount } from '../../financialAccounts/types'
import { StaffForm } from '../components/StaffForm'
import {
  emptyStaffForm,
  formToStaffPayload,
  validateStaffForm,
  type StaffFormErrors,
  type StaffFormState,
} from '../components/staffFormModel'
import { getUserRoleName, staffToForm } from '../staffFormat'
import { staffService } from '../services/staffService'
import { usePermissions } from '../../auth'

export function StaffEditPage() {
  const navigate = useNavigate()
  const { staffId } = useParams()
  const staffCode = staffId?.trim() ?? ''
  const { hasPermission } = usePermissions()
  const { currentUser, session, setSession } = useTenantSession()
  const [targetRoleName, setTargetRoleName] = useState('')
  const isAdminTarget = targetRoleName.toLowerCase() === 'admin'
  const isOwnerTarget = targetRoleName.toLowerCase() === 'owner'
  const isSelfTarget = (currentUser?.code ?? session?.user.code) === staffCode
  const canEditOwnProfile = isSelfTarget && hasPermission('update_user_self')
  const canEditRegularStaff = hasPermission('update_user_info')
  const canEditAdmin = hasPermission('update_admin_user')
  const hasPotentialEditAccess = canEditOwnProfile || canEditRegularStaff || canEditAdmin
  const canEditTarget = isOwnerTarget
    ? isSelfTarget
    : isSelfTarget
      ? canEditOwnProfile
      : isAdminTarget
      ? hasPermission('update_admin_user')
      : canEditRegularStaff
  const canManageRole = !isSelfTarget && !isOwnerTarget && canEditTarget && hasPermission('update_user_roles')
  const canManagePermissions = !isSelfTarget && !isOwnerTarget && canEditTarget && hasPermission('assign_permission')
  const canResetPassword = canEditTarget
  const canManageFinancialAccounts = !isSelfTarget && !isOwnerTarget && canEditTarget && hasPermission('manage_financial_account_assignments')
  const [form, setForm] = useState<StaffFormState>(emptyStaffForm)
  const [initialForm, setInitialForm] = useState<StaffFormState>(emptyStaffForm)
  const [errors, setErrors] = useState<StaffFormErrors>({})
  const [roleOptions, setRoleOptions] = useState<TenantRoleOption[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionCode[]>([])
  const [initialPermissions, setInitialPermissions] = useState<PermissionCode[]>([])
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([])
  const [selectedFinancialAccountIds, setSelectedFinancialAccountIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)
  const [isLoadingFinancialAccounts, setIsLoadingFinancialAccounts] = useState(false)
  const [isSavingFinancialAccounts, setIsSavingFinancialAccounts] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadStaffUser = useCallback(async (code: string) => {
    setIsLoading(true)
    setPageError(null)

    try {
      const response = await staffService.getUser(code)
      const nextForm = staffToForm(response)
      const nextFormWithRole = {
        ...nextForm,
        role_id: roleOptions.length > 0 && !roleOptions.some((role) => String(role.role_id) === nextForm.role_id) ? '' : nextForm.role_id,
      }
      setForm(nextFormWithRole)
      setInitialForm(nextFormWithRole)
      setTargetRoleName(getUserRoleName(response))
      const loadedPermissions = (response.permissions ?? []) as PermissionCode[]
      setSelectedPermissions(loadedPermissions)
      setInitialPermissions(loadedPermissions)
      setSelectedFinancialAccountIds((response.financial_accounts ?? []).map((account) => account.id))
      setFinancialAccounts((current) => {
        const knownIds = new Set(current.map(({ id }) => id))
        return [...current, ...(response.financial_accounts ?? []).filter(({ id }) => !knownIds.has(id)) as FinancialAccount[]]
      })
    } catch (loadError) {
      setPageError(loadError instanceof Error ? loadError.message : 'Unable to load staff account.')
    } finally {
      setIsLoading(false)
    }
  }, [roleOptions])

  const loadFinancialAccounts = useCallback(async () => {
    setIsLoadingFinancialAccounts(true)
    try {
      const response = await financialAccountService.list({ perPage: 100 })
      setFinancialAccounts(response.items)
    } catch (loadError) {
      setPageError(loadError instanceof Error ? loadError.message : 'Unable to load financial accounts.')
    } finally {
      setIsLoadingFinancialAccounts(false)
    }
  }, [])

  const loadRoleOptions = useCallback(async () => {
    setIsLoadingRoles(true)

    try {
      const roles = await staffService.listRoles()
      setRoleOptions(roles)
      setForm((current) => ({
        ...current,
        role_id: current.role_id && roles.some((role) => String(role.role_id) === current.role_id) ? current.role_id : '',
      }))
      setInitialForm((current) => ({
        ...current,
        role_id: current.role_id && roles.some((role) => String(role.role_id) === current.role_id) ? current.role_id : '',
      }))
    } catch (loadError) {
      setPageError(loadError instanceof Error ? loadError.message : 'Unable to load staff roles.')
    } finally {
      setIsLoadingRoles(false)
    }
  }, [])

  useEffect(() => {
    if (!hasPotentialEditAccess) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadRoleOptions()
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [hasPotentialEditAccess, loadRoleOptions])

  useEffect(() => {
    if (!canManageFinancialAccounts) {
      return
    }

    const loadTimer = window.setTimeout(() => { void loadFinancialAccounts() }, 0)
    return () => window.clearTimeout(loadTimer)
  }, [canManageFinancialAccounts, loadFinancialAccounts])

  useEffect(() => {
    if (!staffCode || !hasPotentialEditAccess) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadStaffUser(staffCode)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [hasPotentialEditAccess, loadStaffUser, staffCode])

  if (!staffCode) {
    return <Navigate to={routePaths.staff} replace />
  }

  if (!hasPotentialEditAccess || (!isLoading && !canEditTarget)) {
    return <UnauthorizedPage />
  }

  function updateFormField<K extends keyof StaffFormState>(field: K, value: StaffFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleReset() {
    setForm(initialForm)
    setErrors({})
    setPageError(null)
  }

  function handleFinancialAccountToggle(accountId: number) {
    setSelectedFinancialAccountIds((current) => current.includes(accountId) ? current.filter((id) => id !== accountId) : [...current, accountId])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canEditTarget) {
      setPageError('You do not have permission to update this staff account.')
      return
    }

    const nextErrors = validateStaffForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setPageError(null)

    try {
      await staffService.updateUser(staffCode, formToStaffPayload(form, { includeRole: canManageRole }))
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
      const savedPermissions = (response.permissions ?? []) as PermissionCode[]
      setSelectedPermissions(savedPermissions)
      setInitialPermissions(savedPermissions)
      setNotice('Permissions updated.')
    } catch (saveError) {
      setPageError(saveError instanceof Error ? saveError.message : 'Unable to update permissions.')
    } finally {
      setIsSavingPermissions(false)
    }
  }

  async function handleFinancialAccountSave() {
    if (!canManageFinancialAccounts) return
    setIsSavingFinancialAccounts(true)
    setPageError(null)
    setNotice(null)
    try {
      const response = await staffService.updateFinancialAccountAssignments(staffCode, selectedFinancialAccountIds)
      setSelectedFinancialAccountIds(response.financial_accounts.map((account) => account.id))
      setNotice('Financial account access updated.')
    } catch (saveError) {
      setPageError(saveError instanceof Error ? saveError.message : 'Unable to update financial account access.')
    } finally {
      setIsSavingFinancialAccounts(false)
    }
  }

  async function handleResetPasswordToDefault() {
    if (!canResetPassword) return

    setIsResettingPassword(true)
    setPageError(null)
    setNotice(null)

    try {
      const response = await staffService.resetPasswordToDefault(staffCode, { logoutFromAll: true })
      setIsResetConfirmOpen(false)
      const resetMessage = response?.message || 'Password reset to tenant default.'

      if ((currentUser?.code ?? session?.user.code) === staffCode) {
        setNotice(resetMessage)
        setSession(null)
        navigate(routePaths.login, { replace: true })
        return
      }

      setNotice(resetMessage)
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
        action={(
          <Button
            disabled={isLoading || !canResetPassword}
            isLoading={isResettingPassword}
            onClick={() => setIsResetConfirmOpen(true)}
            title={canResetPassword ? 'Reset password to default' : 'You do not have permission to reset this password.'}
            variant="secondary"
          >
            Reset password to default
          </Button>
        )}
        titlePrefix={<Link className="ui-text-link" to={routePaths.staff}>Go back</Link>}
      />

      {pageError && <Alert message={pageError} onDismiss={() => setPageError(null)} title="Staff action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Staff updated" tone="success" />}

      {isLoading ? (
        <LoadingState rows={5} />
      ) : (
        <>
          <StaffForm
            disabled={!canEditTarget}
            errors={errors}
            isLoadingRoles={isLoadingRoles}
            isSaving={isSaving}
            isRoleOptionDisabled={(role) => {
              if (String(role.role_id) === initialForm.role_id) return false
              if (!canManageRole || role.role_name.toLowerCase() === 'owner') return true
              return role.role_name.toLowerCase() === 'admin' ? !canEditAdmin : !canEditRegularStaff
            }}
            mode="edit"
            onChange={updateFormField}
            onReset={handleReset}
            onSubmit={handleSubmit}
            roleOptions={roleOptions}
            roleDisabled={!canManageRole}
            value={form}
          />

          <PermissionToggleForm
            disabled={!canManagePermissions}
            initialValue={initialPermissions}
            isSaving={isSavingPermissions}
            onChange={setSelectedPermissions}
            onSave={() => void handlePermissionSave()}
            value={selectedPermissions}
          />

          <FinancialAccountAssignmentForm
            accounts={financialAccounts}
            disabled={!canManageFinancialAccounts}
            isLoading={isLoadingFinancialAccounts}
            isSaving={isSavingFinancialAccounts}
            onSave={() => void handleFinancialAccountSave()}
            onToggle={handleFinancialAccountToggle}
            protectedReason={isOwnerTarget ? 'Owner account access is managed automatically and cannot be changed.' : isSelfTarget ? 'You cannot change your own financial account access.' : null}
            readOnly={!canManageFinancialAccounts}
            selectedAccountIds={selectedFinancialAccountIds}
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
