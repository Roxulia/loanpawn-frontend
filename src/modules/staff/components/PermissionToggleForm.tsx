import { useMemo, useState } from 'react'
import { Button, Input } from '../../../components/atoms'
import { ActionBar, Card } from '../../../components/molecules'
import type { PermissionCode } from '../../auth'
import { assignablePermissionCodes, permissionGroups, type PermissionGroup } from '../permissionLabels'

type Props = {
  disabled?: boolean; initialValue?: PermissionCode[]; isSaving?: boolean
  onChange?: (permissions: PermissionCode[]) => void; onSave?: () => void
  readOnly?: boolean; value: PermissionCode[]
}

type AccordionProps = { className: string; disabled: boolean; expanded: Set<string>; groups: PermissionGroup[]; onGroupAction: (group: PermissionGroup, enabled: boolean) => void; onToggle: (permission: PermissionCode) => void; readOnly: boolean; selected: Set<PermissionCode>; setExpanded: (label: string, open: boolean) => void }

function PermissionAccordion({ className, disabled, expanded, groups, onGroupAction, onToggle, readOnly, selected, setExpanded }: AccordionProps) {
  return <div className={className}>{groups.map((group) => {
    const enabledCount = group.permissions.filter(({ code }) => selected.has(code)).length
    return <details key={group.label} open={expanded.has(group.label)} onToggle={(event) => setExpanded(group.label, event.currentTarget.open)}>
      <summary><span>{group.label}</span><span>{enabledCount}/{group.permissions.length} enabled</span></summary>
      {!readOnly && <div className="permission-accordion__group-actions"><Button disabled={disabled || enabledCount === group.permissions.length} onClick={() => onGroupAction(group, true)} variant="secondary">Enable All</Button><Button disabled={disabled || enabledCount === 0} onClick={() => onGroupAction(group, false)} variant="secondary">Clear</Button></div>}
      <div className="permission-accordion__items">{group.permissions.map((permission) => {
        const isEnabled = selected.has(permission.code)
        return <button aria-pressed={isEnabled} className={isEnabled ? 'permission-toggle is-active' : 'permission-toggle'} disabled={disabled || readOnly} key={permission.code} onClick={() => onToggle(permission.code)} type="button">
          <span className="permission-toggle__label">{permission.label}</span><span className="permission-toggle__description">{permission.description}</span><span className="permission-toggle__state">{isEnabled ? 'On' : 'Off'}</span>
        </button>
      })}</div>
    </details>
  })}</div>
}

export function PermissionToggleForm({ disabled = false, initialValue = [], isSaving = false, onChange, onSave, readOnly = false, value }: Props) {
  const selected = useMemo(() => new Set<PermissionCode>(value.includes('access_all') ? assignablePermissionCodes : value), [value])
  const initial = useMemo(() => new Set<PermissionCode>(initialValue.includes('access_all') ? assignablePermissionCodes : initialValue), [initialValue])
  const [query, setQuery] = useState('')
  const [expanded, setExpandedState] = useState<Set<string>>(new Set())
  const filteredGroups = useMemo(() => permissionGroups.map((group) => ({ ...group, permissions: group.permissions.filter((permission) => {
    if (readOnly && !selected.has(permission.code)) return false
    const search = query.trim().toLowerCase()
    return !search || `${group.label} ${permission.label} ${permission.description}`.toLowerCase().includes(search)
  }) })).filter((group) => group.permissions.length > 0), [query, readOnly, selected])
  const changed = assignablePermissionCodes.some((code) => selected.has(code) !== initial.has(code))
  const setExpanded = (label: string, open: boolean) => setExpandedState((current) => {
    const next = new Set(current)
    if (open) next.add(label)
    else next.delete(label)
    return next
  })
  const update = (next: Set<PermissionCode>) => onChange?.(assignablePermissionCodes.filter((code) => next.has(code)))
  const toggle = (code: PermissionCode) => {
    const next = new Set(selected)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    update(next)
  }
  const groupAction = (group: PermissionGroup, enabled: boolean) => {
    const next = new Set(selected)
    group.permissions.forEach(({ code }) => {
      if (enabled) next.add(code)
      else next.delete(code)
    })
    update(next)
  }
  const expandAll = () => setExpandedState(new Set(filteredGroups.map(({ label }) => label)))

  return <Card title="Permissions" description={readOnly ? `${selected.size} permissions enabled.` : `${selected.size} of ${assignablePermissionCodes.length} permissions enabled.`}>
    <div className="permission-accordion__toolbar"><Input aria-label="Search permissions" onChange={(event) => setQuery(event.target.value)} placeholder="Search permissions" value={query} /><Button onClick={expandAll} variant="secondary">Expand All</Button><Button onClick={() => setExpandedState(new Set())} variant="secondary">Collapse All</Button></div>
    {filteredGroups.length === 0 ? <p className="permission-accordion__empty">{readOnly && !query ? 'No permissions are enabled for this staff member.' : 'No permissions match your search.'}</p> : <>
      <PermissionAccordion className="permission-accordion permission-accordion--desktop" disabled={disabled || isSaving} expanded={expanded} groups={filteredGroups} onGroupAction={groupAction} onToggle={toggle} readOnly={readOnly} selected={selected} setExpanded={setExpanded} />
      <PermissionAccordion className="permission-accordion permission-accordion--mobile" disabled={disabled || isSaving} expanded={expanded} groups={filteredGroups} onGroupAction={groupAction} onToggle={toggle} readOnly={readOnly} selected={selected} setExpanded={setExpanded} />
    </>}
    {!readOnly && onSave && <ActionBar><Button disabled={disabled || isSaving || !changed} onClick={() => update(initial)} variant="secondary">Reset</Button><Button disabled={disabled || isSaving || !changed} isLoading={isSaving} onClick={onSave} variant="primary">Save Permissions</Button></ActionBar>}
  </Card>
}
