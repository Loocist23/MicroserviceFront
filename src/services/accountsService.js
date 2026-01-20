import { apiAccounts } from './http.js'

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
  if (showing && typeof showing === 'object') {
    const sessionId = showing.sessionId ?? showing.id ?? null
    const createdAt = ensureIso(showing.createdAt ?? entry.createdAt ?? null)
    return {
      id: uuid ?? sessionId ?? `ticket-${Date.now()}`,
      sessionId,
      seats: showing.seats ?? showing.quantity ?? 1,
      totalPrice: showing.totalPrice ?? showing.price ?? 0,
      createdAt,
      ...('userId' in showing ? { userId: showing.userId } : {}),
    }
  }

  if (typeof showing === 'string') {
    return {
      id: uuid ?? showing,
      sessionId: showing,
      seats: 1,
      totalPrice: 0,
      createdAt: ensureIso(entry.createdAt ?? null),
    }
  }

  return null
}

const normalizeReservationList = (payload) => {
  const data = unwrap(payload)
  if (!data) return []
  const source = Array.isArray(data) ? data : Array.isArray(data.showings) ? data.showings : []
  return source.map(normalizeReservation).filter(Boolean)
}

export const registerUser = async ({ firstName, lastName, email, age, password }) => {
  const body = {
    firstname: firstName,
    lastname: lastName,
    age,
    email,
    password,
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
  const payload = {
    ...showing,
    createdAt: ensureIso(showing.createdAt ?? new Date().toISOString()),
  }
  const response = await apiAccounts.post('/v1/ticket/', { showing: payload }, withToken(token))
  const data = unwrap(response)
  return normalizeReservation({
    uuid: data && typeof data === 'object' ? data.uuid ?? data.id ?? null : null,
    showing: payload,
  })
}

export const deleteReservation = async (reservationId, token) => {
  if (!reservationId) return false
  await apiAccounts.delete(`/v1/ticket/${reservationId}`, withToken(token))
  return true
}
