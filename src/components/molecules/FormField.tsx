import type { ReactNode } from 'react'
import { Label } from '../atoms'
import { useUiLocale } from '../../locales/UiLocale'

type FormFieldProps = {
  children: ReactNode
  error?: string
  helperText?: string
  id: string
  label: string
}

export function FormField({ children, error, helperText, id, label }: FormFieldProps) {
  const { t } = useUiLocale()

  return (
    <div className="ui-form-field">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <div className="ui-form-field__hint">{helperText ? t(helperText) : helperText}</div>
      <div className="ui-form-field__error" role={error ? 'alert' : undefined}>
        {error ? t(error) : error}
      </div>
    </div>
  )
}
