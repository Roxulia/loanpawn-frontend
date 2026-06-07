import type { ReactNode } from 'react'
import { useUiLocale } from '../../locales/UiLocale'

type CardProps = {
  action?: ReactNode
  children: ReactNode
  description?: string
  footer?: ReactNode
  title?: string
}

export function Card({ action, children, description, footer, title }: CardProps) {
  const { t } = useUiLocale()

  return (
    <section className="ui-card">
      {(title || description || action) && (
        <header className="ui-card__header">
          <div>
            {title && <h2 className="ui-card__title">{t(title)}</h2>}
            {description && <p className="ui-card__description">{t(description)}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="ui-card__body">{children}</div>
      {footer && <footer className="ui-card__footer">{footer}</footer>}
    </section>
  )
}
