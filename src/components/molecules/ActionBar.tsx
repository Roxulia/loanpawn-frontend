import type { ReactNode } from 'react'

type ActionBarProps = {
  children: ReactNode
}

export function ActionBar({ children }: ActionBarProps) {
  return <div className="ui-action-bar">{children}</div>
}
