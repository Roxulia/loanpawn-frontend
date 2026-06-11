import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Button } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { SectionHeader } from '../../../components/molecules'
import { Modal } from '../../../components/organisms'
import type { TenantUserCreateResponse } from '../../../dataobjects/tenant/staff'
import { StaffForm } from '../components/StaffForm'
import {
  emptyStaffForm,
  formToStaffPayload,
  validateStaffForm,
  type StaffFormErrors,
  type StaffFormState,
} from '../components/staffFormModel'
import { staffService } from '../services/staffService'

export function StaffCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<StaffFormState>(emptyStaffForm)
  const [errors, setErrors] = useState<StaffFormErrors>({})
  const [pageError, setPageError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [createdUser, setCreatedUser] = useState<TenantUserCreateResponse | null>(null)

  function updateFormField(field: keyof StaffFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
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
      const created = await staffService.createUser(formToStaffPayload(form))
      setCreatedUser(created)
    } catch (saveError) {
      setPageError(saveError instanceof Error ? saveError.message : 'Unable to create staff account.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleCreatedUserModalClose() {
    navigate(routePaths.staff, { state: { notice: 'Staff account created.' } })
  }

  return (
    <section className="page">
      <SectionHeader title="Add Staff" subtitle="Create a staff account for this tenant." />

      <StaffForm
        errors={errors}
        isSaving={isSaving}
        mode="create"
        onCancel={() => navigate(routePaths.staff)}
        onChange={updateFormField}
        onSubmit={handleSubmit}
        operationAlert={pageError ? <Alert message={pageError} onDismiss={() => setPageError(null)} title="Create failed" tone="danger" /> : null}
        value={form}
      />

      <Modal
        footer={
          <Button onClick={handleCreatedUserModalClose} variant="primary">
            Back to Staff
          </Button>
        }
        isOpen={Boolean(createdUser)}
        onClose={handleCreatedUserModalClose}
        title="Staff account created"
      >
        {createdUser && (
          <div className="detail-list">
            <ul>
              <li>
                <span>Name</span>
                <strong>{createdUser.name}</strong>
              </li>
              <li>
                <span>Username</span>
                <strong>{createdUser.username}</strong>
              </li>
              <li>
                <span>Email</span>
                <strong>{createdUser.email}</strong>
              </li>
              <li>
                <span>Role</span>
                <strong>{createdUser.roleName}</strong>
              </li>
              <li>
                <span>Password</span>
                <strong>{createdUser.password}</strong>
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </section>
  )
}
