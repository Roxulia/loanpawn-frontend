import type { ReactNode } from 'react'

type TableToolbarProps = {
  actions?: ReactNode
  filters?: ReactNode
  search?: ReactNode
}

export function TableToolbar({ actions, filters, search }: TableToolbarProps) {
  return (
    <div className="ui-table-toolbar">
      <div className="ui-table-toolbar__left">{search}</div>
      <div className="ui-table-toolbar__right">
        {filters}
        {actions}
      </div>
    </div>
  )
}
