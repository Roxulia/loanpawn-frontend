import { useEffect, useMemo, useState } from 'react'
import { useTenantSession } from '../../contexts/useTenantSession'
import { financialAccountService } from '../financialAccounts/financialAccountService'
import type { FinancialAccount } from '../financialAccounts/types'

const accountRequests = new Map<string, Promise<FinancialAccount[]>>()

function loadAccounts(tenantCode: string) {
  const existing = accountRequests.get(tenantCode)
  if (existing) return existing

  const request = (async () => {
    const accounts: FinancialAccount[] = []
    let page = 1
    while (true) {
      const result = await financialAccountService.list({ page, perPage: 100 })
      accounts.push(...result.items)
      if (page >= result.last_page) return accounts
      page += 1
    }
  })().catch((error) => {
    accountRequests.delete(tenantCode)
    throw error
  })

  accountRequests.set(tenantCode, request)
  return request
}

export function useFinancialAccounts() {
  const { tenantResolution } = useTenantSession()
  const tenantCode = tenantResolution.status === 'resolved' ? tenantResolution.tenant.code : null
  const [loaded, setLoaded] = useState<{ tenantCode: string; accounts: FinancialAccount[] } | null>(null)

  useEffect(() => {
    let active = true
    if (!tenantCode) return () => { active = false }
    void loadAccounts(tenantCode)
      .then((accounts) => { if (active) setLoaded({ tenantCode, accounts }) })
      .catch(() => { if (active) setLoaded({ tenantCode, accounts: [] }) })
    return () => { active = false }
  }, [tenantCode])

  return useMemo(
    () => loaded?.tenantCode === tenantCode ? loaded.accounts : [],
    [loaded, tenantCode],
  )
}
