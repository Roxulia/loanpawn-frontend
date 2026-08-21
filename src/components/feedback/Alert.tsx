import { useEffect, type ReactNode } from 'react'
import { Button } from '../atoms'
import { useUiLocale } from '../../locales/UiLocale'

type AlertTone = 'success' | 'warning' | 'danger' | 'info'

type AlertProps = {
  action?: ReactNode
  message: string
  onDismiss?: () => void
  title?: string
  tone?: AlertTone
}

const toneIcon: Record<AlertTone, string> = {
  danger: '!',
  info: 'i',
  success: '✓',
  warning: '!',
}

export function Alert({ action, message, onDismiss, title, tone = 'info' }: AlertProps) {
  const { t } = useUiLocale()

  useEffect(() => {
    if (!onDismiss) return
    const timeout = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(timeout)
  }, [message, onDismiss])

  return (
    <section className={`ui-alert ui-alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className="ui-alert__icon" aria-hidden="true">{toneIcon[tone]}</span>
      <div className="ui-alert__content">
        {title && <strong className="ui-alert__title">{t(title)}</strong>}
        <p className="ui-alert__message">{t(message)}</p>
      </div>
      {action && <div className="ui-alert__action">{action}</div>}
      {onDismiss && (
        <Button aria-label="Dismiss notification" onClick={onDismiss} variant="ghost">
          x
        </Button>
      )}
    </section>
  )
}
