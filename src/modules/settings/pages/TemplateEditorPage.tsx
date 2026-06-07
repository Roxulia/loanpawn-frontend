import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Button, Input, Select } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ActionBar, Card, FormField, SectionHeader } from '../../../components/molecules'
import { Modal } from '../../../components/organisms'
import { LocalizedText } from '../../../locales/UiLocale'
import { settingsService, type SlipDocumentLayout } from '../services/settingsService'

type EditorTab = 'header' | 'footer'
type ComponentType = 'text' | 'tenant_logo' | 'tenant_name' | 'tenant_phone' | 'tenant_address' | 'slip_number' | 'barcode' | 'divider' | 'spacer'

type SlipLayoutComponent = {
  props?: Record<string, unknown>
  style?: Record<string, unknown>
  type: ComponentType
}

type PaperPreset = {
  heightMm: number
  label: string
  type: string
  widthMm: number
}

const dummySlipNo = 'DUMMY-SLIP-0001'

const paperPresets: PaperPreset[] = [
  { type: 'A4', label: 'A4', widthMm: 210, heightMm: 297 },
  { type: 'A5', label: 'A5', widthMm: 148, heightMm: 210 },
  { type: 'Receipt80', label: 'MM80', widthMm: 80, heightMm: 210 },
  { type: 'Receipt58', label: 'MM58', widthMm: 58, heightMm: 180 },
]

const componentPalette: Array<{ label: string; type: ComponentType }> = [
  { type: 'text', label: 'Text' },
  { type: 'tenant_logo', label: 'Logo' },
  { type: 'tenant_name', label: 'Shop Name' },
  { type: 'tenant_phone', label: 'Phone' },
  { type: 'tenant_address', label: 'Address' },
  { type: 'slip_number', label: 'Slip No' },
  { type: 'barcode', label: 'Barcode' },
  { type: 'divider', label: 'Divider' },
  { type: 'spacer', label: 'Spacer' },
]

const emptyLayout: SlipDocumentLayout = {
  version: 1,
  components: [],
}

const starterHeaderLayout: SlipDocumentLayout = {
  version: 1,
  components: [
    createComponent('text', 54, 8),
    createComponent('divider', 8, 22),
  ],
}

const starterFooterLayout: SlipDocumentLayout = {
  version: 1,
  components: [
    createComponent('divider', 8, 8),
    createComponent('tenant_address', 8, 14),
    createComponent('tenant_phone', 8, 20),
  ],
}

