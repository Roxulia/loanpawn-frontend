import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Input } from '../../../components/atoms'
import { Alert } from '../../../components/feedback'
import { Card, FormField, SectionHeader } from '../../../components/molecules'
import { DataTable, type DataTableColumn } from '../../../components/organisms'
import type { PaginatedResult } from '../../../dataobjects/common/api'
import type { AccountingLedger, AccountingLedgerEntry, AccountingTransaction } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { usePermissions } from '../../auth'
import {
  formatDate,
  formatMoney,
  getNumberField,
  getStringField,
  transactionTypeLabel,
} from '../../finance/financeFormat'

const perPage = 10
const today = new Date().toISOString().slice(0, 10)

const transactionColumns: Array<DataTableColumn<AccountingTransaction>> = [
  {
    header: 'Time',
    key: 'created',
    render: (item) => formatDate(getStringField(item, 'created_at', 'createdAt')),
  },
  {
    header: 'Description',
    key: 'description',
    render: (item) => <strong>{item.description}</strong>,
  },
  {
    header: 'Amount',
    key: 'amount',
    render: (item) => formatMoney(item.amount),
  },
  {
    header: 'Reference',
    key: 'reference',
    render: (item) => formatReference(item),
  },
]

const ledgerColumns: Array<DataTableColumn<AccountingLedgerEntry>> = [
  {
    header: 'Date',
    key: 'date',
    render: (item) => formatDate(getStringField(item, 'created_at', 'createdAt')),
  },
  {
    header: 'Description',
    key: 'description',
    render: (item) => <strong>{item.description}</strong>,
  },
  {
    header: 'Reference',
    key: 'reference',
    render: (item) => formatReference(item),
  },
  {
    header: 'Debit',
    key: 'debit',
    render: (item) => formatMoney(item.debit),
  },
  {
    header: 'Credit',
    key: 'credit',
    render: (item) => formatMoney(item.credit),
  },
  {
    header: 'Balance',
    key: 'balance',
    render: (item) => <strong>{formatMoney(item.balance)}</strong>,
  },
]

