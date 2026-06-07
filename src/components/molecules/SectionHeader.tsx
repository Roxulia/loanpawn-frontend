import type { ReactNode } from 'react'
import { useUiLocale } from '../../locales/UiLocale'

type SectionHeaderProps = {
  action?: ReactNode
  subtitle?: string
  title: string
}

export function SectionHeader({ action, subtitle, title }: SectionHeaderProps) {
  const { t } = useUiLocale()

  return (
    <header className="ui-section-header">
      <div className="ui-section-header__text">
        <h2 className="ui-section-header__title">{t(title)}</h2>
        {subtitle && <p className="ui-section-header__subtitle">{t(subtitle)}</p>}
      </div>
      {action}
    </header>
  )
}
