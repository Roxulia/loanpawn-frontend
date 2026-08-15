import { useEffect, useState } from 'react'
import { SearchableSelect } from '../../../components/molecules'
import { customerService, type TenantCustomer } from '../../customers/services/customerService'

type CustomerSearchFieldProps = {
  hasError?: boolean
  id: string
  onChange: (customerCode: string) => void
  value: string
}

export function CustomerSearchField({ hasError = false, id, onChange, value }: CustomerSearchFieldProps) {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState<TenantCustomer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    const search = query.trim()

    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError(null)

      customerService.listCustomers({ page: 1, perPage: 8, search })
        .then((response) => {
          if (!isCurrent) {
            return
          }

          setCustomers(response.items ?? [])
        })
        .catch((loadError) => {
          if (!isCurrent) {
            return
          }

          setCustomers([])
          setError(loadError instanceof Error ? loadError.message : 'Unable to load customers.')
        })
        .finally(() => {
          if (isCurrent) {
            setIsLoading(false)
          }
        })
    }, 250)

    return () => {
      isCurrent = false
      window.clearTimeout(timer)
    }
  }, [query])

  return (
    <SearchableSelect
      emptyMessage="No customers found."
      error={error}
      getOptionDescription={(customer) => customer.phone ?? ''}
      getOptionLabel={(customer) => customer.name}
      getOptionValue={(customer) => customer.code}
      hasError={hasError}
      id={id}
      isLoading={isLoading}
      loadingMessage="Loading customers..."
      onChange={onChange}
      onSearchChange={setQuery}
      options={customers}
      placeholder="Search customers"
      value={value}
    />
  )
}
