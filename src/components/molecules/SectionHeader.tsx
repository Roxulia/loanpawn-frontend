import type { ReactNode } from 'react'

type SectionHeaderProps = {
  action?: ReactNode
  subtitle?: string
  title: string
}

export function SectionHeader({ action, subtitle, title }: SectionHeaderProps) {
  return (
    <header className="ui-section-header">
      <div className="ui-section-header__text">
        <h2 className="ui-section-header__title">{title}</h2>
        {subtitle && <p className="ui-section-header__subtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
