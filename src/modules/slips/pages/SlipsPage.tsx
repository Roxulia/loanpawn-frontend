import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button, Input, Select, Textarea } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { ChevronRightIcon, PrinterIcon, TrashIcon } from '../../../components/icons/icon'
import {
  ActionBar,
  Card,
  emptyNrcValue,
  FormField,
  FormGroup,
  isCompleteNrcValue,
  isEmptyNrcValue,
  nrcValueToPayloadFields,
  nrcValueFromFields,
  NrcField,
  SearchField,
  SectionHeader,
  TableToolbar,
} from '../../../components/molecules'
import { ConfirmDialog, DataTable, ModalForm, type DataTableColumn } from '../../../components/organisms'
import { LocalizedText, useUiLocale } from '../../../locales/UiLocale'
import { createIdempotencyKey } from '../../../services/http/idempotency'
import { usePermissions } from '../../auth'
import { customerService } from '../../customers/services/customerService'
import { formatDate, formatMoney, getSlipCustomerName, getStatusTone } from '../slipFormat'
import { slipService, type InterestType, type ItemCategoryType, type LoanContractSlip, type LoanContractSlipListPage, type MaterialType, type SlipCollateralPayload } from '../services/slipService'
import { ExpenseImageInput } from '../../expenses/components/ExpenseImageInput'

const perPage = 10
const paperTypeOptions = [
  { value: 'A4', label: 'A4' },
  { value: 'A5', label: 'A5' },
  { value: 'Receipt80', label: 'MM80' },
]

type SlipTab = 'application' | 'management'
type ItemForm = SlipCollateralPayload & {
  key: string
  gemstone_grade?: string
  gemstone_quantity?: number
  gemstone_type?: string
  gemstone_weight?: string
  material_price_per_kyat?: number
}

const emptyCustomer = {
  name: '',
  email: '',
  nrc: emptyNrcValue,
  phone: '',
  address: '',
  note: '',
}

const emptyLoan = {
  loan_amount: '',
  interest_rate: '',
  interest_type_id: '',
  expiry_quota: '1',
  expiry_quota_type: 'Month',
  notes: '',
}

