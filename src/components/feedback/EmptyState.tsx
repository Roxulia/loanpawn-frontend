import type { ReactNode } from 'react'
import { useUiLocale } from '../../locales/UiLocale'

type EmptyStateProps = {
  action?: ReactNode
  title: string
  description: string
  icon?: ReactNode
}

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  const { t } = useUiLocale()

  return (
    <section className="ui-empty-state">
      {icon && <div className="ui-empty-state__icon">{icon}</div>}
      <h2 className="ui-empty-state__title">{t(title)}</h2>
      <p className="ui-empty-state__description">{t(description)}</p>
      {action}
    </section>
  )
}
