const RAW_TARIFFS = Object.freeze({
  standard: { label: 'Plein tarif', discount: 0 },
  student: { label: 'Tarif étudiant', discount: 3 },
  under16: { label: 'Moins de 16 ans', discount: 5 },
  unemployed: { label: 'Demandeur d’emploi', discount: 4 },
})

const TARIFF_ALIASES = {
  standard: 'standard',
  student: 'student',
  etudiant: 'student',
  '-16': 'under16',
  under16: 'under16',
  chomeur: 'unemployed',
  unemployed: 'unemployed',
}

export const DEFAULT_TARIFF = 'standard'
export const DEFAULT_BASE_PRICE = 12

export const normalizeTariff = (value) => {
  if (!value && value !== 0) return DEFAULT_TARIFF
  const key = String(value).trim().toLowerCase()
  return TARIFF_ALIASES[key] ?? (RAW_TARIFFS[key] ? key : DEFAULT_TARIFF)
}

const tariffInfo = (value) => RAW_TARIFFS[normalizeTariff(value)] ?? RAW_TARIFFS[DEFAULT_TARIFF]

const sanitizeBasePrice = (basePrice) => {
  const numeric = Number(basePrice)
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric
  }
  return DEFAULT_BASE_PRICE
}

export const priceForTariff = (basePrice, tariff) => {
  const reference = sanitizeBasePrice(basePrice)
  const discount = tariffInfo(tariff).discount ?? 0
  return Math.max(0, Number(reference) - Number(discount))
}

export const formatTariffLabel = (value) => tariffInfo(value).label

export const discountForTariff = (basePrice, tariff, seats = 1) => {
  const normalized = normalizeTariff(tariff)
  const sanitizedBase = sanitizeBasePrice(basePrice)
  const currentPrice = priceForTariff(sanitizedBase, normalized)
  const perSeat = Math.max(0, sanitizedBase - currentPrice)
  const seatCount = Math.max(1, Number(seats) || 1)
  const total = perSeat * seatCount
  return {
    tariff: normalized,
    perSeat,
    total,
    hasDiscount: perSeat > 0,
    standardPrice: sanitizedBase,
    currentPrice,
  }
}

export const listTariffs = (basePrice = DEFAULT_BASE_PRICE) =>
  Object.entries(RAW_TARIFFS).map(([tariff, meta]) => ({
    value: tariff,
    label: meta.label,
    discount: meta.discount ?? 0,
    price: priceForTariff(basePrice, tariff),
  }))

export const TARIFFS = RAW_TARIFFS
