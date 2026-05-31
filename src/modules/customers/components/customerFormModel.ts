import type { TenantCustomer } from '../services/customerService'

export type CustomerFormState = {
  name: string
  email: string
  phone: string
  address: string
  note: string
  update_key?: number
}

export type CustomerFormErrors = Partial<Record<keyof CustomerFormState, string>>

export const emptyCustomerForm: CustomerFormState = {
  address: '',
  email: '',
  name: '',
  note: '',
  phone: '',
  update_key: undefined,
}

export function customerToForm(customer: TenantCustomer): CustomerFormState {
  return {
    address: customer.address ?? '',
    email: customer.email ?? '',
    name: customer.name,
    note: customer.note ?? '',
    phone: customer.phone ?? '',
    update_key: customer.update_key ?? customer.updateKey,
  }
}

export function formToCustomerPayload(form: CustomerFormState) {
  return {
    address: emptyToNull(form.address),
    email: emptyToNull(form.email),
    name: form.name.trim(),
    note: emptyToNull(form.note),
    phone: emptyToNull(form.phone),
    update_key: form.update_key,
  }
}

export function validateCustomerForm(form: CustomerFormState) {
  const errors: CustomerFormErrors = {}

  if (!form.name.trim()) {
    errors.name = 'Name is required.'
  }

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  return errors
}

function emptyToNull(value: string) {
  const trimmed = value.trim()

  return trimmed ? trimmed : null
}
