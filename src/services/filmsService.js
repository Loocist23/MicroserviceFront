import { apiFilms } from './http.js'

const unwrap = (payload) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload)

export const listFilms = async () => {
  const response = await apiFilms.get('/api/films')
  return unwrap(response) ?? []
}

export const createFilm = async (payload) => {
  const response = await apiFilms.post('/api/films', payload)
  return unwrap(response)
}

export const updateFilm = async (id, payload) => {
  const response = await apiFilms.put(`/api/films/${id}`, payload)
  return unwrap(response)
}

export const deleteFilm = async (id) => {
  await apiFilms.delete(`/api/films/${id}`)
  return true
}
