import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { CirclePlusIcon, EditIcon, TrashIcon } from '../../../components/icons/icon'
import { Card, SearchField, SectionHeader, TableToolbar } from '../../../components/molecules'
import { ConfirmDialog, DataTable, type DataTableColumn } from '../../../components/organisms'
import { usePermissions } from '../../auth'
import {
  customerService,
  type TenantCustomer,
  type TenantCustomerListPage,
} from '../services/customerService'
import { getTrustScore, getTrustTone } from '../customerFormat'

const perPage = 10

export function CustomerListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission } = usePermissions()
  const canList = hasPermission('list_customer')
  const canCreate = hasPermission('create_customer')
  const canUpdate = hasPermission('update_customer')
  const canDelete = hasPermission('delete_customer')
  const canUseRowActions = canUpdate || canDelete
  const [customers, setCustomers] = useState<TenantCustomer[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(() => getRouteNotice(location.state))
  const [customerToDelete, setCustomerToDelete] = useState<TenantCustomer | null>(null)

  const loadCustomers = useCallback(async (page: number, search = debouncedSearchTerm) => {
    if (!canList) {
      setCustomers([])
      setCurrentPage(1)
      setLastPage(1)
      setTotal(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await customerService.listCustomers({ page, perPage, search })
      const pageData = response.data

      setCustomers(pageData.items)
      setCurrentPage(getPageValue(pageData, 'currentPage', 'current_page', 1))
      setLastPage(getPageValue(pageData, 'lastPage', 'last_page', 1))
      setTotal(pageData.total)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load customers.')
    } finally {
      setIsLoading(false)
    }
  }, [canList, debouncedSearchTerm])

  useEffect(() => {
    if (getRouteNotice(location.state)) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  useEffect(() => {
    const searchTimer = window.setTimeout(() => {
      setCurrentPage(1)
      setDebouncedSearchTerm(searchTerm.trim())
    }, 300)

    return () => window.clearTimeout(searchTimer)
  }, [searchTerm])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadCustomers(currentPage, debouncedSearchTerm)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [currentPage, debouncedSearchTerm, loadCustomers])

  const columns: Array<DataTableColumn<TenantCustomer>> = [
    {
      header: 'Name',
      key: 'name',
      render: (customer) => <strong>{customer.name}</strong>,
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (customer) => customer.phone || '-',
    },
    {
      header: 'Email',
      key: 'email',
      render: (customer) => customer.email || '-',
    },
    {
      header: 'Trust',
      key: 'trustScore',
      render: (customer) => <Badge tone={getTrustTone(getTrustScore(customer))}>{getTrustScore(customer)}</Badge>,
    },
    {
      header: 'Address',
      key: 'address',
      render: (customer) => customer.address || '-',
    },
  ]

  async function handleDelete() {
    if (!customerToDelete) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await customerService.deleteCustomer(customerToDelete.code)
      setNotice('Customer deleted successfully.')
      setCustomerToDelete(null)

      const nextPage = customers.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      setCurrentPage(nextPage)
      await loadCustomers(nextPage)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete customer.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="page">
      <SectionHeader
        title="Customers"
        subtitle="Search, edit, and maintain customer records used by pawn slip workflows."
        action={
          canCreate ? (
            <Button leftIcon={<CirclePlusIcon />} onClick={() => navigate(routePaths.customerCreate)} variant="primary">
              Add Customer
            </Button>
          ) : null
        }
      />

      <Card title="Customer records" description={`${total} total customer${total === 1 ? '' : 's'}`}>
        <div className="customer-management">
          {error && <Alert message={error} onDismiss={() => setError(null)} title="Customer action failed" tone="danger" />}
          {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Customer updated" tone="success" />}

          <TableToolbar
            actions={
              canList ? (
                <Button onClick={() => void loadCustomers(currentPage)} variant="secondary">
                  Refresh
                </Button>
              ) : null
            }
            search={
              canList ? (
                <SearchField
                  id="customer-search"
                  label="Search customers"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Name, phone, email, or address"
                  value={searchTerm}
                />
              ) : null
            }
          />

          <DataTable
            actions={canUseRowActions ? (customer) => (
              <div className="row-actions">
                {canUpdate && (
                  <Button
                    aria-label={`Edit ${customer.name}`}
                    className="ui-button--icon"
                    onClick={() => navigate(routePaths.customerEdit(customer.code))}
                    title="Edit customer"
                    variant="secondary"
                  >
                    <EditIcon />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    aria-label={`Delete ${customer.name}`}
                    className="ui-button--icon"
                    onClick={() => setCustomerToDelete(customer)}
                    title="Delete customer"
                    variant="danger"
                  >
                    <TrashIcon />
                  </Button>
                )}
              </div>
            ) : undefined}
            columns={columns}
            emptyAction={
              canCreate ? (
                <Button leftIcon={<CirclePlusIcon />} onClick={() => navigate(routePaths.customerCreate)} variant="primary">
                  Add Customer
                </Button>
              ) : null
            }
            emptyDescription={canList ? (debouncedSearchTerm ? 'No customers match this search.' : 'Create the first customer record.') : 'Your account can create customers, but cannot view customer records.'}
            emptyTitle={canList ? (searchTerm ? 'No matching customers' : 'No customers yet') : 'Customer records hidden'}
            getItemId={(customer) => customer.id}
            getItemTitle={(customer) => customer.name}
            isLoading={isLoading}
            items={customers}
            onRowClick={canList ? (customer) => navigate(routePaths.customerDetail(customer.code)) : undefined}
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
        confirmLabel="Delete Customer"
        isLoading={isDeleting}
        isOpen={Boolean(customerToDelete)}
        message={`Delete ${customerToDelete?.name ?? 'this customer'}? This action cannot be undone.`}
        onCancel={() => setCustomerToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Confirm customer deletion"
      />
    </section>
  )
}

function getRouteNotice(state: unknown) {
  if (typeof state === 'object' && state !== null && 'notice' in state && typeof state.notice === 'string') {
    return state.notice
  }

  return null
}

function getPageValue(
  pageData: TenantCustomerListPage,
  camelKey: 'currentPage' | 'lastPage',
  snakeKey: 'current_page' | 'last_page',
  fallback: number,
) {
  return pageData[camelKey] ?? pageData[snakeKey] ?? fallback
}