export function TemplateEditorPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<EditorTab>('header')
  const [paperType, setPaperType] = useState('A4')
  const [initialHeaderLayout, setInitialHeaderLayout] = useState<SlipDocumentLayout>(emptyLayout)
  const [initialFooterLayout, setInitialFooterLayout] = useState<SlipDocumentLayout>(emptyLayout)
  const [headerLayout, setHeaderLayout] = useState<SlipDocumentLayout>(emptyLayout)
  const [footerLayout, setFooterLayout] = useState<SlipDocumentLayout>(emptyLayout)
  const [updateKey, setUpdateKey] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hasTemplate, setHasTemplate] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const activeLayout = activeTab === 'header' ? headerLayout : footerLayout
  const activeInitialLayout = activeTab === 'header' ? initialHeaderLayout : initialFooterLayout
  const components = normalizeComponents(activeLayout)
  const selectedComponent = selectedIndex === null ? null : components[selectedIndex] ?? null
  const paper = paperPresets.find((preset) => preset.type === paperType) ?? paperPresets[0]

  const hasChanges = useMemo(() => {
    return stringifyLayout(headerLayout) !== stringifyLayout(initialHeaderLayout)
      || stringifyLayout(footerLayout) !== stringifyLayout(initialFooterLayout)
  }, [footerLayout, headerLayout, initialFooterLayout, initialHeaderLayout])

  const loadLayouts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await settingsService.getSlipLayouts()
      const header = normalizeLayout(response.slip_header_layout ?? emptyLayout)
      const footer = normalizeLayout(response.slip_footer_layout ?? emptyLayout)
      const templateExists = hasLayoutComponents(header) || hasLayoutComponents(footer)

      setHasTemplate(templateExists)
      setInitialHeaderLayout(header)
      setInitialFooterLayout(footer)
      setHeaderLayout(header)
      setFooterLayout(footer)
      setUpdateKey(response.update_key ?? 0)
      setSelectedIndex(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load template layouts.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadLayouts()
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadLayouts])

  async function saveLayouts() {
    setIsSaving(true)
    setError(null)
    setNotice(null)

    try {
      const response = await settingsService.updateSlipLayouts({
        slip_header_layout: headerLayout,
        slip_footer_layout: footerLayout,
        update_key: updateKey,
      })
      const nextHeader = normalizeLayout(response.slip_header_layout ?? headerLayout)
      const nextFooter = normalizeLayout(response.slip_footer_layout ?? footerLayout)

      setInitialHeaderLayout(nextHeader)
      setInitialFooterLayout(nextFooter)
      setHeaderLayout(nextHeader)
      setFooterLayout(nextFooter)
      setUpdateKey(response.update_key ?? updateKey)
      setHasTemplate(true)
      setNotice('Template layout saved successfully.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save template layout.')
    } finally {
      setIsSaving(false)
    }
  }

  async function previewLayouts() {
    setIsPreviewing(true)
    setError(null)
    setNotice(null)

    try {
      const html = await settingsService.previewDummySlipDocument(dummySlipNo, paperType)

      setPreviewHtml(html)
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Unable to load slip preview.')
    } finally {
      setIsPreviewing(false)
    }
  }

  function createTemplate() {
    setHeaderLayout(starterHeaderLayout)
    setFooterLayout(starterFooterLayout)
    setSelectedIndex(null)
    setNotice(null)
    setError(null)
    setHasTemplate(true)
  }

  function setActiveLayout(nextLayout: SlipDocumentLayout) {
    if (activeTab === 'header') {
      setHeaderLayout(nextLayout)
    } else {
      setFooterLayout(nextLayout)
    }
  }

  function addComponent(type: ComponentType) {
    const nextComponents = [...components, createComponent(type, 8, 8 + components.length * 8)]

    setActiveLayout({ ...activeLayout, version: activeLayout.version ?? 1, components: nextComponents })
    setSelectedIndex(nextComponents.length - 1)
  }

  function updateSelectedComponent(patch: Partial<SlipLayoutComponent>) {
    if (selectedIndex === null) {
      return
    }

    const nextComponents = components.map((component, index) => (
      index === selectedIndex ? { ...component, ...patch } : component
    ))

    setActiveLayout({ ...activeLayout, version: activeLayout.version ?? 1, components: nextComponents })
  }

  function updateSelectedProps(patch: Record<string, unknown>) {
    if (!selectedComponent) {
      return
    }

    updateSelectedComponent({ props: { ...selectedComponent.props, ...patch } })
  }

  function updateSelectedStyle(patch: Record<string, unknown>) {
    if (!selectedComponent) {
      return
    }

    updateSelectedComponent({ style: { ...selectedComponent.style, ...patch } })
  }

  function removeSelectedComponent() {
    if (selectedIndex === null) {
      return
    }

    setActiveLayout({ ...activeLayout, components: components.filter((_, index) => index !== selectedIndex) })
    setSelectedIndex(null)
  }

  function clearActiveChanges() {
    setActiveLayout(activeInitialLayout)
    setSelectedIndex(null)
    setNotice(null)
    setError(null)
  }

  if (isLoading) {
    return (
      <section className="page">
        <SectionHeader title="Template Editor" subtitle="Slip document header and footer layout controls." />
        <LoadingState rows={6} />
      </section>
    )
  }

  return (
    <section className="page">
      <SectionHeader title="Template Editor" subtitle="Slip document header and footer layout controls." />

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Template action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Template updated" tone="success" />}
      <Modal
        footer={<Button onClick={() => setPreviewHtml(null)} variant="secondary">Close</Button>}
        isOpen={previewHtml !== null}
        onClose={() => setPreviewHtml(null)}
        title="Slip Preview"
      >
        <iframe className="template-preview-frame" srcDoc={previewHtml ?? ''} title="Dummy slip document preview" />
      </Modal>

      {!hasTemplate ? (
        <Card title="No Template Found" description="Create a slip document template before editing header and footer layout sections.">
          <ActionBar>
            <Button onClick={() => navigate(routePaths.settings)} variant="secondary">Back to Settings</Button>
            <Button onClick={createTemplate} variant="primary">Create New Template</Button>
          </ActionBar>
        </Card>
      ) : (
        <div className="workflow-stack">
          <div className="template-editor-toolbar">
            <div className="module-tabs" role="tablist" aria-label="Template editor sections">
              <Button onClick={() => { setActiveTab('header'); setSelectedIndex(null) }} variant={activeTab === 'header' ? 'primary' : 'secondary'}>Header Editor</Button>
              <Button onClick={() => { setActiveTab('footer'); setSelectedIndex(null) }} variant={activeTab === 'footer' ? 'primary' : 'secondary'}>Footer Editor</Button>
            </div>
            <FormField id="template-paper-type" label="Paper Type">
              <Select id="template-paper-type" value={paperType} onChange={(event) => setPaperType(event.target.value)}>
                {paperPresets.map((preset) => (
                  <option key={preset.type} value={preset.type}>{preset.label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="template-editor-shell">
            <Card title="Component List">
              <div className="template-component-list">
                {componentPalette.map((component) => (
                  <Button key={component.type} fullWidth onClick={() => addComponent(component.type)} variant="secondary">
                    {component.label}
                  </Button>
                ))}
              </div>
            </Card>

            <Card title={`${activeTab === 'header' ? 'Header' : 'Footer'} Canvas`} description={`${paper.label} - ${paper.widthMm}mm x ${paper.heightMm}mm`}>
              <div className="template-canvas-scroll">
                <div
                  className="template-paper-canvas"
                  style={{
                    aspectRatio: `${paper.widthMm} / ${paper.heightMm}`,
                    width: `min(100%, ${paper.widthMm * 3}px)`,
                  }}
                >
                  {components.map((component, index) => (
                    <button
                      className={[
                        'template-canvas-component',
                        selectedIndex === index ? 'is-selected' : '',
                        `template-canvas-component--${component.type}`,
                      ].filter(Boolean).join(' ')}
                      key={`${component.type}-${index}`}
                      onClick={() => setSelectedIndex(index)}
                      style={componentPositionStyle(component, paper)}
                      type="button"
                    >
                      {componentLabel(component)}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Sizing">
              {selectedComponent ? (
                <div className="template-property-grid">
                  <FormField id="template-component-x" label="X (mm)">
                    <Input id="template-component-x" min={0} type="number" value={numberValue(selectedComponent.props?.x, 0)} onChange={(event) => updateSelectedProps({ x: Number(event.target.value) })} />
                  </FormField>
                  <FormField id="template-component-y" label="Y (mm)">
                    <Input id="template-component-y" min={0} type="number" value={numberValue(selectedComponent.props?.y, 0)} onChange={(event) => updateSelectedProps({ y: Number(event.target.value) })} />
                  </FormField>
                  <FormField id="template-component-width" label="Width (%)">
                    <Input id="template-component-width" min={10} max={100} type="number" value={numberValue(selectedComponent.style?.width_percent, 100)} onChange={(event) => updateSelectedStyle({ width_percent: Number(event.target.value) })} />
                  </FormField>
                  <FormField id="template-component-font-size" label="Font Size">
                    <Input id="template-component-font-size" min={6} type="number" value={numberValue(selectedComponent.style?.font_size_pt, 10)} onChange={(event) => updateSelectedStyle({ font_size_pt: Number(event.target.value) })} />
                  </FormField>
                  <FormField id="template-component-align" label="Align">
                    <Select id="template-component-align" value={stringValue(selectedComponent.style?.align, 'left')} onChange={(event) => updateSelectedStyle({ align: event.target.value })}>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </Select>
                  </FormField>
                  {selectedComponent.type === 'text' && (
                    <FormField id="template-component-text" label="Text">
                      <Input id="template-component-text" value={stringValue(selectedComponent.props?.text)} onChange={(event) => updateSelectedProps({ text: event.target.value })} />
                    </FormField>
                  )}
                  {selectedComponent.type === 'slip_number' && (
                    <FormField id="template-component-label" label="Label">
                      <Input id="template-component-label" value={stringValue(selectedComponent.props?.label, 'Slip No')} onChange={(event) => updateSelectedProps({ label: event.target.value })} />
                    </FormField>
                  )}
                  {selectedComponent.type === 'divider' && (
                    <FormField id="template-component-border" label="Border (mm)">
                      <Input id="template-component-border" min={0} step="0.1" type="number" value={numberValue(selectedComponent.props?.border_width_mm, 0.4)} onChange={(event) => updateSelectedProps({ border_width_mm: Number(event.target.value) })} />
                    </FormField>
                  )}
                  {(selectedComponent.type === 'barcode' || selectedComponent.type === 'spacer') && (
                    <FormField id="template-component-height" label="Height (mm)">
                      <Input id="template-component-height" min={1} type="number" value={numberValue(selectedComponent.props?.height_mm, selectedComponent.type === 'barcode' ? 10 : 4)} onChange={(event) => updateSelectedProps({ height_mm: Number(event.target.value) })} />
                    </FormField>
                  )}
                  <Button onClick={removeSelectedComponent} variant="danger">Remove Component</Button>
                </div>
              ) : (
                <p className="template-editor-empty"><LocalizedText text="Select a component on the canvas to update its coordinates and sizing." /></p>
              )}
            </Card>
          </div>

          <ActionBar>
            <Button onClick={() => navigate(routePaths.settings)} variant="secondary">Back to Settings</Button>
            <Button onClick={clearActiveChanges} variant="secondary">Clear</Button>
            <Button isLoading={isPreviewing} onClick={() => void previewLayouts()} variant="secondary">Preview</Button>
            <Button disabled={!hasChanges} isLoading={isSaving} onClick={() => void saveLayouts()} variant="primary">Save</Button>
          </ActionBar>
        </div>
      )}
    </section>
  )
}

function createComponent(type: ComponentType, x: number, y: number): SlipLayoutComponent {
  const style = { align: 'left', font_size_pt: 10, font_weight: 'normal', width_percent: type === 'divider' ? 92 : 40 }
  const base = { type, props: { x, y }, style }

  switch (type) {
    case 'text':
      return { ...base, props: { ...base.props, text: 'Pawn Loan Contract Slip' }, style: { ...style, align: 'center', font_size_pt: 14, font_weight: 'bold', width_percent: 48 } }
    case 'tenant_logo':
      return { ...base, props: { ...base.props, width_mm: 24 }, style: { ...style, width_percent: 18 } }
    case 'slip_number':
      return { ...base, props: { ...base.props, label: 'Slip No' } }
    case 'barcode':
      return { ...base, props: { ...base.props, height_mm: 10, show_text: true }, style: { ...style, width_percent: 38 } }
    case 'divider':
      return { ...base, props: { ...base.props, border_width_mm: 0.4 } }
    case 'spacer':
      return { ...base, props: { ...base.props, height_mm: 4 } }
    default:
      return base
  }
}

function normalizeLayout(layout: SlipDocumentLayout): SlipDocumentLayout {
  return {
    version: layout.version ?? 1,
    components: normalizeComponents(layout),
  }
}

function normalizeComponents(layout: SlipDocumentLayout) {
  return Array.isArray(layout.components)
    ? layout.components.filter(isLayoutComponent).map(normalizeComponent)
    : []
}

function normalizeComponent(component: SlipLayoutComponent): SlipLayoutComponent {
  return {
    ...component,
    props: {
      x: 0,
      y: 0,
      ...component.props,
    },
    style: {
      align: 'left',
      font_size_pt: 10,
      font_weight: 'normal',
      width_percent: 100,
      ...component.style,
    },
  }
}

function isLayoutComponent(component: unknown): component is SlipLayoutComponent {
  return Boolean(component && typeof component === 'object' && 'type' in component)
}

function stringifyLayout(layout: SlipDocumentLayout) {
  return JSON.stringify(layout)
}

function hasLayoutComponents(layout: SlipDocumentLayout | null | undefined) {
  return Array.isArray(layout?.components) && layout.components.length > 0
}

function componentPositionStyle(component: SlipLayoutComponent, paper: PaperPreset) {
  const x = clampNumber(numberValue(component.props?.x, 0), 0, paper.widthMm)
  const y = clampNumber(numberValue(component.props?.y, 0), 0, paper.heightMm)
  const width = clampNumber(numberValue(component.style?.width_percent, 100), 10, 100)

  return {
    fontSize: `${numberValue(component.style?.font_size_pt, 10)}pt`,
    fontWeight: stringValue(component.style?.font_weight, 'normal'),
    height: component.type === 'spacer' ? `${Math.max(numberValue(component.props?.height_mm, 4), 1)}mm` : undefined,
    left: `${(x / paper.widthMm) * 100}%`,
    textAlign: stringValue(component.style?.align, 'left') as 'left' | 'center' | 'right',
    top: `${(y / paper.heightMm) * 100}%`,
    width: `${Math.min(width, 100 - (x / paper.widthMm) * 100)}%`,
  }
}

function componentLabel(component: SlipLayoutComponent) {
  switch (component.type) {
    case 'text':
      return stringValue(component.props?.text, 'Text')
    case 'tenant_logo':
      return 'Tenant Logo'
    case 'tenant_name':
      return 'Tenant Name'
    case 'tenant_phone':
      return 'Tenant Phone'
    case 'tenant_address':
      return 'Tenant Address'
    case 'slip_number':
      return `${stringValue(component.props?.label, 'Slip No')}: ${dummySlipNo}`
    case 'barcode':
      return '|||| ||| ||||'
    case 'divider':
      return ''
    case 'spacer':
      return 'Spacer'
    default:
      return 'Component'
  }
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function numberValue(value: unknown, fallback: number) {
  const numeric = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(numeric) ? numeric : fallback
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
