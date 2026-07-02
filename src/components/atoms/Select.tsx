import { Children, cloneElement, isValidElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type FocusEventHandler, type ReactNode, type SelectHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { translateNode, useUiLocale } from '../../locales/UiLocale'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean
}

type SelectOptionItem = {
  disabled: boolean
  label: ReactNode
  value: string
}

type SelectMenuPosition = {
  left: number
  maxHeight: number
  maxWidth: number
  minWidth: number
  top?: number
  bottom?: number
}

const SELECT_MENU_GAP = 4
const SELECT_MENU_VIEWPORT_PADDING = 8

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
  const [menuPosition, setMenuPosition] = useState<SelectMenuPosition | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const translatedChildren = translateOptionChildren(children, locale)
  const options = useMemo(() => getSelectOptions(translatedChildren), [translatedChildren])
  const selectedValue = value !== undefined ? String(value) : internalValue
  const selectedOption = options.find((option) => option.value === selectedValue)
  const menuId = id ? `${id}-menu` : undefined

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current

    if (!button) {
      return
    }

    const rect = button.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const minWidth = rect.width
    const left = Math.min(
      Math.max(SELECT_MENU_VIEWPORT_PADDING, rect.left),
      Math.max(SELECT_MENU_VIEWPORT_PADDING, viewportWidth - minWidth - SELECT_MENU_VIEWPORT_PADDING),
    )
    const maxWidth = Math.max(minWidth, viewportWidth - left - SELECT_MENU_VIEWPORT_PADDING)
    const spaceBelow = viewportHeight - rect.bottom - SELECT_MENU_GAP - SELECT_MENU_VIEWPORT_PADDING
    const spaceAbove = rect.top - SELECT_MENU_GAP - SELECT_MENU_VIEWPORT_PADDING
    const openAbove = spaceAbove > spaceBelow && spaceBelow < rect.height * 4
    const availableHeight = Math.max(rect.height, openAbove ? spaceAbove : spaceBelow)

    setMenuPosition({
      bottom: openAbove ? viewportHeight - rect.top + SELECT_MENU_GAP : undefined,
      left,
      maxHeight: availableHeight,
      maxWidth,
      minWidth,
      top: openAbove ? undefined : rect.bottom + SELECT_MENU_GAP,
    })
  }, [])

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node

      if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)

    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null)
      return
    }

    updateMenuPosition()
  }, [isOpen, selectedValue, options.length, updateMenuPosition])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isOpen, updateMenuPosition])

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

  const menu = isOpen && menuPosition
    ? createPortal(
      <div
        className="ui-select__menu ui-select__menu--portal"
        id={menuId}
        ref={menuRef}
        role="listbox"
        style={{
          bottom: menuPosition.bottom,
          left: menuPosition.left,
          maxHeight: menuPosition.maxHeight,
          maxWidth: menuPosition.maxWidth,
          minWidth: menuPosition.minWidth,
          top: menuPosition.top,
        } satisfies CSSProperties}
      >
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
      </div>,
      document.body,
    )
    : null

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
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={hasError || undefined}
        className="ui-select"
        disabled={disabled}
        id={id}
        onBlur={onBlur as FocusEventHandler<HTMLButtonElement> | undefined}
        onClick={() => setIsOpen((current) => !current)}
        ref={buttonRef}
        type="button"
      >
        <span>{selectedOption?.label ?? t('Select')}</span>
      </button>
      {menu}
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
