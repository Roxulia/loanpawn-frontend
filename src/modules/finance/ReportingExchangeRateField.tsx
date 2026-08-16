import { useEffect, useState } from 'react'
import { Input, Select } from '../../components/atoms'
import { FormField } from '../../components/molecules'
import { financialAccountService, type ReportingExchangeRateQuote } from '../financialAccounts/financialAccountService'
import { useFinancialAccounts } from './useFinancialAccounts'
import { useTenantCurrencies } from './useTenantCurrencies'

type Props = {
  accountId?: string | number | null
  manualRate: string
  onManualRateChange: (value: string) => void
  inversed: boolean
  onInversedChange: (value: boolean) => void
  toCurrencyId?: number | null
  label?: string
  onResolvedMultiplier?: (value: number | null) => void
}

type DirectionSelectorProps = {
  fromCode: string
  toCode: string
  inversed: boolean
  onChange: (value: boolean) => void
}

function DirectionSelector({ fromCode, toCode, inversed, onChange }: DirectionSelectorProps) {
  return <Select aria-label="Exchange-rate direction" value={inversed ? 'inverse' : 'direct'} onChange={(event) => onChange(event.target.value === 'inverse')}>
    <option value="direct">{fromCode} → {toCode}</option>
    <option value="inverse">{toCode} → {fromCode}</option>
  </Select>
}

function DesktopDirectionSelector(props: DirectionSelectorProps) {
  return <div className="reporting-rate-direction reporting-rate-direction--desktop"><DirectionSelector {...props} /></div>
}

function MobileDirectionSelector(props: DirectionSelectorProps) {
  return <div className="reporting-rate-direction reporting-rate-direction--mobile"><DirectionSelector {...props} /></div>
}

export function ReportingExchangeRateField({ accountId, manualRate, onManualRateChange, inversed, onInversedChange, toCurrencyId, label = 'Reporting exchange rate', onResolvedMultiplier }: Props) {
  const accounts = useFinancialAccounts()
  const { effectiveReportingCurrencyId } = useTenantCurrencies()
  const account = accounts.find((candidate) => candidate.id === Number(accountId))
  const targetId = toCurrencyId ?? effectiveReportingCurrencyId
  const [quote, setQuote] = useState<ReportingExchangeRateQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const differs = Boolean(account && targetId && account.currency.id !== targetId)

  useEffect(() => {
    let active = true
    if (!account || !targetId || account.currency.id === targetId) {
      setQuote(null)
      onResolvedMultiplier?.(null)
      onInversedChange(false)
      return () => { active = false }
    }
    setLoading(true)
    void financialAccountService.reportingExchangeRateQuote(account.currency.id, targetId)
      .then((result) => {
        if (!active) return
        setQuote(result)
        onResolvedMultiplier?.(result.multiplier)
        onInversedChange(false)
        if (!result.requires_manual) onManualRateChange('')
      })
      .catch(() => { if (active) { setQuote(null); onResolvedMultiplier?.(null) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [account?.currency.id, targetId])

  if (!differs) return null
  if (loading) return <div className="reporting-rate-field reporting-rate-field--loading">Checking the business-date exchange rate…</div>
  if (quote && !quote.requires_manual) return <div className="reporting-rate-field reporting-rate-field--resolved">Using the {quote.source} rate ({quote.multiplier}) for {quote.business_date}.</div>

  const directionProps = { fromCode: quote?.from_currency_code ?? account?.currency.code ?? '', toCode: quote?.to_currency_code ?? '', inversed, onChange: onInversedChange }

  return <div className="reporting-rate-field reporting-rate-field--manual">
    <FormField id={`reporting-rate-direction-${accountId ?? 'account'}`} label="Exchange-rate pair">
      <DesktopDirectionSelector {...directionProps} />
      <MobileDirectionSelector {...directionProps} />
    </FormField>
    <FormField id={`reporting-rate-${accountId ?? 'account'}`} label={label} helperText={inversed ? `The ${quote?.to_currency_code ?? 'reporting'} amount is calculated by division.` : `The ${quote?.to_currency_code ?? 'reporting'} amount is calculated by multiplication.`}>
      <Input id={`reporting-rate-${accountId ?? 'account'}`} min="0.00000001" required step="0.00000001" type="number" value={manualRate} onChange={(event) => onManualRateChange(event.target.value)} />
    </FormField>
  </div>
}
