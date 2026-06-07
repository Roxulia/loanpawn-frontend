import { translateNode, useUiLocale } from '../../locales/UiLocale'

export type KeyValueItem = {
  key: string
  value: React.ReactNode
}

type KeyValueListProps = {
  items: KeyValueItem[]
}

export function KeyValueList({ items }: KeyValueListProps) {
  const { locale, t } = useUiLocale()

  return (
    <dl className="ui-key-value-list">
      {items.map((item) => (
        <div className="ui-key-value-list__row" key={item.key}>
          <dt className="ui-key-value-list__key">{t(item.key)}</dt>
          <dd className="ui-key-value-list__value">{translateNode(item.value, locale)}</dd>
        </div>
      ))}
    </dl>
  )
}
