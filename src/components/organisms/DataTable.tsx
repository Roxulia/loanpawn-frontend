import type { ReactNode } from 'react'
import { Button } from '../atoms'
import { EmptyState, LoadingState } from '../feedback'
import { DataCard, type KeyValueItem } from '../molecules'
import { useUiLocale } from '../../locales/UiLocale'

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
  renderMobileCard?: (item: TItem, actions: ReactNode) => ReactNode
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
  renderMobileCard,
  showEmptyStructure = false,
}: DataTableProps<TItem>) {
  const { t } = useUiLocale()

  if (isLoading) {
    return <LoadingState rows={5} />
  }

  if (items.length === 0 && !showEmptyStructure) {
    return <EmptyState action={emptyAction} description={emptyDescription} title={emptyTitle} />
  }

  return (
    <div className={onRowClick ? 'ui-data-table ui-data-table--clickable' : 'ui-data-table'}>
      <div className="ui-data-table__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{t(column.header)}</th>
              ))}
              {actions && <th>{t('Actions')}</th>}
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
                onKeyDown={onRowClick ? (event) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault()
                    onRowClick(item)
                  }
                } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
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
          const itemActions = actions?.(item)

          if (renderMobileCard) {
            return <div key={getItemId(item)}>{renderMobileCard(item, itemActions)}</div>
          }

          const cardItems: KeyValueItem[] = columns.map((column) => ({
            key: column.mobileLabel ?? column.header,
            value: column.render(item),
          }))

          return (
            <DataCard
              actions={itemActions}
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
            {t(`Page ${pagination.currentPage} of ${pagination.lastPage}${pagination.total !== undefined ? ` - ${pagination.total} records` : ''}`)}
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
