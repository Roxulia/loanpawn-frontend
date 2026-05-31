type StatCardProps = {
  label: string
  trend?: string
  value: string
}

export function StatCard({ label, trend, value }: StatCardProps) {
  return (
    <article className="ui-stat-card">
      <span className="ui-stat-card__label">{label}</span>
      <strong className="ui-stat-card__value">{value}</strong>
      {trend && <span className="ui-stat-card__trend">{trend}</span>}
    </article>
  )
}
