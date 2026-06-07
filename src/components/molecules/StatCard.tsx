import { useUiLocale } from '../../locales/UiLocale'

type StatCardProps = {
  label: string
  trend?: string
  value: string
}

export function StatCard({ label, trend, value }: StatCardProps) {
  const { t } = useUiLocale()

  return (
    <article className="ui-stat-card">
      <span className="ui-stat-card__label">{t(label)}</span>
      <strong className="ui-stat-card__value">{value}</strong>
      {trend && <span className="ui-stat-card__trend">{t(trend)}</span>}
    </article>
  )
}
