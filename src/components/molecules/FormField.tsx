import type { ReactNode } from 'react'
import { Label } from '../atoms'
import { useUiLocale } from '../../locales/UiLocale'

type FormFieldProps = {
  children: ReactNode
  className?: string
  error?: string
  helperText?: string
  id: string
  label: string
}

export function FormField({ children, className = '', error, helperText, id, label }: FormFieldProps) {
  const { t } = useUiLocale()

  return (
    <div className={['ui-form-field', className].filter(Boolean).join(' ')}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {helperText && <div className="ui-form-field__hint">{t(helperText)}</div>}
      {error && <div className="ui-form-field__error" role="alert">{t(error)}</div>}
    </div>
  )
}
