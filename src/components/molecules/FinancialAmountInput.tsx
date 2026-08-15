import { useEffect, useState, type InputHTMLAttributes } from 'react'
import { Input, Select } from '../atoms'
import { useUiLocale } from '../../locales/UiLocale'
import { useFinancialUnits, type FinancialAmountValue, type FinancialUnit } from '../../modules/finance/financialUnits'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  hasError?: boolean
  onChange: (value: FinancialAmountValue) => void
  value: FinancialAmountValue
}

type PresentationProps = Props & { units: FinancialUnit[]; locale: 'en' | 'mm' }

export function FinancialAmountInput(props: Props) {
  const { locale, t } = useUiLocale()
  const { error, isLoading, units } = useFinancialUnits()
  const isMobile = useMobileFinancialAmountLayout()
  const disabled = props.disabled || isLoading || Boolean(error)
  const presentationProps = { ...props, disabled, locale, units }

  return <>
    {isMobile
      ? <FinancialAmountInputMobile {...presentationProps} />
      : <FinancialAmountInputDesktop {...presentationProps} />}
    {error && <small className="financial-amount-input__error" role="alert">{t('Unable to load financial units.')}</small>}
  </>
}

function FinancialAmountInputDesktop(props: PresentationProps) {
  return <FinancialAmountFields {...props} className="financial-amount-input financial-amount-input--desktop" />
}

function FinancialAmountInputMobile(props: PresentationProps) {
  return <FinancialAmountFields {...props} className="financial-amount-input financial-amount-input--mobile" />
}

function FinancialAmountFields({ units, locale, onChange, value, hasError, id, className, ...rest }: PresentationProps & { className: string }) {

  return <div className={className}>
    <Input
      {...rest}
      hasError={hasError}
      id={id}
      inputMode="decimal"
      min={rest.min ?? 0}
      onChange={(event) => onChange({ ...value, amount: event.target.value })}
      type="number"
      value={value.amount}
    />
    <Select
      aria-label="Financial unit"
      disabled={rest.disabled}
      hasError={hasError}
      id={id ? `${id}-unit` : undefined}
      onChange={(event) => onChange({ ...value, unit: event.target.value as FinancialAmountValue['unit'] })}
      value={value.unit}
    >
      {units.map((unit) => <option key={unit.code} value={unit.code}>{locale === 'mm' ? unit.label_mm : unit.label_en}</option>)}
    </Select>
  </div>
}

function useMobileFinancialAmountLayout() {
  const query = '(max-width: 39.9375rem)'
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return matches
}
