import type { ReactNode } from 'react'
import { useUiLocale } from '../../locales/UiLocale'

type SectionHeaderProps = {
  action?: ReactNode
  subtitle?: string
  titlePrefix?: ReactNode
  title: string
}

export function SectionHeader({ action, subtitle, title, titlePrefix }: SectionHeaderProps) {
  const { t } = useUiLocale()

  return (
    <header className="ui-section-header">
      <div className="ui-section-header__text">
        <div className="ui-section-header__title-row">
          {titlePrefix}
          <h2 className="ui-section-header__title">{t(title)}</h2>
        </div>
        {subtitle && <p className="ui-section-header__subtitle">{t(subtitle)}</p>}
      </div>
      {action}
    </header>
  )
}
