import type { FormHTMLAttributes, ReactNode } from 'react'
import { Card } from '../molecules'

type FormPanelProps = FormHTMLAttributes<HTMLFormElement> & {
  actions: ReactNode
  children: ReactNode
  description?: string
  title: string
}

export function FormPanel({ actions, children, description, title, ...formProps }: FormPanelProps) {
  return (
    <form className="ui-form" {...formProps}>
      <Card
        description={description}
        footer={actions}
        title={title}
      >
        {children}
      </Card>
    </form>
  )
}
