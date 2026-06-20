import type { TenantUser } from '../../dataobjects/tenant/auth'
import { nrcValueFromFields } from '../../components/molecules'
import type { StaffFormState } from './components/staffFormModel'

export function getUserRoleName(user: TenantUser) {
  return user.roleName ?? user.role_name ?? 'Staff'
}

export function staffToForm(user: TenantUser): StaffFormState {
  return {
    address: user.address ?? '',
    email: user.email ?? '',
    name: user.name,
    nrc: nrcValueFromFields(user),
    phone: user.phone,
    role_id: String(user.role_id ?? user.roleId ?? ''),
    update_key: user.update_key ?? user.updateKey,
  }
}

export function formatValue(value?: string | number | null) {
  return value === undefined || value === null || value === '' ? '-' : String(value)
}
