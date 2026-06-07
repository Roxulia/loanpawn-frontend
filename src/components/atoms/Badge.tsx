import type { HTMLAttributes } from 'react'
import { translateNode, useUiLocale } from '../../locales/UiLocale'

type BadgeTone = 'success' | 'warning' | 'danger' | 'info'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
}

export function Badge({ children, className = '', tone = 'info', ...props }: BadgeProps) {
  const { locale } = useUiLocale()

  return (
    <span
      className={['ui-badge', `ui-badge--${tone}`, className].filter(Boolean).join(' ')}
      {...props}
    >
      {translateNode(children, locale)}
    </span>
  )
}
