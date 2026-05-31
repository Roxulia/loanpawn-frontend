import type { ReactNode } from 'react'
import { KeyValueList, type KeyValueItem } from './KeyValueList'

type DataCardProps = {
  actions?: ReactNode
  items: KeyValueItem[]
  title: ReactNode
}

export function DataCard({ actions, items, title }: DataCardProps) {
  return (
    <article className="ui-data-card">
      <div className="ui-data-card__title">{title}</div>
      <KeyValueList items={items} />
      {actions && <div>{actions}</div>}
    </article>
  )
}
