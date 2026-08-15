import { useTenantSession } from '../../contexts/useTenantSession'

export function useTenantCurrencies() {
  const { tenantResolution } = useTenantSession()
  const settings = tenantResolution.status === 'resolved'
    ? tenantResolution.tenant.tenant_setting
    : null

  return {
    defaultCurrencyId: settings?.default_currency_id ?? null,
    defaultCurrencySymbol: settings?.default_currency_symbol ?? '',
    reportingCurrencyId: settings?.reporting_currency_id ?? null,
    reportingCurrencySymbol: settings?.reporting_currency_symbol ?? '',
    effectiveReportingCurrencyId: settings?.effective_reporting_currency_id ?? settings?.reporting_currency_id ?? null,
    effectiveReportingCurrencySymbol: settings?.effective_reporting_currency_symbol ?? settings?.reporting_currency_symbol ?? '',
    reportingCurrencyRecalculation: settings?.reporting_currency_recalculation ?? null,
  }
}
