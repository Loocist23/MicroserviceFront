export const normalizeId = (value) => {
  if (value === null || value === undefined) return ''
  return String(value)
}
