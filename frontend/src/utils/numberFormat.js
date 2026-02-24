const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const compactSuffix = (value, divisor, suffix) => {
  const scaled = value / divisor
  return `${scaled.toFixed(1).replace(/\.0$/, '')}${suffix}`
}

const formatCompactNumber = (value) => {
  const number = toNumber(value)
  const absolute = Math.abs(number)
  const sign = number < 0 ? '-' : ''

  if (absolute >= 1_000_000_000) {
    return `${sign}${compactSuffix(absolute, 1_000_000_000, 'B')}`
  }

  if (absolute >= 1_000_000) {
    return `${sign}${compactSuffix(absolute, 1_000_000, 'M')}`
  }

  if (absolute >= 1_000) {
    return `${sign}${compactSuffix(absolute, 1_000, 'k')}`
  }

  return Math.round(number).toLocaleString('en-UG')
}

const formatCompactCurrency = (value, currencyLabel = 'UGX') =>
  `${currencyLabel} ${formatCompactNumber(value)}`

export { toNumber, formatCompactNumber, formatCompactCurrency }
