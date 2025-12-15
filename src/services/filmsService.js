import { wait, clone } from './network'
import filmsData from './mocks/films.json'

const initialFilms = filmsData.map((film) => ({
  ...film,
  sessionIds: Array.isArray(film.sessionIds) ? film.sessionIds : [],
}))

let films = [...initialFilms]

const randomId = () => Math.random().toString(36).slice(2, 8)
const nextId = () => `film-${Date.now().toString(36)}-${randomId()}`

export const listFilms = () => wait(() => films)

export const createFilm = (payload) =>
  wait(() => {
    const sessionIds = Array.isArray(payload.sessionIds) ? payload.sessionIds : []
    const film = { ...payload, sessionIds, id: nextId() }
    films.push(film)
    return film
  })

export const updateFilm = (id, payload) =>
  wait(() => {
    films = films.map((film) => (film.id === id ? { ...film, ...payload } : film))
    return clone(films.find((film) => film.id === id))
  })

export const deleteFilm = (id) =>
  wait(() => {
    films = films.filter((film) => film.id !== id)
    return true
  })
