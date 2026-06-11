import { useMemo } from 'react'
import { Input, Select } from '../atoms'
import { useUiLocale } from '../../locales/UiLocale'
import { nrcRegions } from './nrc'

export type NrcValue = {
  citizen: string
  number: string
  state: string
  township: string
}

export type NrcPayloadFields = {
  nrc_citizen: string
  nrc_number: string
  nrc_state: string
  nrc_township: string
}

type NrcFieldProps = {
  disabled?: boolean
  hasError?: boolean
  id: string
  onChange: (value: NrcValue) => void
  required?: boolean
  value: NrcValue
}

const nrcDigitPattern = /^[0-9၀-၉]{6}$/
const nrcInputDigitPattern = /[0-9၀-၉]/g

const citizenOptions = [
  { code: 'N', label_mm: 'နိုင်' },
  { code: 'E', label_mm: 'ဧည့်' },
  { code: 'P', label_mm: 'ပြု' },
  { code: 'T', label_mm: 'သီ' },
]

const myanmarDigitMap: Record<string, string> = {
  '၀': '0',
  '၁': '1',
  '၂': '2',
  '၃': '3',
  '၄': '4',
  '၅': '5',
  '၆': '6',
  '၇': '7',
  '၈': '8',
  '၉': '9',
}

export const emptyNrcValue: NrcValue = {
  citizen: '',
  number: '',
  state: '',
  township: '',
}

export function NrcField({ disabled = false, hasError = false, id, onChange, required = false, value }: NrcFieldProps) {
  const { locale, t } = useUiLocale()
  const selectedRegion = useMemo(
    () => nrcRegions.find((region) => region.code_en === value.state),
    [value.state],
  )
  const townships = selectedRegion ? Object.entries(selectedRegion.townships) : []

  function updateState(nextState: string) {
    const nextRegion = nrcRegions.find((region) => region.code_en === nextState)
    const nextTownship = nextRegion && value.township in nextRegion.townships ? value.township : ''

    onChange({ ...value, state: nextState, township: nextTownship })
  }

  function updateNumber(nextNumber: string) {
    const digits = nextNumber.match(nrcInputDigitPattern)?.join('').slice(0, 6) ?? ''

    onChange({ ...value, number: digits })
  }

  return (
    <div className="nrc-field">
      <Select
        aria-label="NRC state"
        disabled={disabled}
        hasError={hasError}
        id={`${id}-state`}
        onChange={(event) => updateState(event.target.value)}
        required={required}
        value={value.state}
      >
        <option value="">{t('State')}</option>
        {nrcRegions.map((region) => (
          <option key={region.code_en} value={region.code_en}>
            {locale === 'mm' ? region.code_mm : region.code_en}
          </option>
        ))}
      </Select>
      <span className="nrc-field__separator" aria-hidden="true">/</span>
      <Select
        aria-label="NRC township"
        disabled={disabled || !selectedRegion}
        hasError={hasError}
        id={`${id}-township`}
        onChange={(event) => onChange({ ...value, township: event.target.value })}
        required={required}
        value={value.township}
      >
        <option value="">{t('Township')}</option>
        {townships.map(([townshipKey, township]) => (
          <option key={townshipKey} value={townshipKey}>
            {locale === 'mm' ? township.code_mm : township.code_eng}
          </option>
        ))}
      </Select>
      <span className="nrc-field__separator" aria-hidden="true">(</span>
      <Select
        aria-label="NRC citizen type"
        disabled={disabled}
        hasError={hasError}
        id={`${id}-citizen`}
        onChange={(event) => onChange({ ...value, citizen: event.target.value })}
        required={required}
        value={value.citizen}
      >
        <option value="">{t('Citizen')}</option>
        {citizenOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {locale === 'mm' ? option.label_mm : option.code}
          </option>
        ))}
      </Select>
      <span className="nrc-field__separator" aria-hidden="true">)</span>
      <Input
        aria-label="NRC number"
        disabled={disabled}
        hasError={hasError}
        id={`${id}-number`}
        inputMode="numeric"
        maxLength={6}
        onChange={(event) => updateNumber(event.target.value)}
        placeholder="123456"
        required={required}
        type="text"
        value={value.number}
      />
    </div>
  )
}

export function mapMyanmarDigitToNumber(char: string) {
  return myanmarDigitMap[char] ?? char
}

export function normalizeMyanmarDigits(value: string) {
  return Array.from(value).map(mapMyanmarDigitToNumber).join('')
}

export function isValidNrcNumber(value: string) {
  return nrcDigitPattern.test(value) && /^[0-9]{6}$/.test(normalizeMyanmarDigits(value))
}

export function isEmptyNrcValue(value: NrcValue) {
  return !value.state && !value.township && !value.citizen && !value.number
}

export function isCompleteNrcValue(value: NrcValue) {
  return Boolean(value.state && value.township && value.citizen && isValidNrcNumber(value.number))
}

export function nrcValueToPayloadFields(value: NrcValue): NrcPayloadFields {
  return {
    nrc_citizen: value.citizen,
    nrc_number: normalizeMyanmarDigits(value.number),
    nrc_state: value.state,
    nrc_township: value.township,
  }
}

export function nrcValueFromFields(value: {
  nrc_citizen?: string | null
  nrc_number?: string | null
  nrc_state?: string | null
  nrc_township?: string | null
}): NrcValue {
  return {
    citizen: value.nrc_citizen ?? '',
    number: value.nrc_number ?? '',
    state: value.nrc_state ?? '',
    township: value.nrc_township ?? '',
  }
}
