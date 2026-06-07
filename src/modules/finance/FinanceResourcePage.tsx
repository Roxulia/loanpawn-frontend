import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Badge, Button } from '../../components/atoms'
import { Alert } from '../../components/feedback'
import { EditIcon, CirclePlusIcon as PlusIcon, TrashIcon } from '../../components/icons/icon'
import { Card, SearchField, SectionHeader, TableToolbar } from '../../components/molecules'
import { ConfirmDialog, DataTable, ModalForm, type DataTableColumn } from '../../components/organisms'
import type { PaginatedResult } from '../../dataobjects/common/api'
import { usePermissions, type PermissionCode } from '../auth'

type FinanceFormValue = string | boolean
export type FinanceFormState = Record<string, FinanceFormValue>
export type FinanceFormErrors<TForm extends FinanceFormState> = Partial<Record<keyof TForm, string>>

export type FinanceResourcePageConfig<TItem, TForm extends FinanceFormState> = {
  cardTitle: string
  columns: Array<DataTableColumn<TItem>>
  createLabel: string
  deleteLabel: string
  deleteMessage: (item: TItem) => string
  deletePermission: PermissionCode
  emptyDescription: string
  emptyTitle: string
  getItemId: (item: TItem) => string | number
  getItemTitle: (item: TItem) => ReactNode
  getSearchText: (item: TItem) => string
  initialForm: TForm
  itemToForm: (item: TItem) => TForm
  list: (params: { page: number; perPage: number }) => Promise<PaginatedResult<TItem>>
  listPermission: PermissionCode
  modalTitle: (mode: 'create' | 'edit') => string
  renderForm: (
    form: TForm,
    errors: FinanceFormErrors<TForm>,
    updateField: (field: keyof TForm, value: FinanceFormValue) => void,
  ) => ReactNode
  save: (mode: 'create' | 'edit', form: TForm, item: TItem | null) => Promise<unknown>
  searchPlaceholder: string
  subtitle: string
  title: string
  totalLabel: string
  updatePermission: PermissionCode
  validate: (form: TForm) => FinanceFormErrors<TForm>
  createPermission?: PermissionCode
  createPath?: string
  hideUpdateAction?: boolean
  onDelete?: (item: TItem) => Promise<unknown>
  renderItemActions?: (item: TItem, helpers: { removeItem: (item: TItem) => void; reload: () => Promise<void>; updateItem: (item: TItem) => void }) => ReactNode
  renderItemActionsPermission?: PermissionCode
}

const perPage = 10

