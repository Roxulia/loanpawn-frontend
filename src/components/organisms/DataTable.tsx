import type { ReactNode } from 'react'
import { Button } from '../atoms'
import { EmptyState, LoadingState } from '../feedback'
import { DataCard, type KeyValueItem } from '../molecules'

export type DataTableColumn<TItem> = {
  header: string
  key: string
  render: (item: TItem) => ReactNode
  mobileLabel?: string
}

type DataTablePagination = {
  currentPage: number
  lastPage: number
  onNext?: () => void
  onPrevious?: () => void
  total?: number
}

type DataTableProps<TItem> = {
  actions?: (item: TItem) => ReactNode
  columns: Array<DataTableColumn<TItem>>
  emptyAction?: ReactNode
  emptyDescription?: string
  emptyTitle?: string
  getItemId: (item: TItem) => string | number
  getItemTitle: (item: TItem) => ReactNode
  isLoading?: boolean
  items: TItem[]
  onRowClick?: (item: TItem) => void
  pagination?: DataTablePagination
  showEmptyStructure?: boolean
}

export function DataTable<TItem>({
  actions,
  columns,
  emptyAction,
  emptyDescription = 'No records found.',
  emptyTitle = 'No data',
  getItemId,
  getItemTitle,
  isLoading = false,
  items,
  onRowClick,
  pagination,
  showEmptyStructure = false,
}: DataTableProps<TItem>) {
  if (isLoading) {
    return <LoadingState rows={5} />
  }

  if (items.length === 0 && !showEmptyStructure) {
    return <EmptyState action={emptyAction} description={emptyDescription} title={emptyTitle} />
  }

  return (
    <div className="ui-data-table">
      <div className="ui-data-table__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <EmptyState action={emptyAction} description={emptyDescription} title={emptyTitle} />
                </td>
              </tr>
            ) : items.map((item) => (
              <tr
                key={getItemId(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>{column.render(item)}</td>
                ))}
                {actions && <td onClick={(event) => event.stopPropagation()}>{actions(item)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ui-data-table__cards">
        {items.length === 0 ? (
          <EmptyState action={emptyAction} description={emptyDescription} title={emptyTitle} />
        ) : items.map((item) => {
          const cardItems: KeyValueItem[] = columns.map((column) => ({
            key: column.mobileLabel ?? column.header,
            value: column.render(item),
          }))

          return (
            <DataCard
              actions={actions?.(item)}
              items={cardItems}
              key={getItemId(item)}
              title={getItemTitle(item)}
            />
          )
        })}
      </div>

      {pagination && (
        <div className="ui-pagination">
          <span className="ui-pagination__meta">
            Page {pagination.currentPage} of {pagination.lastPage}
            {pagination.total !== undefined ? ` - ${pagination.total} records` : ''}
          </span>
          <Button
            disabled={pagination.currentPage <= 1}
            onClick={pagination.onPrevious}
            variant="secondary"
          >
            Previous
          </Button>
          <Button
            disabled={pagination.currentPage >= pagination.lastPage}
            onClick={pagination.onNext}
            variant="secondary"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
