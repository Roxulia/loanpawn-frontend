import type { ReactNode } from 'react'
import { Label } from '../atoms'

type FormFieldProps = {
  children: ReactNode
  error?: string
  helperText?: string
  id: string
  label: string
}

export function FormField({ children, error, helperText, id, label }: FormFieldProps) {
  return (
    <div className="ui-form-field">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <div className="ui-form-field__hint">{helperText}</div>
      <div className="ui-form-field__error" role={error ? 'alert' : undefined}>
        {error}
      </div>
    </div>
  )
}
