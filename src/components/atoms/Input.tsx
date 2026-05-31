import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean
}

export function Input({ className = '', hasError = false, ...props }: InputProps) {
  return (
    <input
      aria-invalid={hasError || undefined}
      className={['ui-input', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
