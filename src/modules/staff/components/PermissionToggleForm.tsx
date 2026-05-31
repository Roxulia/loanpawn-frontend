import { Button } from '../../../components/atoms'
import { ActionBar, Card } from '../../../components/molecules'
import type { PermissionCode } from '../../auth'
import { permissionGroups } from '../permissionLabels'

type PermissionToggleFormProps = {
  disabled?: boolean
  isSaving?: boolean
  onSave?: () => void
  onToggle?: (permission: PermissionCode) => void
  readOnly?: boolean
  value: PermissionCode[]
}

export function PermissionToggleForm({
  disabled = false,
  isSaving = false,
  onSave,
  onToggle,
  readOnly = false,
  value,
}: PermissionToggleFormProps) {
  const selectedPermissions = new Set(
    value.includes('access_all') ? permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.code)) : value,
  )

  return (
    <Card title="Permissions" description="Choose what this staff member can see and do.">
      <div className="permission-groups">
        {permissionGroups.map((group) => (
          <section className="permission-group" key={group.label}>
            <h3 className="permission-group__title">{group.label}</h3>
            <div className="permission-grid">
              {group.permissions.map((permission) => {
                const isEnabled = selectedPermissions.has(permission.code)

                return (
                  <button
                    aria-pressed={isEnabled}
                    className={isEnabled ? 'permission-toggle is-active' : 'permission-toggle'}
                    disabled={disabled || isSaving || readOnly}
                    key={permission.code}
                    onClick={() => onToggle?.(permission.code)}
                    type="button"
                  >
                    <span className="permission-toggle__label">{permission.label}</span>
                    <span className="permission-toggle__description">{permission.description}</span>
                    <span className="permission-toggle__state">{isEnabled ? 'On' : 'Off'}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {!readOnly && onSave && (
        <ActionBar>
          <Button disabled={disabled} isLoading={isSaving} onClick={onSave} variant="primary">
            Save Permissions
          </Button>
        </ActionBar>
      )}
    </Card>
  )
}
