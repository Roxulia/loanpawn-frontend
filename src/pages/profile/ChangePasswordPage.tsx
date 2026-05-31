import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { Button, Input } from '../../components/atoms'
import { Alert } from '../../components/feedback'
import { ActionBar, Card, FormField, FormGroup, SectionHeader } from '../../components/molecules'
import { useTenantSession } from '../../contexts/useTenantSession'
import { tenantAuthService } from '../../services/tenant/authService'

type ChangePasswordForm = {
  current_password: string
  password: string
  password_confirmation: string
}

const initialForm: ChangePasswordForm = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { setSession } = useTenantSession()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordForm, string>>>({})
  const [pageError, setPageError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function updateField(field: keyof ChangePasswordForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSaving(true)
    setPageError(null)
    setNotice(null)

    try {
      const response = await tenantAuthService.changePassword(form)
      setForm(initialForm)
      setNotice(response.message || 'Password changed successfully. Sign in again with your new password.')
      window.setTimeout(() => {
        setSession(null)
        navigate(routePaths.login, { replace: true })
      }, 900)
    } catch (saveError) {
      setPageError(saveError instanceof Error ? saveError.message : 'Unable to change password.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page">
      <SectionHeader title="Change Password" subtitle="Update your password and sign in again." />

      {pageError && <Alert message={pageError} onDismiss={() => setPageError(null)} title="Password change failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Password changed" tone="success" />}

      <Card title="Password Details">
        <form className="ui-form" onSubmit={(event) => void handleSubmit(event)}>
          <FormGroup columns={1}>
            <FormField error={errors.current_password} id="current-password" label="Current password">
              <Input
                hasError={Boolean(errors.current_password)}
                id="current-password"
                onChange={(event) => updateField('current_password', event.target.value)}
                type="password"
                value={form.current_password}
              />
            </FormField>
            <FormField error={errors.password} id="new-password" label="New password">
              <Input
                hasError={Boolean(errors.password)}
                id="new-password"
                minLength={8}
                onChange={(event) => updateField('password', event.target.value)}
                type="password"
                value={form.password}
              />
            </FormField>
            <FormField error={errors.password_confirmation} id="confirm-password" label="Confirm new password">
              <Input
                hasError={Boolean(errors.password_confirmation)}
                id="confirm-password"
                minLength={8}
                onChange={(event) => updateField('password_confirmation', event.target.value)}
                type="password"
                value={form.password_confirmation}
              />
            </FormField>
          </FormGroup>
          <ActionBar>
            <Button onClick={() => navigate(routePaths.profile)} variant="secondary">
              Cancel
            </Button>
            <Button isLoading={isSaving} type="submit" variant="primary">
              Change Password
            </Button>
          </ActionBar>
        </form>
      </Card>
    </section>
  )
}

function validate(form: ChangePasswordForm) {
  const errors: Partial<Record<keyof ChangePasswordForm, string>> = {}

  if (!form.current_password.trim()) {
    errors.current_password = 'Current password is required.'
  }

  if (form.password.length < 8) {
    errors.password = 'New password must be at least 8 characters.'
  }

  if (form.password_confirmation !== form.password) {
    errors.password_confirmation = 'Password confirmation must match.'
  }

  return errors
}
