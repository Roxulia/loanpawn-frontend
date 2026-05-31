import type { ReactNode } from 'react'

type EmptyStateProps = {
  action?: ReactNode
  title: string
  description: string
  icon?: ReactNode
}

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <section className="ui-empty-state">
      {icon && <div className="ui-empty-state__icon">{icon}</div>}
      <h2 className="ui-empty-state__title">{title}</h2>
      <p className="ui-empty-state__description">{description}</p>
      {action}
    </section>
  )
}
