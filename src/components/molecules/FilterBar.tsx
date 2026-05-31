import type { ReactNode } from 'react'

type FilterBarProps = {
  actions: ReactNode
  children: ReactNode
}

export function FilterBar({ actions, children }: FilterBarProps) {
  return (
    <div className="ui-filter-bar">
      <div className="ui-filter-bar__fields">{children}</div>
      <div className="ui-filter-bar__actions">{actions}</div>
    </div>
  )
}
