import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean
}

export function Select({ className = '', hasError = false, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={hasError || undefined}
      className={['ui-select', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