export function SlipsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedCustomerCode = searchParams.get('customer')?.trim() ?? ''
  const { t } = useUiLocale()
  const { hasPermission } = usePermissions()
  const canList = hasPermission('list_loan_contract')
  const canCreate = hasPermission('create_loan_contract')
  const canDelete = hasPermission('delete_loan_contract')
  const [activeTab, setActiveTab] = useState<SlipTab>('application')
  const [interestTypes, setInterestTypes] = useState<InterestType[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [itemCategoryTypes, setItemCategoryTypes] = useState<ItemCategoryType[]>([])
  const [customer, setCustomer] = useState(emptyCustomer)
  const [isCustomerPrefilling, setIsCustomerPrefilling] = useState(false)
  const [prefilledCustomerCode, setPrefilledCustomerCode] = useState('')
  const [loan, setLoan] = useState(emptyLoan)
  const [items, setItems] = useState<ItemForm[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [slips, setSlips] = useState<LoanContractSlip[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [slipToDelete, setSlipToDelete] = useState<LoanContractSlip | null>(null)
  const [slipToPrint, setSlipToPrint] = useState<LoanContractSlip | null>(null)
  const [printingSlipId, setPrintingSlipId] = useState<number | null>(null)
  const [paperType, setPaperType] = useState('A4')
  const [shouldPrintAfterCreate, setShouldPrintAfterCreate] = useState(false)
  const createIdempotencyKeyRef = useRef<string | null>(null)

  const filteredSlips = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    if (!search) {
      return slips
    }

    return slips.filter((slip) => [
      slip.slip_no,
      getSlipCustomerName(slip),
      slip.status,
    ].some((value) => value.toLowerCase().includes(search)))
  }, [searchTerm, slips])

  const suggestedMinimumRetail = useMemo(() => items.reduce((sum, item) => {
    return sum + calculateMinimumRetailPrice(item)
  }, 0), [items])

  const loadSlips = useCallback(async (page: number) => {
    if (!canList) {
      setSlips([])
      setCurrentPage(1)
      setLastPage(1)
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await slipService.listSlips({ page, perPage })
      const pageData = response
      const nextItems = pageData.items ?? []

      setSlips(nextItems)
      setCurrentPage(getPageValue(pageData, 'currentPage', 'current_page', page))
      setLastPage(getPageValue(pageData, 'lastPage', 'last_page', 1))
      setTotal(pageData.total ?? nextItems.length)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load loan slips.')
    } finally {
      setIsLoading(false)
    }
  }, [canList])

  useEffect(() => {
    void slipService.listInterestTypes()
      .then((response) => setInterestTypes(response ?? []))
      .catch(() => setInterestTypes([]))

    void slipService.listMaterialTypes()
      .then((response) => setMaterialTypes(response ?? []))
      .catch(() => setMaterialTypes([]))

    void slipService.listItemCategoryTypes()
      .then((response) => setItemCategoryTypes(response ?? []))
      .catch(() => setItemCategoryTypes([]))
  }, [])

  useEffect(() => {
    if (!requestedCustomerCode || requestedCustomerCode === prefilledCustomerCode) {
      return
    }

    let isCurrent = true
    const loadTimer = window.setTimeout(() => {
      setIsCustomerPrefilling(true)
      setError(null)

      void customerService.getCustomer(requestedCustomerCode)
        .then((response) => {
          if (!isCurrent) {
            return
          }

          setCustomer({
            name: response.name,
            email: response.email ?? '',
            nrc: nrcValueFromFields(response),
            phone: response.phone ?? '',
            address: response.address ?? '',
            note: response.note ?? '',
          })
          setPrefilledCustomerCode(requestedCustomerCode)
        })
        .catch((loadError) => {
          if (isCurrent) {
            setError(loadError instanceof Error ? loadError.message : 'Unable to load customer details.')
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsCustomerPrefilling(false)
          }
        })
    }, 0)

    return () => {
      isCurrent = false
      window.clearTimeout(loadTimer)
    }
  }, [prefilledCustomerCode, requestedCustomerCode])

  useEffect(() => {
    if (activeTab === 'management') {
      const loadTimer = window.setTimeout(() => {
        void loadSlips(currentPage)
      }, 0)

      return () => window.clearTimeout(loadTimer)
    }
  }, [activeTab, currentPage, loadSlips])

  const columns: Array<DataTableColumn<LoanContractSlip>> = [
    { header: 'Slip No', key: 'slipNo', render: (slip) => <strong>{slip.slip_no}</strong> },
    { header: 'Customer', key: 'customer', render: getSlipCustomerName },
    { header: 'Amount', key: 'amount', render: (slip) => formatMoney(slip.loan_amount) },
    { header: 'Status', key: 'status', render: (slip) => <Badge tone={getStatusTone(slip.status)}>{slip.status}</Badge> },
    { header: 'Created', key: 'created', render: (slip) => formatDate(slip.created_at) },
  ]

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (createIdempotencyKeyRef.current !== null) {
      return
    }

    const nextErrors = validateSlipForm(customer, loan, items, interestTypes)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsCreating(true)
    setError(null)
    createIdempotencyKeyRef.current = createIdempotencyKey()

    try {
      const response = await slipService.createSlip({
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim() || undefined,
          ...optionalNrcPayload(customer.nrc),
          phone: customer.phone.trim() || undefined,
          address: customer.address.trim() || undefined,
          note: customer.note.trim() || undefined,
        },
        collateral_items: items.map(toPayloadItem),
        loan_amount: Number(loan.loan_amount),
        interest_rate: Number(loan.interest_rate),
        interest_type_id: Number(loan.interest_type_id),
        expiry_quota: Number(loan.expiry_quota),
        expiry_quota_type: loan.expiry_quota_type,
        notes: loan.notes.trim() || undefined,
      }, undefined, {
        idempotencyKey: createIdempotencyKeyRef.current,
      })

      resetForm()
      setNotice(`Loan slip ${response.slip_no} created successfully.`)

      if (shouldPrintAfterCreate) {
        openPrintDialog(response)
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create loan slip.')
    } finally {
      createIdempotencyKeyRef.current = null
      setIsCreating(false)
    }
  }

  async function handleDelete() {
    if (!slipToDelete) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await slipService.deleteSlip(slipToDelete.slip_no)
      setNotice(`Loan slip ${slipToDelete.slip_no} deleted successfully.`)
      setSlipToDelete(null)
      await loadSlips(currentPage)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete loan slip.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handlePrint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!slipToPrint) {
      return
    }

    await printSlipDocument(slipToPrint, paperType)
  }

  async function printSlipDocument(slip: LoanContractSlip, selectedPaperType: string) {
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      setError('Unable to open print window. Please allow pop-ups and try again.')
      return
    }

    setPrintingSlipId(slip.id)
    setError(null)

    try {
      const html = await slipService.previewSlipDocument(slip.slip_no, selectedPaperType)

      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      setSlipToPrint(null)
      setPaperType('A4')
      printWindow.focus()
      window.setTimeout(() => {
        printWindow.print()
      }, 250)
    } catch (printError) {
      printWindow.close()
      setError(printError instanceof Error ? printError.message : 'Unable to print slip document.')
    } finally {
      setPrintingSlipId(null)
    }
  }

  function openPrintDialog(slip: LoanContractSlip) {
    setPaperType('A4')
    setSlipToPrint(slip)
  }

  function resetForm() {
    setCustomer(emptyCustomer)
    setLoan(emptyLoan)
    setItems([])
    setFormErrors({})
    setShouldPrintAfterCreate(false)
    setPaperType('A4')
  }

  function updateItem(key: string, patch: Partial<ItemForm>) {
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item))
  }

  const normalItemCount = items.filter((item) => item.type === 'Normal').length
  const jewelleryItemCount = items.filter((item) => item.type === 'Jewellery').length

  return (
    <section className="page ops-page ops-page--slips">
      <div className="ops-hero">
        <SectionHeader
          title="Loan Slips"
          subtitle="Create pawn loan contracts and manage active slip records from the desktop workflow."
        />
        <div className="ops-metrics" aria-label={t('Loan slip workspace summary')}>
          <div className="ops-metric">
            <span>Registry total</span>
            <strong>{formatNumber(total)}</strong>
          </div>
          <div className="ops-metric">
            <span>Draft collateral</span>
            <strong>{items.length}</strong>
          </div>
          <div className="ops-metric ops-metric--amount">
            <span>Retail floor</span>
            <strong>{formatMoney(suggestedMinimumRetail)}</strong>
          </div>
        </div>
      </div>

      <div className="module-tabs ops-tabs" role="tablist" aria-label={t('Loan slip sections')}>
        <Button aria-pressed={activeTab === 'application'} onClick={() => setActiveTab('application')} variant={activeTab === 'application' ? 'primary' : 'secondary'}>Loan Application</Button>
        <Button aria-pressed={activeTab === 'management'} onClick={() => setActiveTab('management')} variant={activeTab === 'management' ? 'primary' : 'secondary'}>Management</Button>
      </div>

      {error && <Alert message={error} onDismiss={() => setError(null)} title="Loan slip action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Loan slip updated" tone="success" />}

      {activeTab === 'application' && (
        <form className="workflow-stack ops-contract-workspace" onSubmit={(event) => void handleCreate(event)}>
          <Card title="Customer Details">
            {isCustomerPrefilling ? (
              <LoadingState rows={2} />
            ) : (
              <FormGroup className="slip-form-customer-grid" columns={2}>
              <FormField id="slip-customer-name" label="Name" error={formErrors.customerName}>
                <Input id="slip-customer-name" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} hasError={Boolean(formErrors.customerName)} />
              </FormField>
              <FormField id="slip-customer-phone" label="Phone">
                <Input id="slip-customer-phone" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
              </FormField>
              <FormField id="slip-customer-nrc" label="NRC" error={formErrors.customerNrc}>
                <NrcField id="slip-customer-nrc" value={customer.nrc} onChange={(nrc) => setCustomer({ ...customer, nrc })} hasError={Boolean(formErrors.customerNrc)} />
              </FormField>
              <FormField id="slip-customer-email" label="Email">
                <Input id="slip-customer-email" type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} />
              </FormField>
              <FormField className="slip-form-field--full" id="slip-customer-address" label="Address">
                <Textarea id="slip-customer-address" value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} />
              </FormField>
              <FormField className="slip-form-field--full" id="slip-customer-note" label="Note">
                <Textarea id="slip-customer-note" value={customer.note} onChange={(event) => setCustomer({ ...customer, note: event.target.value })} />
              </FormField>
              </FormGroup>
            )}
          </Card>

          <Card
            title="Collateral Details"
            description={`${normalItemCount} normal, ${jewelleryItemCount} jewellery`}
            action={(
              <div className="row-actions ops-card-actions">
                <Button onClick={() => setItems((current) => [...current, makeItem('Normal')])} variant="secondary">Add Normal Item</Button>
                <Button onClick={() => setItems((current) => [...current, makeItem('Jewellery')])} variant="secondary">Add Jewellery Item</Button>
              </div>
            )}
          >
            <div className="workflow-stack">
              {formErrors.items && <Alert message={formErrors.items} title="Collateral required" tone="warning" />}
              {items.length === 0 && <p className="muted"><LocalizedText text="Choose an item type to start adding collateral." /></p>}
              {items.map((item, index) => (
                <section className="subform-panel" key={item.key}>
                  <header className="subform-panel__header">
                    <strong>{item.type} Item {index + 1}</strong>
                    <Button onClick={() => setItems((current) => current.filter((candidate) => candidate.key !== item.key))} variant="ghost">Remove</Button>
                  </header>
                  <FormGroup className="slip-form-collateral-base-grid" columns={2}>
                    <FormField id={`${item.key}-name`} label="Item Name" error={formErrors[`${item.key}.name`]}>
                      <Input id={`${item.key}-name`} value={item.name} onChange={(event) => updateItem(item.key, { name: event.target.value })} hasError={Boolean(formErrors[`${item.key}.name`])} />
                    </FormField>
                    {item.type === 'Normal' && (
                      <FormField id={`${item.key}-brand`} label="Brand">
                        <Input id={`${item.key}-brand`} value={item.brand_name ?? ''} onChange={(event) => updateItem(item.key, { brand_name: event.target.value })} />
                      </FormField>
                    )}
                    {item.type === 'Normal' && (
                      <FormField id={`${item.key}-item-category`} label="Item Category">
                        <Select id={`${item.key}-item-category`} value={item.item_category_type_id ?? ''} onChange={(event) => updateItem(item.key, { item_category_type_id: Number(event.target.value) || undefined })}>
                          <option value="">Select category</option>
                          {itemCategoryTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                        </Select>
                      </FormField>
                    )}
                    <FormField className="slip-form-field--full" id={`${item.key}-description`} label="Description">
                      <Textarea id={`${item.key}-description`} value={item.description ?? ''} onChange={(event) => updateItem(item.key, { description: event.target.value })} />
                    </FormField>
                    <FormField className="slip-form-field--full" id={`${item.key}-image-reference`} label="Reference image" error={formErrors[`${item.key}.image_reference`]}>
                      <ExpenseImageInput
                        existingImage={false}
                        file={item.image_reference ?? null}
                        id={`${item.key}-image-reference`}
                        isRemoved={false}
                        onChange={(file) => updateItem(item.key, { image_reference: file ?? undefined })}
                        onRemoveChange={() => undefined}
                      />
                    </FormField>
                  </FormGroup>
                  {item.type === 'Normal' && (
                    <FormGroup className="slip-form-collateral-summary-grid" columns={3}>
                      <FormField id={`${item.key}-estimated`} label="Estimated Value">
                        <Input id={`${item.key}-estimated`} min="0" type="number" value={item.estimated_value ?? ''} onChange={(event) => updateItem(item.key, { estimated_value: Number(event.target.value) })} />
                      </FormField>
                      <FormField id={`${item.key}-quantity`} label="Quantity">
                        <Input id={`${item.key}-quantity`} min="1" type="number" value={item.quantity ?? 1} onChange={(event) => updateItem(item.key, { quantity: Number(event.target.value) })} />
                      </FormField>
                      <RetailPriceField item={item} />
                    </FormGroup>
                  )}
                  {item.type === 'Jewellery' && (
                    <>
                      <FormGroup className="slip-form-jewellery-material-grid" columns={2} title="Material">
                        <FormField id={`${item.key}-material`} label="Material Type">
                          <Select id={`${item.key}-material`} value={item.material_type_id ?? ''} onChange={(event) => updateItem(item.key, { material_type_id: Number(event.target.value) || undefined })}>
                            <option value="">Select material</option>
                            {materialTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                          </Select>
                        </FormField>
                        <FormField id={`${item.key}-material-price`} label="Material Price per Kyat">
                          <Input id={`${item.key}-material-price`} min="0" type="number" value={item.material_price_per_kyat ?? ''} onChange={(event) => updateItem(item.key, { material_price_per_kyat: Number(event.target.value) })} />
                        </FormField>
                      </FormGroup>
                      <FormGroup className="slip-form-jewellery-weight-grid" columns={3} title="Weight">
                        <FormField id={`${item.key}-kyat`} label="Kyat">
                          <Input id={`${item.key}-kyat`} min="0" type="number" value={item.kyat ?? ''} onChange={(event) => updateItem(item.key, { kyat: Number(event.target.value) })} />
                        </FormField>
                        <FormField id={`${item.key}-pal`} label="Pal">
                          <Input id={`${item.key}-pal`} min="0" type="number" value={item.pal ?? ''} onChange={(event) => updateItem(item.key, { pal: Number(event.target.value) })} />
                        </FormField>
                        <FormField id={`${item.key}-yway`} label="Yway">
                          <Input id={`${item.key}-yway`} min="0" type="number" value={item.yway ?? ''} onChange={(event) => updateItem(item.key, { yway: Number(event.target.value) })} />
                        </FormField>
                      </FormGroup>
                    </>
                  )}
                  {item.type === 'Jewellery' && (
                    <div className="workflow-stack">
                      <label className="checkbox-line">
                        <input
                          checked={Boolean(item.contains_gemstones)}
                          onChange={(event) => updateItem(item.key, event.target.checked
                            ? { contains_gemstones: true }
                            : {
                              contains_gemstones: false,
                              gemstone_grade: '',
                              gemstone_quantity: undefined,
                              gemstone_type: '',
                              gemstone_weight: '',
                            })}
                          type="checkbox"
                        />
                        <span><LocalizedText text="Have Gem Stone" /></span>
                      </label>
                      {item.contains_gemstones && (
                        <FormGroup className="slip-form-gemstone-grid" columns={2}>
                          <FormField id={`${item.key}-gemstone-type`} label="Gemstone Type">
                            <Input id={`${item.key}-gemstone-type`} value={item.gemstone_type ?? ''} onChange={(event) => updateItem(item.key, { gemstone_type: event.target.value })} />
                          </FormField>
                          <FormField id={`${item.key}-gemstone-weight`} label="Gemstone Weight">
                            <Input id={`${item.key}-gemstone-weight`} min="0" step="0.01" type="number" value={item.gemstone_weight ?? ''} onChange={(event) => updateItem(item.key, { gemstone_weight: event.target.value })} />
                          </FormField>
                          <FormField id={`${item.key}-gemstone-quantity`} label="Gemstone Quantity">
                            <Input id={`${item.key}-gemstone-quantity`} min="1" type="number" value={item.gemstone_quantity ?? ''} onChange={(event) => updateItem(item.key, { gemstone_quantity: Number(event.target.value) || undefined })} />
                          </FormField>
                          <FormField id={`${item.key}-gemstone-grade`} label="Gemstone Grade">
                            <Input id={`${item.key}-gemstone-grade`} value={item.gemstone_grade ?? ''} onChange={(event) => updateItem(item.key, { gemstone_grade: event.target.value })} />
                          </FormField>
                        </FormGroup>
                      )}
                    </div>
                  )}
                  {item.type === 'Jewellery' && (
                    <FormGroup className="slip-form-collateral-summary-grid slip-form-collateral-summary-grid--jewellery" columns={2}>
                      <FormField id={`${item.key}-quantity`} label="Quantity">
                        <Input id={`${item.key}-quantity`} min="1" type="number" value={item.quantity ?? 1} onChange={(event) => updateItem(item.key, { quantity: Number(event.target.value) })} />
                      </FormField>
                      <RetailPriceField item={item} />
                    </FormGroup>
                  )}
                </section>
              ))}
            </div>
          </Card>

          <Card title="Loan Details" description={`Suggested minimum retail total: ${formatMoney(suggestedMinimumRetail)}`}>
            <FormGroup className="slip-form-loan-grid" columns={3}>
              <FormField id="loan-amount" label="Loan Amount" error={formErrors.loanAmount}>
                <Input id="loan-amount" min="0.01" step="0.01" type="number" value={loan.loan_amount} onChange={(event) => setLoan({ ...loan, loan_amount: event.target.value })} hasError={Boolean(formErrors.loanAmount)} />
              </FormField>
              <FormField id="interest-rate" label="Interest Rate" error={formErrors.interestRate}>
                <Input id="interest-rate" min="0.01" step="0.01" type="number" value={loan.interest_rate} onChange={(event) => setLoan({ ...loan, interest_rate: event.target.value })} hasError={Boolean(formErrors.interestRate)} />
              </FormField>
              <FormField id="interest-type" label="Interest Type" error={formErrors.interestType}>
                <Select id="interest-type" value={loan.interest_type_id} onChange={(event) => setLoan({ ...loan, interest_type_id: event.target.value })} hasError={Boolean(formErrors.interestType)}>
                  <option value="">Select interest type</option>
                  {interestTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </Select>
              </FormField>
              <FormField id="expiry-quota" label="Expiry Quota" error={formErrors.expiryQuota}>
                <Input id="expiry-quota" min="1" type="number" value={loan.expiry_quota} onChange={(event) => setLoan({ ...loan, expiry_quota: event.target.value })} hasError={Boolean(formErrors.expiryQuota)} />
              </FormField>
              <FormField id="expiry-type" label="Expiry Unit">
                <Select id="expiry-type" value={loan.expiry_quota_type} onChange={(event) => setLoan({ ...loan, expiry_quota_type: event.target.value })}>
                  <option value="Day">Day</option>
                  <option value="Week">Week</option>
                  <option value="Month">Month</option>
                  <option value="Year">Year</option>
                </Select>
              </FormField>
              <FormField className="slip-form-field--full" id="loan-notes" label="Loan Notes">
                <Textarea id="loan-notes" value={loan.notes} onChange={(event) => setLoan({ ...loan, notes: event.target.value })} />
              </FormField>
            </FormGroup>
            <ActionBar>
              <label className="checkbox-line">
                <input checked={shouldPrintAfterCreate} onChange={(event) => setShouldPrintAfterCreate(event.target.checked)} type="checkbox" />
                <span><LocalizedText text="Print after saving" /></span>
              </label>
              <Button onClick={resetForm} variant="secondary">Reset</Button>
              <Button disabled={!canCreate} isLoading={isCreating} type="submit" variant="primary">Create Slip</Button>
            </ActionBar>
          </Card>
        </form>
      )}

      {activeTab === 'management' && (
        <div className="workflow-stack ops-register-workspace">
          <Card title="All Slips" description={`${total} total slip${total === 1 ? '' : 's'}`}>
            <TableToolbar
              actions={<Button disabled={!canList} onClick={() => void loadSlips(currentPage)} variant="secondary">Refresh</Button>}
              search={<SearchField id="slip-search" label="Search slips" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Slip number, customer, or status" value={searchTerm} />}
            />
            <DataTable
              actions={canList || canDelete ? (slip) => (
                <div className="row-actions">
                  {canList && <Button onClick={() => navigate(routePaths.slipDetail(slip.slip_no))} variant="secondary">View</Button>}
                  {canList && (
                    <Button
                      aria-label={`Print ${slip.slip_no}`}
                      className="ui-button--icon"
                      isLoading={printingSlipId === slip.id}
                      onClick={(event) => {
                        event.stopPropagation()
                        openPrintDialog(slip)
                      }}
                      title="Print slip"
                      variant="secondary"
                    >
                      <PrinterIcon />
                    </Button>
                  )}
                  {canDelete && (
                    <Button aria-label={`Delete ${slip.slip_no}`} className="ui-button--icon" onClick={(event) => {
                      event.stopPropagation()
                      setSlipToDelete(slip)
                    }} title="Delete slip" variant="danger">
                      <TrashIcon />
                    </Button>
                  )}
                </div>
              ) : undefined}
              columns={columns}
              emptyDescription={searchTerm ? 'No slips match this search.' : 'Create the first loan contract slip.'}
              emptyTitle={searchTerm ? 'No matching slips' : 'No slips yet'}
              getItemId={(slip) => slip.id}
              getItemTitle={(slip) => slip.slip_no}
              isLoading={isLoading}
              items={filteredSlips}
              onRowClick={(slip) => navigate(routePaths.slipDetail(slip.slip_no))}
              pagination={{
                currentPage,
                lastPage,
                onNext: () => setCurrentPage((page) => page + 1),
                onPrevious: () => setCurrentPage((page) => page - 1),
                total,
              }}
              renderMobileCard={(slip) => (
                <SlipHistoryMobileCard
                  actions={(
                    <>
                      {canList ? (
                        <Button
                          aria-label={`Print ${slip.slip_no}`}
                          className="ui-button--icon"
                          isLoading={printingSlipId === slip.id}
                          onClick={() => openPrintDialog(slip)}
                          title="Print slip"
                          variant="secondary"
                        >
                          <PrinterIcon />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          aria-label={`Delete ${slip.slip_no}`}
                          className="ui-button--icon"
                          onClick={() => setSlipToDelete(slip)}
                          title="Delete slip"
                          variant="danger"
                        >
                          <TrashIcon />
                        </Button>
                      ) : null}
                    </>
                  )}
                  onView={() => navigate(routePaths.slipDetail(slip.slip_no))}
                  slip={slip}
                />
              )}
            />
          </Card>
        </div>
      )}

      <ConfirmDialog
        confirmLabel="Delete Slip"
        isLoading={isDeleting}
        isOpen={Boolean(slipToDelete)}
        message={`Delete ${slipToDelete?.slip_no ?? 'this slip'}? This action cannot be undone.`}
        onCancel={() => setSlipToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Confirm slip deletion"
      />
      <ModalForm
        cancelLabel="Cancel"
        confirmLabel="Print"
        isLoading={printingSlipId === slipToPrint?.id}
        isOpen={Boolean(slipToPrint)}
        onCancel={() => setSlipToPrint(null)}
        onSubmit={(event) => void handlePrint(event)}
        title={`Print ${slipToPrint?.slip_no ?? 'Slip'}`}
      >
        <FormGroup columns={1}>
          <FormField id="slip-print-paper-type" label="Paper Type">
            <Select id="slip-print-paper-type" value={paperType} onChange={(event) => setPaperType(event.target.value)}>
              {paperTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </FormField>
        </FormGroup>
      </ModalForm>
    </section>
  )
}

function RetailPriceField({ item }: { item: ItemForm }) {
  return (
    <div className="ui-form-field slip-form-retail-field">
      <span className="ui-label"><LocalizedText text="Minimum Retail Price" /></span>
      <Badge tone="info">{formatMoney(calculateMinimumRetailPrice(item))}</Badge>
      <div className="ui-form-field__hint"><LocalizedText text="Calculated from item value, quantity, and jewellery weight where applicable." /></div>
    </div>
  )
}

function makeItem(type: 'Normal' | 'Jewellery'): ItemForm {
  return {
    key: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    name: '',
    description: '',
    brand_name: type === 'Jewellery' ? 'None' : '',
    estimated_value: 0,
    item_status: 'active',
    quantity: 1,
    minimum_retail_price: 0,
    material_price_per_kyat: 0,
  }
}

function validateSlipForm(
  customer: typeof emptyCustomer,
  loan: typeof emptyLoan,
  items: ItemForm[],
  interestTypes: InterestType[],
) {
  const errors: Record<string, string> = {}

  if (!customer.name.trim()) {
    errors.customerName = 'Customer name is required.'
  }

  if (!isEmptyNrcValue(customer.nrc) && !isCompleteNrcValue(customer.nrc)) {
    errors.customerNrc = 'Complete NRC or leave it empty.'
  }

  if (items.length === 0) {
    errors.items = 'At least one collateral item is required.'
  }

  items.forEach((item) => {
    if (!item.name.trim()) {
      errors[`${item.key}.name`] = 'Item name is required.'
    }

    if (item.image_reference && item.image_reference.size > 5 * 1024 * 1024) {
      errors[`${item.key}.image_reference`] = 'Reference image must not exceed 5 MB.'
    }

    if (item.image_reference && !['image/jpeg', 'image/png', 'image/webp'].includes(item.image_reference.type)) {
      errors[`${item.key}.image_reference`] = 'Reference image must be JPG, PNG, or WebP.'
    }
  })

  if (Number(loan.loan_amount) <= 0) {
    errors.loanAmount = 'Loan amount must be greater than zero.'
  }

  if (Number(loan.interest_rate) <= 0) {
    errors.interestRate = 'Interest rate must be greater than zero.'
  }

  if (!loan.interest_type_id) {
    errors.interestType = 'Interest type is required.'
  }

  if (Number(loan.expiry_quota) < 1) {
    errors.expiryQuota = 'Expiry quota must be at least 1.'
  }

  const interestType = interestTypes.find((type) => type.id === Number(loan.interest_type_id))
  const expiryDurationInDays = calculateExpiryDurationInDays(
    Number(loan.expiry_quota),
    loan.expiry_quota_type,
  )

  if (
    interestType &&
    expiryDurationInDays !== null &&
    expiryDurationInDays <= Number(interestType.duration_in_days)
  ) {
    errors.expiryQuota = 'Expiry duration must be longer than the selected interest duration. Please rechoose the interest type or expiry quota.'
  }

  return errors
}

function calculateExpiryDurationInDays(quota: number, quotaType: string, currentDate = new Date()) {
  if (!Number.isInteger(quota) || quota < 1) {
    return null
  }

  const startDate = new Date(Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  ))
  const expiryDate = new Date(startDate)

  switch (quotaType.trim().toLowerCase()) {
    case 'day':
      expiryDate.setUTCDate(expiryDate.getUTCDate() + quota)
      break
    case 'week':
      expiryDate.setUTCDate(expiryDate.getUTCDate() + (quota * 7))
      break
    case 'month':
      expiryDate.setUTCMonth(expiryDate.getUTCMonth() + quota)
      break
    case 'year':
      expiryDate.setUTCFullYear(expiryDate.getUTCFullYear() + quota)
      break
    default:
      return null
  }

  return Math.round((expiryDate.getTime() - startDate.getTime()) / 86_400_000)
}

function optionalNrcPayload(value: typeof emptyNrcValue) {
  if (isEmptyNrcValue(value)) {
    return {
      nrc_citizen: undefined,
      nrc_number: undefined,
      nrc_state: undefined,
      nrc_township: undefined,
    }
  }

  return nrcValueToPayloadFields(value)
}

function toPayloadItem(item: ItemForm): SlipCollateralPayload {
  return {
    type: item.type,
    name: item.name.trim(),
    description: item.description?.trim() || undefined,
    brand_name: item.type === 'Jewellery' ? 'None' : item.brand_name?.trim() || undefined,
    estimated_value: item.type === 'Jewellery' ? 0 : Number(item.estimated_value ?? 0),
    material_type_id: item.material_type_id,
    material_price_per_kyat: item.type === 'Jewellery' ? Number(item.material_price_per_kyat ?? 0) : undefined,
    item_category_type_id: item.type === 'Normal' ? item.item_category_type_id : undefined,
    kyat: Number(item.kyat ?? 0),
    pal: Number(item.pal ?? 0),
    yway: Number(item.yway ?? 0),
    contains_gemstones: Boolean(item.contains_gemstones),
    gemstone_details: makeGemstoneDetails(item),
    quantity: Number(item.quantity ?? 1),
    minimum_retail_price: calculateMinimumRetailPrice(item),
    item_status: item.item_status ?? 'active',
    image_reference: item.image_reference,
  }
}

function SlipHistoryMobileCard({
  actions,
  onView,
  slip,
}: {
  actions: ReactNode
  onView: () => void
  slip: LoanContractSlip
}) {
  const statusTone = getStatusTone(slip.status)

  return (
    <article className="slip-history-mobile-card">
      <header className="slip-history-mobile-card__header">
        <div>
          <small>{getSlipCustomerName(slip)}</small>
          <strong>{slip.slip_no}</strong>
        </div>
        <Badge tone={statusTone}>{slip.status}</Badge>
      </header>
      <div className="slip-history-mobile-card__summary">
        <div>
          <span>Loan amount</span>
          <strong>{formatMoney(slip.loan_amount)}</strong>
        </div>
        <span>{formatDate(slip.created_at)}</span>
      </div>
      <footer className="slip-history-mobile-card__footer">
        <div className="slip-history-mobile-card__actions row-actions">{actions}</div>
        <button className="slip-history-mobile-card__details" onClick={onView} type="button">
          View Details
          <ChevronRightIcon />
        </button>
      </footer>
    </article>
  )
}

function makeGemstoneDetails(item: ItemForm) {
  if (!item.contains_gemstones) {
    return undefined
  }

  const details = {
    type: item.gemstone_type?.trim() || undefined,
    weight: item.gemstone_weight?.trim() || undefined,
    quantity: item.gemstone_quantity,
    grade: item.gemstone_grade?.trim() || undefined,
  }

  return Object.values(details).some((value) => value !== undefined) ? details : undefined
}

function calculateMinimumRetailPrice(item: ItemForm) {
  if (item.type === 'Jewellery') {
    return roundMoney(Number(item.material_price_per_kyat ?? 0) * calculateJewelleryWeightInKyat(item) * Number(item.quantity ?? 1))
  }

  return roundMoney(Number(item.estimated_value ?? 0) * Number(item.quantity ?? 1))
}

function calculateJewelleryWeightInKyat(item: ItemForm) {
  return Number(item.kyat ?? 0) + (Number(item.pal ?? 0) / 16) + (Number(item.yway ?? 0) / 128)
}

function roundMoney(value: number) {
  return Number.isFinite(value) ? Math.round(value) : 0
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function getPageValue(
  pageData: LoanContractSlipListPage,
  camelKey: 'currentPage' | 'lastPage',
  snakeKey: 'current_page' | 'last_page',
  fallback: number,
) {
  return pageData[camelKey] ?? pageData[snakeKey] ?? fallback
}
