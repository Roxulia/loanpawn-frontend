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
  status: string
  update_key?: number
}

export type StaffFormErrors = Partial<Record<keyof StaffFormState, string>>

export const emptyStaffForm: StaffFormState = {
  address: '',
  email: '',
  name: '',
  nrc: emptyNrcValue,
  phone: '',
  status: 'active',
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

  return errors
}

export function formToStaffPayload(form: StaffFormState) {
  return {
    address: emptyToNull(form.address),
    email: form.email.trim(),
    name: form.name.trim(),
    ...nrcValueToPayloadFields(form.nrc),
    phone: form.phone.trim(),
    status: form.status,
    update_key: form.update_key,
  }
}

function emptyToNull(value: string) {
  const trimmed = value.trim()

  return trimmed ? trimmed : null
}
