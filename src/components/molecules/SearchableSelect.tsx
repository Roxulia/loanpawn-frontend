import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '../atoms'

type SearchableSelectProps<TOption> = {
  emptyMessage?: string
  error?: string | null
  getOptionDescription?: (option: TOption) => string
  getOptionLabel: (option: TOption) => string
  getOptionValue: (option: TOption) => string
  hasError?: boolean
  id: string
  isLoading?: boolean
  loadingMessage?: string
  onChange: (value: string) => void
  onSearchChange?: (query: string) => void
  options: TOption[]
  placeholder?: string
  value: string
}

export function SearchableSelect<TOption>({
  emptyMessage = 'No options found.',
  error = null,
  getOptionDescription,
  getOptionLabel,
  getOptionValue,
  hasError = false,
  id,
  isLoading = false,
  loadingMessage = 'Loading options...',
  onChange,
  onSearchChange,
  options,
  placeholder = 'Search options',
  value,
}: SearchableSelectProps<TOption>) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const selected = options.find((option) => getOptionValue(option) === value) ?? null
  const visibleOptions = useMemo(() => {
    if (onSearchChange) return options
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return options

    return options.filter((option) => `${getOptionLabel(option)} ${getOptionDescription?.(option) ?? ''}`.toLocaleLowerCase().includes(normalizedQuery))
  }, [getOptionDescription, getOptionLabel, onSearchChange, options, query])
  const menuId = `${id}-options`

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery)
    setIsOpen(true)
    setActiveIndex(-1)
    onSearchChange?.(nextQuery)
    if (value) onChange('')
  }

  function choose(option: TOption) {
    onChange(getOptionValue(option))
    setQuery('')
    setIsOpen(false)
    setActiveIndex(-1)
  }

  return (
    <div className="ui-searchable-select" ref={rootRef}>
      <Input
        aria-activedescendant={activeIndex >= 0 ? `${menuId}-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={menuId}
        aria-expanded={isOpen}
        autoComplete="off"
        hasError={hasError}
        id={id}
        onChange={(event) => updateQuery(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { setIsOpen(false); return }
          if (event.key === 'ArrowDown') { event.preventDefault(); setIsOpen(true); setActiveIndex((index) => Math.min(index + 1, visibleOptions.length - 1)); return }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); return }
          if (event.key === 'Enter' && activeIndex >= 0 && visibleOptions[activeIndex]) { event.preventDefault(); choose(visibleOptions[activeIndex]) }
        }}
        placeholder={placeholder}
        role="combobox"
        type="search"
        value={selected ? getOptionLabel(selected) : query}
      />
      {isOpen && (
        <div className="ui-searchable-select__menu" id={menuId} role="listbox">
          {isLoading ? <span className="ui-searchable-select__status">{loadingMessage}</span>
            : error ? <span className="ui-searchable-select__status ui-searchable-select__status--error">{error}</span>
              : visibleOptions.length ? visibleOptions.map((option, index) => (
                <button
                  aria-selected={getOptionValue(option) === value}
                  className={['ui-searchable-select__option', activeIndex === index ? 'is-active' : ''].filter(Boolean).join(' ')}
                  id={`${menuId}-${index}`}
                  key={getOptionValue(option)}
                  onClick={() => choose(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  type="button"
                >
                  <strong>{getOptionLabel(option)}</strong>
                  {getOptionDescription && <span>{getOptionDescription(option)}</span>}
                </button>
              )) : <span className="ui-searchable-select__status">{emptyMessage}</span>}
        </div>
      )}
    </div>
  )
}
