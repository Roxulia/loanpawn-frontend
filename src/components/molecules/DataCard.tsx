import type { ReactNode } from 'react'
import { KeyValueList, type KeyValueItem } from './KeyValueList'

type DataCardProps = {
  actions?: ReactNode
  className?: string
  items: KeyValueItem[]
  title: ReactNode
}

export function DataCard({ actions, className, items, title }: DataCardProps) {
  return (
    <article className={['ui-data-card', className].filter(Boolean).join(' ')}>
      <div className="ui-data-card__title">{title}</div>
      <KeyValueList items={items} />
      {actions && <div className="ui-data-card__actions">{actions}</div>}
    </article>
  )
}
