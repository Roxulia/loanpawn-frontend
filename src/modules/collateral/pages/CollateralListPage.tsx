import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { TrashIcon } from '../../../components/icons/icon'
import { Card, SearchField, SectionHeader, TableToolbar } from '../../../components/molecules'
import { ConfirmDialog, DataTable, type DataTableColumn } from '../../../components/organisms'
import { usePermissions } from '../../auth'
import { formatDate, getItemStatus, getItemType, getStatusTone } from '../collateralFormat'
import { collateralService } from '../services/collateralService'
import type { CollateralItem, CollateralItemListPage } from '../types'

const perPage = 10

export function CollateralListPage() {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canList = hasPermission('list_collateral')
  const canDelete = hasPermission('delete_collateral')
  const [items, setItems] = useState<CollateralItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<CollateralItem | null>(null)

  const loadItems = useCallback(async (page: number, search = debouncedSearchTerm) => {
    if (!canList) {
      setItems([])
      setCurrentPage(1)
      setLastPage(1)
      setTotal(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await collateralService.listCollateral({ page, perPage, search })
      const pageData = response

      setItems(pageData.items)
      setCurrentPage(getPageValue(pageData, 'currentPage', 'current_page', 1))
      setLastPage(getPageValue(pageData, 'lastPage', 'last_page', 1))
      setTotal(pageData.total)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load collateral items.')
    } finally {
      setIsLoading(false)
    }
  }, [canList, debouncedSearchTerm])

  useEffect(() => {
    const searchTimer = window.setTimeout(() => {
      setCurrentPage(1)
      setDebouncedSearchTerm(searchTerm.trim())
    }, 300)

    return () => window.clearTimeout(searchTimer)
  }, [searchTerm])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadItems(currentPage, debouncedSearchTerm)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [currentPage, debouncedSearchTerm, loadItems])

  const columns: Array<DataTableColumn<CollateralItem>> = [
    {
      header: 'Item',
      key: 'name',
      render: (item) => <strong>{item.name}</strong>,
    },
    {
      header: 'Type',
      key: 'type',
      render: (item) => <Badge tone="info">{getItemType(item)}</Badge>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (item) => <Badge tone={getStatusTone(getItemStatus(item))}>{getItemStatus(item)}</Badge>,
    },
    {
      header: 'Description',
      key: 'description',
      render: (item) => item.description || '-',
    },
    {
      header: 'Created',
      key: 'createdAt',
      render: (item) => formatDate(item.createdAt ?? item.created_at),
    },
  ]

  async function handleDelete() {
    if (!itemToDelete) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await collateralService.deleteCollateral(itemToDelete.code)
      setNotice('Collateral item deleted successfully.')
      setItemToDelete(null)

      const nextPage = items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      setCurrentPage(nextPage)
      await loadItems(nextPage)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete collateral item.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="page ops-page ops-page--register">
      <div className="ops-hero">
        <SectionHeader
          title="Collateral"
          subtitle="Review registered collateral items and remove invalid records."
        />
        <div className="ops-metrics" aria-label="Collateral register summary">
          <div className="ops-metric">
            <span>Total items</span>
            <strong>{formatNumber(total)}</strong>
          </div>
          <div className="ops-metric">
            <span>Visible records</span>
            <strong>{formatNumber(items.length)}</strong>
          </div>
          <div className="ops-metric">
            <span>Current page</span>
            <strong>{currentPage}/{lastPage}</strong>
          </div>
        </div>
      </div>

      <Card title="Collateral items" description={`${total} total collateral item${total === 1 ? '' : 's'}`}>
        <div className="customer-management">
          {error && <Alert message={error} onDismiss={() => setError(null)} title="Collateral action failed" tone="danger" />}
          {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Collateral updated" tone="success" />}

          <TableToolbar
            actions={
              canList ? (
                <Button onClick={() => void loadItems(currentPage)} variant="secondary">
                  Refresh
                </Button>
              ) : null
            }
            search={
              canList ? (
                <SearchField
                  id="collateral-search"
                  label="Search collateral"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Name, description, type, or status"
                  value={searchTerm}
                />
              ) : null
            }
          />

          <DataTable
            actions={canDelete ? (item) => (
              <div className="row-actions">
                <Button
                  aria-label={`Delete ${item.name}`}
                  className="ui-button--icon"
                  onClick={() => setItemToDelete(item)}
                  title="Delete collateral item"
                  variant="danger"
                >
                  <TrashIcon />
                </Button>
              </div>
            ) : undefined}
            columns={columns}
            emptyDescription={canList ? (debouncedSearchTerm ? 'No collateral items match this search.' : 'No collateral items found.') : 'Your account cannot view collateral records.'}
            emptyTitle={canList ? (searchTerm ? 'No matching collateral' : 'No collateral items') : 'Collateral records hidden'}
            getItemId={(item) => item.id}
            getItemTitle={(item) => item.name}
            isLoading={isLoading}
            items={items}
            onRowClick={canList ? (item) => navigate(routePaths.collateralDetail(item.code)) : undefined}
            pagination={canList ? {
              currentPage,
              lastPage,
              onNext: () => setCurrentPage((page) => page + 1),
              onPrevious: () => setCurrentPage((page) => page - 1),
              total,
            } : undefined}
            showEmptyStructure={!canList}
          />
        </div>
      </Card>

      <ConfirmDialog
        confirmLabel="Delete Item"
        isLoading={isDeleting}
        isOpen={Boolean(itemToDelete)}
        message={`Delete ${itemToDelete?.name ?? 'this collateral item'}? This action cannot be undone.`}
        onCancel={() => setItemToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Confirm collateral deletion"
      />
    </section>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function getPageValue(
  pageData: CollateralItemListPage,
  camelKey: 'currentPage' | 'lastPage',
  snakeKey: 'current_page' | 'last_page',
  fallback: number,
) {
  return pageData[camelKey] ?? pageData[snakeKey] ?? fallback
}
