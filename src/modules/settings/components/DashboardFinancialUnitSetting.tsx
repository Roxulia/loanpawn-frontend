import { Select } from '../../../components/atoms'
import { FormField } from '../../../components/molecules'
import { useTenantSession } from '../../../contexts/useTenantSession'
import { useFinancialUnits, type FinancialUnit, type FinancialUnitCode } from '../../finance/financialUnits'

type DashboardFinancialUnitSettingProps = {
  disabled: boolean
  onChange: (value: FinancialUnitCode | null) => void
  value: FinancialUnitCode | null
}

export function DashboardFinancialUnitSetting(props: DashboardFinancialUnitSettingProps) {
  const { error, units } = useFinancialUnits()
  const { locale } = useTenantSession()

  return (
    <>
      <div className="dashboard-financial-unit-setting dashboard-financial-unit-setting--desktop">
        <FinancialUnitSelect {...props} id="settings-dashboard-financial-unit-desktop" locale={locale} units={units} />
      </div>
      <div className="dashboard-financial-unit-setting dashboard-financial-unit-setting--mobile">
        <FinancialUnitSelect {...props} id="settings-dashboard-financial-unit-mobile" locale={locale} units={units} />
      </div>
      {error && <small className="dashboard-financial-unit-setting__error" role="alert">{error}</small>}
    </>
  )
}

function FinancialUnitSelect({
  disabled,
  id,
  locale,
  onChange,
  units,
  value,
}: DashboardFinancialUnitSettingProps & {
  id: string
  locale: 'en' | 'mm'
  units: FinancialUnit[]
}) {
  return (
    <FormField
      helperText="Used for monetary values throughout the system. Leave empty to auto-scale amounts from 100,000."
      id={id}
      label="Default Financial Unit"
    >
      <Select
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(event.target.value ? event.target.value as FinancialUnitCode : null)}
        value={value ?? ''}
      >
        <option value="">Auto scaling</option>
        {units.map((unit) => (
          <option key={unit.code} value={unit.code}>
            {locale === 'mm' ? unit.label_mm : unit.label_en}
          </option>
        ))}
      </Select>
    </FormField>
  )
}
