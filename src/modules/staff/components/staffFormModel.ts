import {
  emptyNrcValue,
  isCompleteNrcValue,
  nrcValueToPayloadFields,
  type NrcValue,
} from '../../../components/molecules'

export type StaffFormState = {
  address: string
  email: string
  name: string
  nrc: NrcValue
  phone: string
  role_id: string
  update_key?: number
}

export type StaffFormErrors = Partial<Record<keyof StaffFormState, string>>

export const emptyStaffForm: StaffFormState = {
  address: '',
  email: '',
  name: '',
  nrc: emptyNrcValue,
  phone: '',
  role_id: '',
  update_key: undefined,
}

export function validateStaffForm(form: StaffFormState) {
  const errors: StaffFormErrors = {}

  if (!form.name.trim()) {
    errors.name = 'Name is required.'
  }

  if (!isCompleteNrcValue(form.nrc)) {
    errors.nrc = 'NRC is required.'
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  }

  if (!form.phone.trim()) {
    errors.phone = 'Phone is required.'
  }

  if (!form.role_id.trim()) {
    errors.role_id = 'Role is required.'
  }

  return errors
}

export function formToStaffPayload(form: StaffFormState, options: { includeRole?: boolean } = {}) {
  const payload = {
    address: emptyToNull(form.address),
    email: form.email.trim(),
    name: form.name.trim(),
    ...nrcValueToPayloadFields(form.nrc),
    phone: form.phone.trim(),
    update_key: form.update_key,
  }

  return options.includeRole === false
    ? payload
    : { ...payload, role_id: Number(form.role_id) }
}

function emptyToNull(value: string) {
  const trimmed = value.trim()

  return trimmed ? trimmed : null
}
