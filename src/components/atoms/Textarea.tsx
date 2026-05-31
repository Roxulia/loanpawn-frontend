import type { TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean
}

export function Textarea({ className = '', hasError = false, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={hasError || undefined}
      className={['ui-textarea', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
