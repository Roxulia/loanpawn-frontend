import type { TenantDebt } from '../../../dataobjects/tenant/finance'
import { getNumberField, getStringField } from '../../finance/financeFormat'

export function formatDebtLink(item: TenantDebt) {
  const customerName = getStringField(item, 'customer_name', 'customerName')
  const customerCode = getStringField(item, 'customer_code', 'customerCode')
  const slipNo = getStringField(item, 'slip_no', 'slipNo')
  if (slipNo) return slipNo
  if (customerName || customerCode) return [customerName, customerCode].filter(Boolean).join(' / ')
  const slipId = getNumberField(item, 'slip_id', 'slipId')
  return slipId ? `Slip #${slipId}` : '-'
}
