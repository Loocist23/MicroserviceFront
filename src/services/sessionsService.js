import { wait, clone } from './network'
import sessionsData from './mocks/sessions.json'

const initialSessions = sessionsData.map((session) => ({ ...session }))

let sessions = [...initialSessions]

const nextId = () => `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const listSessions = () => wait(() => sessions)

export const createSession = (payload) =>
  wait(() => {
    const session = { ...payload, id: nextId(), seatsTaken: 0 }
    sessions.push(session)
    return session
  })

export const updateSession = (id, payload) =>
  wait(() => {
    sessions = sessions.map((session) => (session.id === id ? { ...session, ...payload } : session))
    return clone(sessions.find((session) => session.id === id))
  })

export const deleteSession = (id) =>
  wait(() => {
    sessions = sessions.filter((session) => session.id !== id)
    return true
  })

export const deleteByFilm = (filmId) =>
  wait(() => {
    const removedIds = sessions.filter((session) => session.filmId === filmId).map((session) => session.id)
    sessions = sessions.filter((session) => session.filmId !== filmId)
    return removedIds
  })

export const reserveSeats = (sessionId, seats) =>
  wait(() => {
    sessions = sessions.map((session) =>
      session.id === sessionId ? { ...session, seatsTaken: session.seatsTaken + seats } : session,
    )
    return clone(sessions.find((session) => session.id === sessionId))
  })
