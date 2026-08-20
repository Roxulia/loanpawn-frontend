import { forwardRef, type InputHTMLAttributes } from 'react'
import { useUiLocale } from '../../locales/UiLocale'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className = '', hasError = false, ...props }, ref) {
  const { t } = useUiLocale()

  return (
    <input
      aria-invalid={hasError || undefined}
      ref={ref}
      className={['ui-input', className].filter(Boolean).join(' ')}
      {...props}
      aria-label={typeof props['aria-label'] === 'string' ? t(props['aria-label']) : props['aria-label']}
      placeholder={typeof props.placeholder === 'string' ? t(props.placeholder) : props.placeholder}
      title={typeof props.title === 'string' ? t(props.title) : props.title}
    />
  )
})
