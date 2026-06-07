import { Children, cloneElement, isValidElement, type ReactNode, type SelectHTMLAttributes } from 'react'
import { translateNode, useUiLocale } from '../../locales/UiLocale'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean
}

export function Select({ children, className = '', hasError = false, ...props }: SelectProps) {
  const { locale } = useUiLocale()

  return (
    <select
      aria-invalid={hasError || undefined}
      className={['ui-select', className].filter(Boolean).join(' ')}
      {...props}
    >
      {translateOptionChildren(children, locale)}
    </select>
  )
}

function translateOptionChildren(
  children: ReactNode,
  locale: ReturnType<typeof useUiLocale>['locale'],
): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) {
      return translateNode(child, locale)
    }

    return cloneElement(child, {
      children: translateOptionChildren(child.props.children, locale),
    })
  })
}
