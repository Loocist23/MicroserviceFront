import { wait, clone } from './network'
import usersData from './mocks/users.json'
import reservationsData from './mocks/reservations.json'

const initialUsers = usersData.map((user) => ({ ...user }))

const initialReservations = reservationsData.map((reservation) => ({ ...reservation }))

let users = [...initialUsers]
let reservations = [...initialReservations]

const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const listUsers = () => wait(() => users)

export const listReservations = () => wait(() => reservations)

export const registerUser = (payload) =>
  wait(() => {
    const user = { ...payload, id: nextId('user') }
    users.push(user)
    return user
  })

export const authenticate = ({ login, password }) =>
  wait(() => {
    const user = users.find((u) => u.login === login && u.password === password)
    if (!user) {
      throw new Error('Identifiants invalides')
    }
    return clone(user)
  })

export const addReservation = (payload) =>
  wait(() => {
    const reservation = { ...payload, id: nextId('reservation'), createdAt: new Date().toISOString() }
    reservations.push(reservation)
    return reservation
  })

export const deleteReservationsBySession = (sessionId) =>
  wait(() => {
    reservations = reservations.filter((reservation) => reservation.sessionId !== sessionId)
    return true
  })

export const deleteReservationsBySessions = (sessionIds) =>
  wait(() => {
    reservations = reservations.filter((reservation) => !sessionIds.includes(reservation.sessionId))
    return true
  })
