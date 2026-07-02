function pad(value: number) {
  return String(value).padStart(2, '0')
}

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function parseDateValue(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = parseLocalDate(value) ?? new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export function formatLocalDate(value: string | null | undefined) {
  const date = parseDateValue(value)

  if (!date) {
    return value || '-'
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatLocalDateTime(value: string | null | undefined) {
  const date = parseDateValue(value)

  if (!date) {
    return value || '-'
  }

  return `${formatLocalDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