export function AccountingPage() {
  const { hasPermission } = usePermissions()
  const canList = hasPermission('list_accounting')
  const [incoming, setIncoming] = useState<AccountingTransaction[]>([])
  const [outgoing, setOutgoing] = useState<AccountingTransaction[]>([])
  const [incomingPage, setIncomingPage] = useState(1)
  const [outgoingPage, setOutgoingPage] = useState(1)
  const [incomingMeta, setIncomingMeta] = useState({ lastPage: 1, total: 0 })
  const [outgoingMeta, setOutgoingMeta] = useState({ lastPage: 1, total: 0 })
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [ledgerPage, setLedgerPage] = useState(1)
  const [ledger, setLedger] = useState<AccountingLedger | null>(null)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTodayTransactions = useCallback(async () => {
    if (!canList) {
      setIncoming([])
      setOutgoing([])
      return
    }

    setIsLoadingTransactions(true)
    setError(null)

    try {
      const [incomingResponse, outgoingResponse] = await Promise.all([
        tenantResourceService.listIncomingAccounting({ page: incomingPage, perPage }),
        tenantResourceService.listOutgoingAccounting({ page: outgoingPage, perPage }),
      ])

      setIncoming(incomingResponse.data.items)
      setOutgoing(outgoingResponse.data.items)
      setIncomingMeta(readPageMeta(incomingResponse.data))
      setOutgoingMeta(readPageMeta(outgoingResponse.data))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load today transactions.')
    } finally {
      setIsLoadingTransactions(false)
    }
  }, [canList, incomingPage, outgoingPage])

  const generateLedger = useCallback(async (page = ledgerPage) => {
    if (!canList) {
      return
    }

    if (!startDate || !endDate) {
      setError('Choose both start date and end date.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await tenantResourceService.generateAccountingLedger({
        endDate,
        page,
        perPage,
        startDate,
      })
      setLedger(response.data)
      setLedgerPage(getPageValue(response.data, 'currentPage', 'current_page', page))
    } catch (ledgerError) {
      setError(ledgerError instanceof Error ? ledgerError.message : 'Unable to generate ledger.')
    } finally {
      setIsGenerating(false)
    }
  }, [canList, endDate, ledgerPage, startDate])

  useEffect(() => {
    void loadTodayTransactions()
  }, [loadTodayTransactions])

  const ledgerLastPage = ledger ? getPageValue(ledger, 'lastPage', 'last_page', 1) : 1
  const ledgerTotal = ledger?.total ?? 0
  const ledgerEntries = useMemo(() => ledger?.entries ?? [], [ledger])

  async function downloadLedger() {
    if (!ledger || !startDate || !endDate) {
      return
    }

    setIsDownloading(true)
    setError(null)

    try {
      const blob = await tenantResourceService.downloadAccountingLedger({ endDate, startDate })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `general-ledger-${startDate}-to-${endDate}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Unable to download ledger.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="page accounting-page">
      <SectionHeader
        title="Accounting"
        subtitle="Review today's incoming and outgoing transactions, then generate a general ledger by date range."
        action={<Badge tone="info">General ledger</Badge>}
      />

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Accounting action failed" tone="danger" />}

      <div className="accounting-page__transactions">
        <TransactionTable
          currentPage={incomingPage}
          emptyTitle="No incoming transactions"
          isLoading={isLoadingTransactions}
          items={incoming}
          lastPage={incomingMeta.lastPage}
          onNext={() => setIncomingPage((page) => page + 1)}
          onPrevious={() => setIncomingPage((page) => page - 1)}
          title="Incoming Transactions Today"
          total={incomingMeta.total}
          type="incoming"
        />
        <TransactionTable
          currentPage={outgoingPage}
          emptyTitle="No outgoing transactions"
          isLoading={isLoadingTransactions}
          items={outgoing}
          lastPage={outgoingMeta.lastPage}
          onNext={() => setOutgoingPage((page) => page + 1)}
          onPrevious={() => setOutgoingPage((page) => page - 1)}
          title="Outgoing Transactions Today"
          total={outgoingMeta.total}
          type="outgoing"
        />
      </div>

      <Card
        title="Generate Ledger"
        description="Rows are shown in general ledger format with debit, credit, and running balance."
        action={
          ledger ? (
            <Button isLoading={isDownloading} onClick={() => void downloadLedger()} variant="secondary">
              Download Excel
            </Button>
          ) : null
        }
      >
        <div className="accounting-page__ledger-controls">
          <FormField id="ledger-start-date" label="Start date">
            <Input id="ledger-start-date" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
          </FormField>
          <FormField id="ledger-end-date" label="End date">
            <Input id="ledger-end-date" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
          </FormField>
          <Button isLoading={isGenerating} onClick={() => void generateLedger(1)} variant="primary">
            Generate Ledger
          </Button>
        </div>

        {ledger && (
          <div className="accounting-page__ledger-summary">
            <Badge tone="info">Opening {formatMoney(getNumberValue(ledger, 'openingBalance', 'opening_balance'))}</Badge>
            <Badge tone="success">Debit {formatMoney(getNumberValue(ledger, 'totalDebit', 'total_debit'))}</Badge>
            <Badge tone="warning">Credit {formatMoney(getNumberValue(ledger, 'totalCredit', 'total_credit'))}</Badge>
            <Badge tone="info">Final {formatMoney(getNumberValue(ledger, 'finalBalance', 'final_balance'))}</Badge>
          </div>
        )}

        <DataTable
          columns={ledgerColumns}
          emptyDescription="Choose a start date and end date, then generate the ledger."
          emptyTitle="No ledger generated"
          getItemId={(item) => item.id}
          getItemTitle={(item) => item.description}
          isLoading={isGenerating}
          items={ledgerEntries}
          pagination={ledger ? {
            currentPage: ledgerPage,
            lastPage: ledgerLastPage,
            onNext: () => {
              const nextPage = ledgerPage + 1
              setLedgerPage(nextPage)
              void generateLedger(nextPage)
            },
            onPrevious: () => {
              const previousPage = ledgerPage - 1
              setLedgerPage(previousPage)
              void generateLedger(previousPage)
            },
            total: ledgerTotal,
          } : undefined}
        />
      </Card>
    </section>
  )
}

function TransactionTable({
  currentPage,
  emptyTitle,
  isLoading,
  items,
  lastPage,
  onNext,
  onPrevious,
  title,
  total,
  type,
}: {
  currentPage: number
  emptyTitle: string
  isLoading: boolean
  items: AccountingTransaction[]
  lastPage: number
  onNext: () => void
  onPrevious: () => void
  title: string
  total: number
  type: 'incoming' | 'outgoing'
}) {
  return (
    <Card
      title={title}
      description={`${total} total transaction${total === 1 ? '' : 's'}`}
      action={<Badge tone={type === 'incoming' ? 'success' : 'warning'}>{transactionTypeLabel(type)}</Badge>}
    >
      <DataTable
        columns={transactionColumns}
        emptyDescription={`No ${type} transactions have been recorded today.`}
        emptyTitle={emptyTitle}
        getItemId={(item) => item.id}
        getItemTitle={(item) => item.description}
        isLoading={isLoading}
        items={items}
        pagination={{
          currentPage,
          lastPage,
          onNext,
          onPrevious,
          total,
        }}
      />
    </Card>
  )
}

function readPageMeta<TItem>(page: PaginatedResult<TItem>) {
  return {
    lastPage: getPageValue(page, 'lastPage', 'last_page', 1),
    total: page.total,
  }
}

function getPageValue<TData>(
  data: TData,
  camelKey: 'currentPage' | 'lastPage',
  snakeKey: 'current_page' | 'last_page',
  fallback: number,
) {
  const withOptionalKeys = data as TData & Partial<Record<typeof camelKey | typeof snakeKey, number>>

  return withOptionalKeys[camelKey] ?? withOptionalKeys[snakeKey] ?? fallback
}

function getNumberValue<TData>(data: TData, camelKey: string, snakeKey: string) {
  const withOptionalKeys = data as TData & Record<string, number | undefined>

  return withOptionalKeys[camelKey] ?? withOptionalKeys[snakeKey] ?? 0
}

function formatReference(item: AccountingTransaction | AccountingLedgerEntry) {
  const referenceLabel = getStringField(item, 'reference_label', 'referenceLabel')
  const referenceType = getStringField(item, 'reference_type', 'referenceType')
  const referenceId = getNumberField(item, 'reference_id', 'referenceId')

  if (!referenceLabel && !referenceType && referenceId === null) {
    return '-'
  }

  return `${referenceLabel || referenceType || 'Reference'}${referenceId === null ? '' : ` #${referenceId}`}`
}
