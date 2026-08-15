import { useEffect, useState } from 'react'
import { apiClient } from '../../services/http/apiClient'

export type FinancialUnitCode = 'UNIT' | 'THOUSAND' | 'LAKH' | 'MILLION' | 'CRORE' | 'BILLION'

export type FinancialUnit = {
  code: FinancialUnitCode
  label_en: string
  label_mm: string
  multiplier: number
}

export type FinancialAmountValue = {
  amount: string
  unit: FinancialUnitCode
}

export const defaultFinancialUnits: FinancialUnit[] = [
  { code: 'UNIT', label_en: 'Unit', label_mm: 'ယူနစ်', multiplier: 1 },
  { code: 'THOUSAND', label_en: 'Thousand', label_mm: 'ထောင်', multiplier: 1_000 },
  { code: 'LAKH', label_en: 'Lakh', label_mm: 'သိန်း', multiplier: 100_000 },
  { code: 'MILLION', label_en: 'Million', label_mm: 'သန်း', multiplier: 1_000_000 },
  { code: 'CRORE', label_en: 'Crore', label_mm: 'ကုဋေ', multiplier: 10_000_000 },
  { code: 'BILLION', label_en: 'Billion', label_mm: 'ဘီလီယံ', multiplier: 1_000_000_000 },
]

let unitsRequest: Promise<FinancialUnit[]> | null = null

export const financialUnitService = {
  list() {
    unitsRequest ??= apiClient.get<FinancialUnit[]>('/tenant/financial-units').catch((error) => {
      unitsRequest = null
      throw error
    })

    return unitsRequest
  },
}

export function useFinancialUnits() {
  const [units, setUnits] = useState<FinancialUnit[]>(defaultFinancialUnits)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    financialUnitService.list()
      .then((items) => {
        if (active) setUnits(items)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load financial units.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [])

  return { error, isLoading, units }
}

export function financialAmountToForm(value: string | number | null | undefined, units = defaultFinancialUnits): FinancialAmountValue {
  const amount = Number(value ?? 0)

  if (!Number.isFinite(amount) || amount === 0) return { amount: amount ? String(amount) : '', unit: 'UNIT' }

  const unit = [...units].reverse().find((item) => Math.abs(amount) >= item.multiplier) ?? units[0]
  return { amount: String(amount / unit.multiplier), unit: unit.code }
}

export function financialAmountToBase(value: FinancialAmountValue, units = defaultFinancialUnits) {
  const multiplier = units.find((unit) => unit.code === value.unit)?.multiplier ?? 1
  return Number(value.amount || 0) * multiplier
}

export function formatFinancialAmount(value: string | number | null | undefined, symbol = '', units = defaultFinancialUnits, locale?: string) {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return '-'

  const unit = [...units].reverse().find((item) => Math.abs(amount) >= item.multiplier) ?? units[0]
  const scaled = amount / unit.multiplier
  const formatted = scaled.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })
  const label = locale === 'mm' ? unit.label_mm : unit.label_en
  const unitLabel = unit.code === 'UNIT' ? '' : ` ${label}`

  return `${formatted}${unitLabel}${symbol ? ` ${symbol}` : ''}`
}
