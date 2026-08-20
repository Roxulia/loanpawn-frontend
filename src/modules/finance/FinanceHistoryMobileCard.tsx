import type { ReactNode } from 'react'

type FinanceHistoryMobileCardProps = {
  actions?: ReactNode
  amount: ReactNode
  eyebrow: ReactNode
  meta: ReactNode
  onClick?: () => void
  status: ReactNode
  statusTone: 'active' | 'due'
  title: ReactNode
}

export function FinanceHistoryMobileCard({
  actions,
  amount,
  eyebrow,
  meta,
  onClick,
  status,
  statusTone,
  title,
}: FinanceHistoryMobileCardProps) {
  const content = <>
      <header className="finance-history-mobile-card__header">
        <div className="finance-history-mobile-card__identity">
          <small>{eyebrow}</small>
          <strong>{title}</strong>
        </div>
        <span className={`finance-history-mobile-card__status finance-history-mobile-card__status--${statusTone}`}>
          {status}
        </span>
      </header>

      <div className="finance-history-mobile-card__amount">
        <span>Amount</span>
        <strong>{amount}</strong>
      </div>

      <footer className="finance-history-mobile-card__footer">
        <span className="finance-history-mobile-card__meta">{meta}</span>
        {actions ? <div className="finance-history-mobile-card__actions">{actions}</div> : null}
      </footer>
    </>

  if (onClick) {
    return <button className="finance-history-mobile-card finance-history-mobile-card--button" onClick={onClick} type="button">{content}</button>
  }

  return <article className="finance-history-mobile-card">{content}</article>
}
