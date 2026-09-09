import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { routePaths } from '../../../app/routes/paths'
import { Badge, Button } from '../../../components/atoms'
import { Alert, LoadingState } from '../../../components/feedback'
import { Card, KeyValueList, SectionHeader } from '../../../components/molecules'
import { usePermissions } from '../../auth'
import { formatDate } from '../../finance/financeFormat'
import { lenderService, type TenantLender } from '../services/lenderService'

export function LenderDetailPage() {
  const { lenderCode = '' } = useParams(); const navigate = useNavigate(); const { hasPermission } = usePermissions(); const [lender, setLender] = useState<TenantLender | null>(null); const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (lenderCode) void lenderService.get(lenderCode).then(setLender).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load lender.')) }, [lenderCode])
  if (!lenderCode) return <Navigate replace to={routePaths.lenders} />
  const summary = lender ? <Card title={lender.name} action={<Badge tone="info">{lender.code}</Badge>}><KeyValueList items={[{ key: 'NRC', value: lender.nrc || '-' }, { key: 'Phone', value: lender.phone || '-' }, { key: 'Email', value: lender.email || '-' }, { key: 'Address', value: lender.address || '-' }, { key: 'Total loans', value: lender.total_loans ?? lender.totalLoans ?? 0 }, { key: 'Active loans', value: lender.active_loans ?? lender.activeLoans ?? 0 }, { key: 'Outstanding principal', value: lender.outstanding_principal ?? lender.outstandingPrincipal ?? '0.00' }, { key: 'Created', value: formatDate(lender.created_at) }]} /></Card> : null
  return <section className="page lender-detail-page"><SectionHeader title="Lender Detail" subtitle={lenderCode} action={<div className="row-actions"><Button onClick={() => navigate(routePaths.lenders)} variant="secondary">Back</Button>{hasPermission('update_lender') && <Button onClick={() => navigate(routePaths.lenderEdit(lenderCode))}>Edit</Button>}{hasPermission('create_business_loan') && <Button onClick={() => navigate(`${routePaths.businessLoanCreate}?lender=${encodeURIComponent(lenderCode)}`)}>New Business Loan</Button>}</div>} />{error && <Alert message={error} onDismiss={() => setError(null)} title="Lookup failed" tone="danger" />}{!lender && !error ? <LoadingState rows={5} /> : <><div className="lender-detail--desktop">{summary}</div><div className="lender-detail--mobile">{summary}</div></>}</section>
}
