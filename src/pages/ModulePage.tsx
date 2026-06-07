import { EmptyState } from '../components/feedback/EmptyState'
import { Badge } from '../components/atoms'
import { Card, SectionHeader } from '../components/molecules'
import { getLocalizedModule, useUiLocale } from '../locales/UiLocale'
import type { ModuleDefinition } from '../modules/moduleRegistry'

type ModulePageProps = {
  module: ModuleDefinition
}

export function ModulePage({ module }: ModulePageProps) {
  const { locale } = useUiLocale()
  const localizedModule = getLocalizedModule(module, locale)

  return (
    <section className="page">
      <SectionHeader
        title={localizedModule.label}
        subtitle={localizedModule.description}
        action={<Badge tone={module.serverModule === 'PawnModule' ? 'info' : 'warning'}>{module.serverModule}</Badge>}
      />

      <Card title={`${localizedModule.label} workspace`} description={module.apiBasePath}>
        <EmptyState
          title="Page controls pending"
          description={`Service and dataobject contracts are ready for ${module.apiBasePath}.`}
        />
      </Card>
    </section>
  )
}
