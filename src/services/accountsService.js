import { apiAccounts } from './http.js'
import { clone, isNetworkError } from './network.js'
import usersMock from './mocks/users.json'
import reservationsMock from './mocks/reservations.json'
import { normalizeTariff } from '../utils/pricing.js'

const unwrap = (payload) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload)

const withToken = (token, extra = {}) => (token ? { ...extra, token } : extra)

const normalizeTokenPair = (payload) => {
  const data = unwrap(payload)
  const tokenPayload = data && typeof data === 'object' ? data.token ?? data : {}
  return {
    accessToken: tokenPayload && typeof tokenPayload === 'object' ? tokenPayload.access ?? '' : '',
    refreshToken: tokenPayload && typeof tokenPayload === 'object' ? tokenPayload.refresh ?? '' : '',
  }
}

const ensureIso = (value) => {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }
  return date.toISOString()
}

const safeJsonParse = (maybeJson) => {
  if (typeof maybeJson !== 'string') return maybeJson
  try {
    return JSON.parse(maybeJson)
  } catch (error) {
    return maybeJson
  }
}

const normalizeReservation = (entry) => {
  if (!entry) return null

  const uuid = entry.uuid ?? entry.id ?? entry.ticketId ?? null
  let showing = entry.showing ?? null
  if (!showing && typeof entry === 'object' && 'showing' in entry === false) {
    showing = entry
  }

  showing = safeJsonParse(showing)
  const linkedUserId =
    entry.user_id ?? entry.userId ?? (showing && typeof showing === 'object' ? showing.userId : null)
  if (showing && typeof showing === 'object') {
    const sessionId =
      showing.sessionId ??
      showing.session_id ??
      showing.session ??
      entry.session_id ??
      entry.sessionId ??
      showing.id ??
      entry.session ??
      null
    const createdAt = ensureIso(showing.createdAt ?? entry.created_at ?? entry.createdAt ?? null)
    const seats =
      Number(
        showing.seats ?? showing.quantity ?? entry.seats ?? entry.quantity ?? entry.seatCount ?? 1,
      ) || 1
    const priceFromApi = entry.price_cents ?? entry.priceCents ?? null
    const totalPrice = Number.isFinite(Number(priceFromApi))
      ? Number(priceFromApi) / 100
      : Number(showing.totalPrice ?? entry.totalPrice ?? entry.price ?? 0) || 0
    const tariff = normalizeTariff(entry.tariff ?? showing.tariff ?? null)
    const basePriceValue =
      Number(
        showing.basePrice ??
          showing.base_price ??
          entry.basePrice ??
          entry.base_price ??
          entry.standard_price ??
          0,
      ) || null
    return {
      id: uuid ?? sessionId ?? `ticket-${Date.now()}`,
      sessionId,
      seats,
      totalPrice,
      createdAt,
      ...(linkedUserId ? { userId: linkedUserId } : {}),
      tariff,
      ...(basePriceValue ? { basePrice: basePriceValue } : {}),
    }
  }

  if (typeof showing === 'string') {
    return {
      id: uuid ?? showing,
      sessionId: showing,
      seats: 1,
      totalPrice: 0,
      createdAt: ensureIso(entry.createdAt ?? null),
      tariff: normalizeTariff(entry.tariff ?? null),
      ...(linkedUserId ? { userId: linkedUserId } : {}),
      ...(entry.basePrice ? { basePrice: Number(entry.basePrice) || undefined } : {}),
    }
  }

  return null
}

const normalizeReservationList = (payload) => {
  const data = unwrap(payload)
  if (!data) return []
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data.showings)
      ? data.showings
      : Array.isArray(data.tickets)
        ? data.tickets
        : []
  return source.map(normalizeReservation).filter(Boolean)
}

const normalizeUserList = (payload) => {
  const data = unwrap(payload)
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.users)) return data.users
  return []
}

const withAccountsFallback = async (factory, fallback) => {
  try {
    return await factory()
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('[accountsService] API comptes indisponible. Utilisation des fixtures locales.', error)
      return fallback()
    }
    throw error
  }
}

const cloneMockUsers = () => clone(usersMock)
const cloneMockReservations = () => clone(reservationsMock)

export const registerUser = async ({ firstName, lastName, email, age, password, tariff }) => {
  const normalizedTariff = tariff ? normalizeTariff(tariff) : undefined
  const body = {
    firstname: firstName,
    lastname: lastName,
    age,
    email,
    password,
    ...(normalizedTariff ? { tariff: normalizedTariff } : {}),
  }
  const response = await apiAccounts.post('/v1/user/', body)
  return unwrap(response)
}

export const authenticate = async ({ email, password }) => {
  return normalizeTokenPair(await apiAccounts.post('/v1/user/login', { email, password }))
}

export const fetchProfile = async (token) => {
  const response = await apiAccounts.get('/v1/user/me', withToken(token))
  return unwrap(response)
}

export const refreshAccessToken = async (refreshToken) => {
  const response = await apiAccounts.get('/v1/user/refresh', withToken(refreshToken))
  const { accessToken } = normalizeTokenPair(response)
  return accessToken
}

export const listReservations = async (token) => {
  try {
    const response = await apiAccounts.get('/v1/ticket/', withToken(token))
    return normalizeReservationList(response)
  } catch (error) {
    if (error instanceof Error && /404/.test(error.message)) {
      return []
    }
    throw error
  }
}

export const addReservation = async (showing, token) => {
  const sessionIdentifier = showing.sessionId ?? showing.session ?? showing.session_id ?? null
  if (!sessionIdentifier) {
    throw new Error('Identifiant de séance manquant pour la réservation')
  }
  const payload = {
    sessionId: sessionIdentifier,
    seats: Number(showing.seats) || 1,
    createdAt: ensureIso(showing.createdAt ?? new Date().toISOString()),
    totalPrice: Number(showing.totalPrice ?? 0) || 0,
    ...(Number(showing.basePrice) ? { basePrice: Number(showing.basePrice) } : {}),
  }
  const body = {
    showing: {
      ...payload,
      session: sessionIdentifier,
    },
  }
  const response = await apiAccounts.post('/v1/ticket/', body, withToken(token))
  const data = unwrap(response)
  return (
    normalizeReservation({
      ...(data && typeof data === 'object' ? data : {}),
      showing: data?.showing ?? payload,
    }) ?? {
      id: data && typeof data === 'object' ? data.uuid ?? data.id ?? `ticket-${Date.now()}` : `ticket-${Date.now()}`,
      sessionId: payload.sessionId ?? showing.sessionId ?? showing.session,
      seats: payload.seats,
      totalPrice: Number(showing.totalPrice ?? 0) || 0,
      createdAt: payload.createdAt,
      basePrice: payload.basePrice,
      tariff: normalizeTariff(data?.tariff ?? null),
    }
  )
}

export const deleteReservation = async (reservationId, token) => {
  if (!reservationId) return false
  await apiAccounts.delete(`/v1/ticket/${reservationId}`, withToken(token))
  return true
}

export const listUsers = async (token) => {
  const payload = await withAccountsFallback(
    () => apiAccounts.get('/v1/user/', withToken(token)),
    () => cloneMockUsers(),
  )
  return normalizeUserList(payload)
}

export const listAllReservations = async (token) => {
  const payload = await withAccountsFallback(
    () => apiAccounts.get('/v1/ticket/?scope=all', withToken(token)),
    () => cloneMockReservations(),
  )
  return normalizeReservationList(payload)
}
