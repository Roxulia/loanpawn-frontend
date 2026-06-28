import { Children, cloneElement, isValidElement, useEffect, useMemo, useRef, useState, type ChangeEvent, type FocusEventHandler, type ReactNode, type SelectHTMLAttributes } from 'react'
import { translateNode, useUiLocale } from '../../locales/UiLocale'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean
}

type SelectOptionItem = {
  disabled: boolean
  label: ReactNode
  value: string
}

export function Select({
  children,
  className = '',
  disabled = false,
  hasError = false,
  onBlur,
  onChange,
  value,
  defaultValue,
  id,
  ...props
}: SelectProps) {
  const { locale, t } = useUiLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ''))
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const translatedChildren = translateOptionChildren(children, locale)
  const options = useMemo(() => getSelectOptions(translatedChildren), [translatedChildren])
  const selectedValue = value !== undefined ? String(value) : internalValue
  const selectedOption = options.find((option) => option.value === selectedValue)

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)

    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [])

  function handleSelect(nextValue: string) {
    if (disabled) {
      return
    }

    setInternalValue(nextValue)
    setIsOpen(false)
    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>)
  }

  return (
    <div className={['ui-select-combobox', className].filter(Boolean).join(' ')} ref={wrapperRef}>
      <select
        aria-hidden="true"
        aria-invalid={hasError || undefined}
        className="ui-select-native"
        disabled={disabled}
        id={id ? `${id}-native` : undefined}
        onBlur={onBlur}
        onChange={onChange}
        tabIndex={-1}
        value={selectedValue}
        {...props}
      >
        {translatedChildren}
      </select>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={hasError || undefined}
        className="ui-select"
        disabled={disabled}
        id={id}
        onBlur={onBlur as FocusEventHandler<HTMLButtonElement> | undefined}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption?.label ?? t('Select')}</span>
      </button>
      {isOpen && (
        <div className="ui-select__menu" role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === selectedValue}
              className="ui-select__option"
              disabled={option.disabled}
              key={`${option.value}-${String(option.label)}`}
              onClick={() => handleSelect(option.value)}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
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

function getSelectOptions(children: ReactNode): SelectOptionItem[] {
  const options: SelectOptionItem[] = []

  Children.forEach(children, (child) => {
    if (!isValidElement<{ children?: ReactNode; disabled?: boolean; value?: string | number }>(child)) {
      return
    }

    if (child.type === 'option') {
      options.push({
        disabled: Boolean(child.props.disabled),
        label: child.props.children,
        value: String(child.props.value ?? child.props.children ?? ''),
      })
      return
    }

    if (child.type === 'optgroup') {
      options.push(...getSelectOptions(child.props.children))
    }
  })

  return options
}
