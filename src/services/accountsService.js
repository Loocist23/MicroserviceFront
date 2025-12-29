import { apiAccounts } from './http.js'

const unwrap = (payload) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload)

const normalizeAuthResponse = (payload) => {
  const data = unwrap(payload)
  if (!data) {
    return { user: null, token: '' }
  }

  if (typeof data === 'object' && data !== null) {
    if ('user' in data || 'token' in data) {
      return {
        user: data.user ?? null,
        token: data.token ?? '',
      }
    }
  }

  return { user: data, token: typeof data === 'object' && data !== null && 'token' in data ? data.token : '' }
}

const withToken = (token, extra = {}) => (token ? { ...extra, token } : extra)

export const listUsers = async (token) => {
  const response = await apiAccounts.get('/v1/user', withToken(token))
  return unwrap(response) ?? []
}

export const listReservations = async (token) => {
  const response = await apiAccounts.get('/v1/ticket', withToken(token))
  return unwrap(response) ?? []
}

export const registerUser = async (payload) => {
  return normalizeAuthResponse(await apiAccounts.post('/v1/user', payload))
}

export const authenticate = async ({ login, password }) => {
  return normalizeAuthResponse(await apiAccounts.post('/v1/user/login', { login, password }))
}

export const addReservation = async (payload, token) => {
  const response = await apiAccounts.post('/v1/ticket', payload, withToken(token))
  return unwrap(response)
}

export const deleteReservationsBySession = async (sessionId, token) => {
  await apiAccounts.delete(`/v1/ticket/session/${sessionId}`, withToken(token))
  return true
}
