import { moduleRegistry } from '../../modules/moduleRegistry'
import { Card, SectionHeader, StatCard } from '../../components/molecules'
import { Badge } from '../../components/atoms'
import { getLocalizedModule, useUiLocale } from '../../locales/UiLocale'

export function DashboardPage() {
  const { locale } = useUiLocale()
  const visibleModules = moduleRegistry.slice(0, 6).map((module) => getLocalizedModule(module, locale))

  return (
    <section className="page">
      <SectionHeader
        title="Dashboard"
        subtitle="Trusted customers, nearly expired slips, income, and material price analysis."
      />

      <div className="module-grid">
        <StatCard label="Active workspaces" value={String(moduleRegistry.length)} trend="Server routes mapped" />
        <StatCard label="Pawn operations" value="4" trend="Slip lifecycle ready" />
        <StatCard label="Tenant operations" value="7" trend="Staff and finance ready" />
      </div>

      <div className="module-grid">
        {visibleModules.map((module) => (
          <Card
            key={module.id}
            title={module.label}
            description={module.description}
            action={<Badge tone={module.serverModule === 'PawnModule' ? 'info' : 'warning'}>{module.serverModule}</Badge>}
          >
            <p className="muted">{module.apiBasePath}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
