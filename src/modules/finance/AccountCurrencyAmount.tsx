import { useUiLocale } from '../../locales/UiLocale'
import { formatAccountCurrencyAmount } from './financeFormat'
import { defaultFinancialUnits, formatFinancialAmount } from './financialUnits'
import { useTenantCurrencies } from './useTenantCurrencies'
import { useFinancialAccounts } from './useFinancialAccounts'

type AccountCurrencyAmountProps = {
  accountId?: number | null
  amount: string | number | null | undefined
  fallbackAccountId?: number | null
}

export function AccountCurrencyAmount({ accountId, amount, fallbackAccountId }: AccountCurrencyAmountProps) {
  const symbols = new Map(useFinancialAccounts().map((account) => [account.id, account.currency.symbol ?? '']))
  const { defaultCurrencySymbol, defaultFinancialUnit } = useTenantCurrencies()
  const { locale } = useUiLocale()
  const symbol = (accountId == null ? '' : symbols.get(accountId))
    || (fallbackAccountId == null ? '' : symbols.get(fallbackAccountId))
    || defaultCurrencySymbol

  return <>{defaultFinancialUnit
    ? formatFinancialAmount(amount, symbol, defaultFinancialUnits, locale, defaultFinancialUnit)
    : formatAccountCurrencyAmount(amount, symbol, locale)}</>
}
