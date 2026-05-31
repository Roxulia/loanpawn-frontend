import type { ReactNode } from 'react'

type FormGroupColumns = 1 | 2 | 3

type FormGroupProps = {
  children: ReactNode
  columns?: FormGroupColumns
  description?: string
  title?: string
}

export function FormGroup({ children, columns = 2, description, title }: FormGroupProps) {
  return (
    <section className="ui-form-group">
      {(title || description) && (
        <header className="ui-form-group__header">
          {title && <h2 className="ui-form-group__title">{title}</h2>}
          {description && <p className="ui-form-group__description">{description}</p>}
        </header>
      )}
      <div className={`ui-form-group__grid ui-form-group__grid--${columns}`}>{children}</div>
    </section>
  )
}
