export const formatAgeRating = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    if ('value' in value && value.value !== undefined && value.value !== null) {
      return value.value
    }
    if ('label' in value && value.label) {
      return value.label
    }
    if ('name' in value && value.name) {
      return value.name
    }
  }
  return value
}

export const formatAgeRatingDisplay = (value) => {
  const formatted = formatAgeRating(value)
  if (formatted === null || formatted === undefined || formatted === '') {
    return '—'
  }
  if (typeof formatted === 'number') {
    return `${formatted}+`
  }
  const text = String(formatted)
  return /^\d+$/.test(text) ? `${text}+` : text
}

const isoDurationRegex = /PT(?:(\d+)H)?(?:(\d+)M)?/i

export const parseDurationMinutes = (value) => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  const text = String(value).trim()
  if (!text) return 0
  const isoMatch = text.match(isoDurationRegex)
  if (isoMatch) {
    const hours = Number(isoMatch[1] || 0)
    const minutes = Number(isoMatch[2] || 0)
    const total = hours * 60 + minutes
    return total > 0 ? total : 0
  }
  let total = 0
  const hoursMatch = text.match(/(\d+)\s*h/i)
  if (hoursMatch) {
    total += Number(hoursMatch[1]) * 60
  }
  const minsMatch = text.match(/(\d+)\s*(?:min|m)\b/i)
  if (minsMatch) {
    total += Number(minsMatch[1])
  }
  if (total > 0) return total
  const fallback = parseInt(text, 10)
  return Number.isNaN(fallback) ? 0 : fallback
}

export const formatDurationDisplay = (value, { fallback = 'Durée inconnue' } = {}) => {
  const minutes = parseDurationMinutes(value)
  return minutes > 0 ? `${minutes} min` : fallback
}
