import { computed, reactive } from 'vue'
import * as filmsService from '../services/filmsService'
import * as sessionsService from '../services/sessionsService'
import * as accountsService from '../services/accountsService'

const PRICING_RULES = {
  standard: 12,
  etudiant: 9,
  '-16': 7,
  chomeur: 8,
}

const state = reactive({
  films: [],
  sessions: [],
  users: [],
  reservations: [],
  currentUser: null,
  loading: {
    films: false,
    sessions: false,
    accounts: false,
  },
  errors: {
    films: '',
    sessions: '',
    accounts: '',
  },
  serviceDown: {
    films: false,
    sessions: false,
    accounts: false,
  },
})

const ensureService = (key) => {
  if (state.serviceDown[key]) {
    throw new Error(`Le service ${key} est indisponible`)
  }
}

const setError = (key, error) => {
  state.errors[key] = error instanceof Error ? error.message : String(error ?? '')
}

const resetError = (key) => {
  state.errors[key] = ''
}

const fetchFilms = async () => {
  if (state.serviceDown.films) return
  state.loading.films = true
  resetError('films')
  try {
    state.films = await filmsService.listFilms()
  } catch (error) {
    setError('films', error)
  } finally {
    state.loading.films = false
  }
}

const fetchSessions = async () => {
  if (state.serviceDown.sessions) return
  state.loading.sessions = true
  resetError('sessions')
  try {
    state.sessions = await sessionsService.listSessions()
  } catch (error) {
    setError('sessions', error)
  } finally {
    state.loading.sessions = false
  }
}

const fetchAccounts = async () => {
  if (state.serviceDown.accounts) return
  state.loading.accounts = true
  resetError('accounts')
  try {
    state.users = await accountsService.listUsers()
    state.reservations = await accountsService.listReservations()
  } catch (error) {
    setError('accounts', error)
  } finally {
    state.loading.accounts = false
  }
}

const bootstrap = async () => {
  await Promise.all([fetchFilms(), fetchSessions(), fetchAccounts()])
}

const setServiceStatus = (service, down) => {
  state.serviceDown[service] = down
  if (!down) {
    if (service === 'films') fetchFilms()
    if (service === 'sessions') fetchSessions()
    if (service === 'accounts') fetchAccounts()
  }
}

const addFilm = async (payload) => {
  ensureService('films')
  const created = await filmsService.createFilm(payload)
  state.films.push(created)
}

const editFilm = async (id, payload) => {
  ensureService('films')
  const updated = await filmsService.updateFilm(id, payload)
  state.films = state.films.map((film) => (film.id === id ? updated : film))
}

const removeFilm = async (id) => {
  ensureService('films')
  ensureService('sessions')
  ensureService('accounts')
  await filmsService.deleteFilm(id)
  const removedSessions = await sessionsService.deleteByFilm(id)
  await accountsService.deleteReservationsBySessions(removedSessions)
  state.films = state.films.filter((film) => film.id !== id)
  state.sessions = state.sessions.filter((session) => session.filmId !== id)
  state.reservations = state.reservations.filter(
    (reservation) => !removedSessions.includes(reservation.sessionId),
  )
}

const addSession = async (payload) => {
  ensureService('sessions')
  const created = await sessionsService.createSession(payload)
  state.sessions.push(created)
}

const editSession = async (id, payload) => {
  ensureService('sessions')
  const updated = await sessionsService.updateSession(id, payload)
  state.sessions = state.sessions.map((session) => (session.id === id ? updated : session))
}

const removeSession = async (id) => {
  ensureService('sessions')
  ensureService('accounts')
  await sessionsService.deleteSession(id)
  await accountsService.deleteReservationsBySession(id)
  state.sessions = state.sessions.filter((session) => session.id !== id)
  state.reservations = state.reservations.filter((reservation) => reservation.sessionId !== id)
}

const registerUser = async (payload) => {
  ensureService('accounts')
  const created = await accountsService.registerUser(payload)
  state.users.push(created)
  state.currentUser = created
  return created
}

const login = async (credentials) => {
  ensureService('accounts')
  const user = await accountsService.authenticate(credentials)
  state.currentUser = user
  return user
}

const logout = () => {
  state.currentUser = null
}

const addReservation = async ({ sessionId, seats }) => {
  if (!state.currentUser) throw new Error('Identifiez-vous pour réserver')
  ensureService('sessions')
  ensureService('accounts')

  const session = state.sessions.find((item) => item.id === sessionId)
  if (!session) throw new Error('Séance introuvable')

  const available = session.seatsTotal - session.seatsTaken
  if (seats > available) {
    throw new Error(`Il reste seulement ${available} place(s) pour cette séance`)
  }

  const updatedSession = await sessionsService.reserveSeats(sessionId, seats)
  const pricePerSeat = PRICING_RULES[state.currentUser.pricing] ?? PRICING_RULES.standard
  const reservation = await accountsService.addReservation({
    sessionId,
    userId: state.currentUser.id,
    seats,
    totalPrice: seats * pricePerSeat,
  })
  state.sessions = state.sessions.map((item) => (item.id === sessionId ? updatedSession : item))
  state.reservations.push(reservation)
  return reservation
}

const reservationHistory = computed(() => {
  if (!state.currentUser) return []
  return state.reservations.filter((reservation) => reservation.userId === state.currentUser.id)
})

const sessionsByFilm = computed(() => {
  const index = state.sessions.reduce((acc, session) => {
    acc[session.filmId] = acc[session.filmId] ?? []
    acc[session.filmId].push(session)
    return acc
  }, {})
  return index
})

const seatsRemaining = (sessionId) => {
  const session = state.sessions.find((item) => item.id === sessionId)
  if (!session) return 0
  return session.seatsTotal - session.seatsTaken
}

export const useCinemaStore = () => ({
  state,
  bootstrap,
  fetchFilms,
  fetchSessions,
  fetchAccounts,
  setServiceStatus,
  addFilm,
  editFilm,
  removeFilm,
  addSession,
  editSession,
  removeSession,
  registerUser,
  login,
  logout,
  addReservation,
  reservationHistory,
  sessionsByFilm,
  seatsRemaining,
  PRICING_RULES,
})
