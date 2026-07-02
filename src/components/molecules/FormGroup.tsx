import type { ReactNode } from 'react'
import { useUiLocale } from '../../locales/UiLocale'

type FormGroupColumns = 1 | 2 | 3

type FormGroupProps = {
  children: ReactNode
  className?: string
  columns?: FormGroupColumns
  description?: string
  title?: string
}

export function FormGroup({ children, className = '', columns = 2, description, title }: FormGroupProps) {
  const { t } = useUiLocale()

  return (
    <section className={['ui-form-group', className].filter(Boolean).join(' ')}>
      {(title || description) && (
        <header className="ui-form-group__header">
          {title && <h2 className="ui-form-group__title">{t(title)}</h2>}
          {description && <p className="ui-form-group__description">{t(description)}</p>}
        </header>
      )}
      <div className={`ui-form-group__grid ui-form-group__grid--${columns}`}>{children}</div>
    </section>
  )
}
