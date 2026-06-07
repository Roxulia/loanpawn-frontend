import type { LabelHTMLAttributes } from 'react'
import { translateNode, useUiLocale } from '../../locales/UiLocale'

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export function Label({ children, className = '', ...props }: LabelProps) {
  const { locale } = useUiLocale()

  return (
    <label className={['ui-label', className].filter(Boolean).join(' ')} {...props}>
      {translateNode(children, locale)}
    </label>
  )
}
