import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { translateNode, useUiLocale } from '../../locales/UiLocale'

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  variant?: ButtonVariant
}

export function Button({
  children,
  className = '',
  disabled,
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  const { locale, t } = useUiLocale()
  const classes = [
    'ui-button',
    `ui-button--${variant}`,
    fullWidth ? 'ui-button--full' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      type={type}
      {...props}
      aria-label={typeof props['aria-label'] === 'string' ? t(props['aria-label']) : props['aria-label']}
      title={typeof props.title === 'string' ? t(props.title) : props.title}
    >
      {isLoading ? <span className="ui-spinner" aria-hidden="true" /> : leftIcon}
      <span>{translateNode(children, locale)}</span>
      {rightIcon}
    </button>
  )
}
