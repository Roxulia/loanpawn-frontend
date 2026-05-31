export type KeyValueItem = {
  key: string
  value: React.ReactNode
}

type KeyValueListProps = {
  items: KeyValueItem[]
}

export function KeyValueList({ items }: KeyValueListProps) {
  return (
    <dl className="ui-key-value-list">
      {items.map((item) => (
        <div className="ui-key-value-list__row" key={item.key}>
          <dt className="ui-key-value-list__key">{item.key}</dt>
          <dd className="ui-key-value-list__value">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
