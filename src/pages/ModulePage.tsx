import { EmptyState } from '../components/feedback/EmptyState'
import { Badge } from '../components/atoms'
import { Card, SectionHeader } from '../components/molecules'
import type { ModuleDefinition } from '../modules/moduleRegistry'

type ModulePageProps = {
  module: ModuleDefinition
}

export function ModulePage({ module }: ModulePageProps) {
  return (
    <section className="page">
      <SectionHeader
        title={module.label}
        subtitle={module.description}
        action={<Badge tone={module.serverModule === 'PawnModule' ? 'info' : 'warning'}>{module.serverModule}</Badge>}
      />

      <Card title={`${module.label} workspace`} description={module.apiBasePath}>
        <EmptyState
          title="Page controls pending"
          description={`Service and dataobject contracts are ready for ${module.apiBasePath}.`}
        />
      </Card>
    </section>
  )
}
