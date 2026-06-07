import type { InputHTMLAttributes } from 'react'
import { Input, Label } from '../atoms'
import { useUiLocale } from '../../locales/UiLocale'

type SearchFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export function SearchField({ id = 'search', label = 'Search', ...props }: SearchFieldProps) {
  const { t } = useUiLocale()

  return (
    <div className="ui-search-field">
      <Label htmlFor={id}>{label}</Label>
      <div className="ui-search-field__control">
        <svg className="ui-search-field__icon" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          <path d="m16 16 5 5" />
        </svg>
        <Input id={id} type="search" {...props} aria-label={props['aria-label'] ?? t(label)} />
      </div>
    </div>
  )
}
