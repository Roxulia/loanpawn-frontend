import type { HTMLAttributes } from 'react'

type BadgeTone = 'success' | 'warning' | 'danger' | 'info'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
}

export function Badge({ className = '', tone = 'info', ...props }: BadgeProps) {
  return (
    <span
      className={['ui-badge', `ui-badge--${tone}`, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
