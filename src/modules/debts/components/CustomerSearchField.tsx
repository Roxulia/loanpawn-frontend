import { useEffect, useMemo, useState } from 'react'
import { Input } from '../../../components/atoms'
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
  const [hasFocused, setHasFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.code === value) ?? null,
    [customers, value],
  )
  const shouldShowMenu = hasFocused && (isLoading || Boolean(error) || customers.length > 0 || Boolean(query.trim()))

  useEffect(() => {
    let isCurrent = true
    const search = query.trim()

    if (!hasFocused && search === '') {
      return
    }

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
  }, [hasFocused, query])

  return (
    <div className="debt-customer-search">
      <Input
        aria-describedby={`${id}-options`}
        hasError={hasError}
        id={id}
        onChange={(event) => {
          setQuery(event.target.value)
          if (value) {
            onChange('')
          }
        }}
        onFocus={() => setHasFocused(true)}
        placeholder="Search customers"
        type="search"
        value={selectedCustomer ? formatCustomerOption(selectedCustomer) : query}
      />
      {shouldShowMenu && (
        <div className="debt-customer-search__menu" id={`${id}-options`}>
          {isLoading ? (
            <span className="debt-customer-search__status">Loading customers...</span>
          ) : error ? (
            <span className="debt-customer-search__status debt-customer-search__status--error">{error}</span>
          ) : customers.length > 0 ? (
            customers.map((customer) => (
              <button
                className="debt-customer-search__option"
                key={customer.code}
                onClick={() => {
                  onChange(customer.code)
                  setQuery('')
                }}
                type="button"
              >
                <strong>{customer.name}</strong>
                <span>{[customer.code, customer.phone].filter(Boolean).join(' / ')}</span>
              </button>
            ))
          ) : (
            <span className="debt-customer-search__status">No customers found.</span>
          )}
        </div>
      )}
    </div>
  )
}

function formatCustomerOption(customer: TenantCustomer) {
  return [customer.name, customer.code, customer.phone].filter(Boolean).join(' / ')
}
