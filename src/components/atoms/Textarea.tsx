import type { TextareaHTMLAttributes } from 'react'
import { useUiLocale } from '../../locales/UiLocale'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean
}

export function Textarea({ className = '', hasError = false, ...props }: TextareaProps) {
  const { t } = useUiLocale()

  return (
    <textarea
      aria-invalid={hasError || undefined}
      className={['ui-textarea', className].filter(Boolean).join(' ')}
      {...props}
      aria-label={typeof props['aria-label'] === 'string' ? t(props['aria-label']) : props['aria-label']}
      placeholder={typeof props.placeholder === 'string' ? t(props.placeholder) : props.placeholder}
      title={typeof props.title === 'string' ? t(props.title) : props.title}
    />
  )
}