export function FinanceResourcePage<TItem, TForm extends FinanceFormState>({
  config,
}: {
  config: FinanceResourcePageConfig<TItem, TForm>
}) {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canList = hasPermission(config.listPermission)
  const canCreate = config.createPermission ? hasPermission(config.createPermission) : false
  const canUpdate = hasPermission(config.updatePermission)
  const canDelete = hasPermission(config.deletePermission)
  const canRenderItemActions = Boolean(config.renderItemActions) && (!config.renderItemActionsPermission || hasPermission(config.renderItemActionsPermission))
  const canUseRowActions = (canUpdate && !config.hideUpdateAction) || canDelete || canRenderItemActions
  const [items, setItems] = useState<TItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState<TForm>(config.initialForm)
  const [formErrors, setFormErrors] = useState<FinanceFormErrors<TForm>>({})
  const [editingItem, setEditingItem] = useState<TItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<TItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadItems = useCallback(async (page: number) => {
    if (!canList) {
      setItems([])
      setCurrentPage(1)
      setLastPage(1)
      setTotal(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await config.list({ page, perPage })
      const pageData = response

      setItems(pageData.items)
      setCurrentPage(getPageValue(pageData, 'currentPage', 'current_page', 1))
      setLastPage(getPageValue(pageData, 'lastPage', 'last_page', 1))
      setTotal(pageData.total)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : `Unable to load ${config.totalLabel}.`)
    } finally {
      setIsLoading(false)
    }
  }, [canList, config])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadItems(currentPage)
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [currentPage, loadItems])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return items
    }

    return items.filter((item) => config.getSearchText(item).toLowerCase().includes(normalizedSearch))
  }, [config, items, searchTerm])

  function openCreateForm() {
    if (config.createPath) {
      navigate(config.createPath)
      return
    }

    setEditingItem(null)
    setForm(config.initialForm)
    setFormErrors({})
    setIsFormOpen(true)
  }

  function openEditForm(item: TItem) {
    setEditingItem(item)
    setForm(config.itemToForm(item))
    setFormErrors({})
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingItem(null)
    setForm(config.initialForm)
    setFormErrors({})
  }

  function updateField(field: keyof TForm, value: FinanceFormValue) {
    setForm((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSave() {
    const nextErrors = config.validate(form)

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      return
    }

    const mode = editingItem ? 'edit' : 'create'
    setIsSaving(true)
    setError(null)
    setNotice(null)

    try {
      const response = await config.save(mode, form, editingItem)
      const savedItem = response as TItem | null

      if (savedItem) {
        if (mode === 'create') {
          setItems((current) => [savedItem, ...current])
          setTotal((current) => current + 1)
        } else {
          updateLocalItem(savedItem)
        }
      }

      setNotice(`${config.title} ${mode === 'create' ? 'created' : 'updated'} successfully.`)
      closeForm()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `Unable to save ${config.title.toLowerCase()}.`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!itemToDelete || !config.onDelete) {
      return
    }

    setIsDeleting(true)
    setError(null)
    setNotice(null)

    try {
      await config.onDelete(itemToDelete)
      setNotice(`${config.title} deleted successfully.`)
      removeLocalItem(itemToDelete)
      setItemToDelete(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : `Unable to delete ${config.title.toLowerCase()}.`)
    } finally {
      setIsDeleting(false)
    }
  }

  function updateLocalItem(nextItem: TItem) {
    const nextItemId = config.getItemId(nextItem)

    setItems((current) => current.map((item) => config.getItemId(item) === nextItemId ? nextItem : item))
  }

  function removeLocalItem(itemToRemove: TItem) {
    const itemId = config.getItemId(itemToRemove)

    setItems((current) => current.filter((item) => config.getItemId(item) !== itemId))
    setTotal((current) => Math.max(0, current - 1))
  }

  return (
    <section className="page">
      <SectionHeader
        title={config.title}
        subtitle={config.subtitle}
        action={
          canCreate ? (
            <Button leftIcon={<PlusIcon />} onClick={openCreateForm} variant="primary">
              {config.createLabel}
            </Button>
          ) : null
        }
      />

      <Card
        title={config.cardTitle}
        description={`${total} total ${config.totalLabel}${total === 1 ? '' : 's'}`}
        action={<Badge tone="info">Finance</Badge>}
      >
        <div className="customer-management">
          {error && <Alert message={error} onDismiss={() => setError(null)} title="Finance action failed" tone="danger" />}
          {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Finance updated" tone="success" />}

          <TableToolbar
            actions={
              canList ? (
                <Button onClick={() => void loadItems(currentPage)} variant="secondary">
                  Refresh
                </Button>
              ) : null
            }
            search={
              canList ? (
                <SearchField
                  id={`${config.title.toLowerCase().replace(/\s+/g, '-')}-search`}
                  label={`Filter ${config.title}`}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={config.searchPlaceholder}
                  value={searchTerm}
                />
              ) : null
            }
          />

          <DataTable
            actions={canUseRowActions ? (item) => (
              <div className="row-actions">
                {canRenderItemActions && config.renderItemActions?.(item, {
                  removeItem: removeLocalItem,
                  reload: () => loadItems(currentPage),
                  updateItem: updateLocalItem,
                })}
                {canUpdate && !config.hideUpdateAction && (
                  <Button
                    aria-label={`Edit ${String(config.getItemTitle(item))}`}
                    className="ui-button--icon"
                    onClick={() => openEditForm(item)}
                    title="Edit"
                    variant="secondary"
                  >
                    <EditIcon />
                  </Button>
                )}
                {canDelete && config.onDelete && (
                  <Button
                    aria-label={`Delete ${String(config.getItemTitle(item))}`}
                    className="ui-button--icon"
                    onClick={() => setItemToDelete(item)}
                    title="Delete"
                    variant="danger"
                  >
                    <TrashIcon />
                  </Button>
                )}
              </div>
            ) : undefined}
            columns={config.columns}
            emptyAction={
              canCreate ? (
                <Button leftIcon={<PlusIcon />} onClick={openCreateForm} variant="primary">
                  {config.createLabel}
                </Button>
              ) : null
            }
            emptyDescription={canList ? config.emptyDescription : `Your account cannot view ${config.totalLabel} records.`}
            emptyTitle={canList ? config.emptyTitle : `${config.title} hidden`}
            getItemId={config.getItemId}
            getItemTitle={config.getItemTitle}
            isLoading={isLoading}
            items={filteredItems}
            pagination={canList ? {
              currentPage,
              lastPage,
              onNext: () => setCurrentPage((page) => page + 1),
              onPrevious: () => setCurrentPage((page) => page - 1),
              total,
            } : undefined}
            showEmptyStructure={!canList}
          />
        </div>
      </Card>

      <ModalForm
        confirmLabel={editingItem ? 'Save Changes' : config.createLabel}
        isLoading={isSaving}
        isOpen={isFormOpen}
        onCancel={closeForm}
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
        title={config.modalTitle(editingItem ? 'edit' : 'create')}
      >
        {config.renderForm(form, formErrors, updateField)}
      </ModalForm>

      <ConfirmDialog
        confirmLabel={config.deleteLabel}
        isLoading={isDeleting}
        isOpen={Boolean(itemToDelete)}
        message={itemToDelete ? config.deleteMessage(itemToDelete) : ''}
        onCancel={() => setItemToDelete(null)}
        onConfirm={() => void handleDelete()}
        title={`Confirm ${config.title.toLowerCase()} deletion`}
      />
    </section>
  )
}

function getPageValue<TItem>(
  pageData: PaginatedResult<TItem>,
  camelKey: 'currentPage' | 'lastPage',
  snakeKey: 'current_page' | 'last_page',
  fallback: number,
) {
  const withOptionalKeys = pageData as PaginatedResult<TItem> & Partial<Record<typeof camelKey | typeof snakeKey, number>>

  return withOptionalKeys[camelKey] ?? withOptionalKeys[snakeKey] ?? fallback
}
