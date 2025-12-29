import { apiSessions } from './http.js'

const unwrap = (payload) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload)

export const listSessions = async () => {
  const response = await apiSessions.get('/api/sessions')
  return unwrap(response) ?? []
}

export const createSession = async (payload) => {
  const response = await apiSessions.post('/api/sessions', payload)
  return unwrap(response)
}

export const updateSession = async (id, payload) => {
  const response = await apiSessions.put(`/api/sessions/${id}`, payload)
  return unwrap(response)
}

export const deleteSession = async (id) => {
  await apiSessions.delete(`/api/sessions/${id}`)
  return true
}

export const reserveSeats = async (sessionId, seats) => {
  const response = await apiSessions.post(`/api/sessions/${sessionId}/reserve`, { seats })
  return unwrap(response)
}
