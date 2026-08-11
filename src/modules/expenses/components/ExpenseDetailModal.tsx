import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import type { TenantExpense } from '../../../dataobjects/tenant/finance'
import { tenantResourceService } from '../../../services/tenant/tenantResourceService'
import { formatDate, formatMoney, getStringField } from '../../finance/financeFormat'

type ExpenseDetailModalProps = {
  expense: TenantExpense | null
  onClose: () => void
}

export function ExpenseDetailModal({ expense, onClose }: ExpenseDetailModalProps) {
  if (!expense) return null

  return <LoadedExpenseDetailModal expense={expense} key={expense.code} onClose={onClose} />
}

function LoadedExpenseDetailModal({ expense, onClose }: { expense: TenantExpense; onClose: () => void }) {
  const [detail, setDetail] = useState<TenantExpense | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    tenantResourceService.getExpense(expense.code)
      .then((response) => {
        if (isMounted) setDetail(response)
      })
      .catch((loadError) => {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load expense details.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [expense])

  const content = isLoading
    ? <LoadingState rows={4} />
    : error
      ? <Alert message={error} title="Expense detail failed" tone="danger" />
      : detail
        ? <ExpenseDetailContent expense={detail} />
        : null

  return (
    <div className="expense-detail-backdrop" onMouseDown={onClose} role="presentation">
      <ExpenseDetailDesktop content={content} expense={expense} onClose={onClose} />
      <ExpenseDetailMobile content={content} expense={expense} onClose={onClose} />
    </div>
  )
}

function ExpenseDetailDesktop({ content, expense, onClose }: DetailPresentationProps) {
  return (
    <section aria-modal="true" className="expense-detail-desktop" onMouseDown={(event) => event.stopPropagation()} role="dialog">
      <ExpenseDetailHeader expense={expense} onClose={onClose} />
      <div className="expense-detail-desktop__body">{content}</div>
    </section>
  )
}

function ExpenseDetailMobile({ content, expense, onClose }: DetailPresentationProps) {
  return (
    <section aria-modal="true" className="expense-detail-mobile" onMouseDown={(event) => event.stopPropagation()} role="dialog">
      <ExpenseDetailHeader expense={expense} onClose={onClose} />
      <div className="expense-detail-mobile__body">{content}</div>
    </section>
  )
}

type DetailPresentationProps = {
  content: ReactNode
  expense: TenantExpense
  onClose: () => void
}

function ExpenseDetailHeader({ expense, onClose }: Pick<DetailPresentationProps, 'expense' | 'onClose'>) {
  return (
    <header className="expense-detail-header">
      <div>
        <span>Expense details</span>
        <h2>{expense.description}</h2>
      </div>
      <Button aria-label="Close expense details" onClick={onClose} variant="secondary">Close</Button>
    </header>
  )
}

function ExpenseDetailContent({ expense }: { expense: TenantExpense }) {
  const imageUrl = getStringField(expense, 'image_reference_url', 'imageReferenceUrl')
  const expenseType = getStringField(expense, 'expense_type_name', 'expenseTypeName')
  const creator = getStringField(expense, 'creator_name', 'creatorName')

  return (
    <div className="expense-detail-content">
      <div className="expense-detail-content__image">
        {imageUrl
          ? <img alt={`Reference for ${expense.description}`} src={imageUrl} />
          : <div className="expense-detail-content__image-empty">No reference image</div>}
      </div>
      <dl className="expense-detail-content__metadata">
        <DetailField label="Code" value={expense.code} />
        <DetailField label="Amount" value={formatMoney(expense.amount)} />
        <DetailField label="Expense type" value={expenseType || '-'} />
        <DetailField label="Created by" value={creator || '-'} />
        <DetailField label="Created" value={formatDate(getStringField(expense, 'created_at', 'createdAt'))} />
        <DetailField label="Updated" value={formatDate(getStringField(expense, 'updated_at', 'updatedAt'))} />
        <div className="expense-detail-content__description">
          <dt>Description</dt>
          <dd>{expense.description}</dd>
        </div>
      </dl>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>
}
