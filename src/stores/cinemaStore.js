import { computed, reactive } from 'vue'
import * as filmsService from '../services/filmsService.js'
import * as sessionsService from '../services/sessionsService.js'
import * as accountsService from '../services/accountsService.js'
import { normalizeId } from '../utils/id.js'

const PRICING_PREF_KEY = 'archlogifront:pricing'
const AUTH_SESSION_KEY = 'archlogifront:session'
const FILMS_CACHE_KEY = 'archlogifront:films-cache'

const safeStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage ?? null
}

const readJsonStorage = (key) => {
  const storage = safeStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

const writeJsonStorage = (key, value) => {
  const storage = safeStorage()
  if (!storage) return
  if (value === null || value === undefined) {
    storage.removeItem(key)
    return
  }
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    // Ignore storage quota errors silently
  }
}

const loadPricingPreferences = () => {
  return readJsonStorage(PRICING_PREF_KEY) ?? {}
}

const readPricingPreference = (email) => {
  if (!email) return ''
  const prefs = loadPricingPreferences()
  return prefs[email] ?? ''
}

const writePricingPreference = (email, pricing) => {
  if (!email || !pricing) return
  const prefs = loadPricingPreferences()
  prefs[email] = pricing
  writeJsonStorage(PRICING_PREF_KEY, prefs)
}

const loadAuthSession = () => {
  const stored = readJsonStorage(AUTH_SESSION_KEY)
  if (!stored) return null
  return {
    user: stored.user ?? null,
    token: stored.token ?? '',
    refreshToken: stored.refreshToken ?? '',
  }
}

const persistAuthSession = (session) => {
  const hasSession = session && (session.user || session.token || session.refreshToken)
  writeJsonStorage(AUTH_SESSION_KEY, hasSession ? session : null)
}

const loadFilmsCache = () => {
  return readJsonStorage(FILMS_CACHE_KEY) ?? []
}

const persistFilmsCache = (films) => {
  writeJsonStorage(FILMS_CACHE_KEY, Array.isArray(films) ? films : [])
}

const enrichUserProfile = (payload) => {
  if (!payload) return null
  const firstName = payload.firstname ?? payload.firstName ?? ''
  const emailLogin = payload.email ? payload.email.split('@')[0] : ''
  const fallbackName = firstName || (payload.lastname ?? 'user')
  const login = payload.login ?? (emailLogin || fallbackName || 'user')
  const pricing = payload.pricing ?? readPricingPreference(payload.email) ?? 'standard'
  return {
    id: payload.id ?? payload.uuid ?? payload.email ?? `user-${Date.now()}`,
    ...payload,
    firstName: firstName || (payload.firstName ?? ''),
    lastName: payload.lastname ?? payload.lastName ?? '',
    login,
    pricing,
  }
}

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
  authToken: '',
  refreshToken: '',
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

const hydrateFilmsFromCache = () => {
  const cachedFilms = loadFilmsCache()
  if (Array.isArray(cachedFilms) && cachedFilms.length) {
    state.films = cachedFilms
    return true
  }
  return false
}

hydrateFilmsFromCache()

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

const setAuthSession = ({ user, token, refreshToken } = {}) => {
  if (user !== undefined) {
    state.currentUser = user ?? null
    state.users = state.currentUser ? [state.currentUser] : []
  }
  if (token !== undefined) {
    state.authToken = token ?? ''
  }
  if (refreshToken !== undefined) {
    state.refreshToken = refreshToken ?? ''
  }
  persistAuthSession({
    user: state.currentUser,
    token: state.authToken,
    refreshToken: state.refreshToken,
  })
  return state.currentUser
}

const storedAuthSession = loadAuthSession()
if (storedAuthSession) {
  setAuthSession(storedAuthSession)
}

const isUnauthorizedError = (error) => {
  if (!error) return false
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : NaN
  if (!Number.isNaN(status)) {
    return status === 401
  }
  const message = error instanceof Error ? error.message : ''
  return typeof message === 'string' && /401/.test(message)
}

const tryRenewAccessToken = async () => {
  if (!state.refreshToken) return false
  try {
    const newToken = await accountsService.refreshAccessToken(state.refreshToken)
    if (!newToken) return false
    setAuthSession({ token: newToken })
    return true
  } catch (error) {
    return false
  }
}

const clearSessionState = () => {
  setAuthSession({ user: null, token: '', refreshToken: '' })
  state.reservations = []
}

const withAccessToken = async (task, { logoutOnFailure = true } = {}) => {
  if (!state.authToken) {
    throw new Error('Identifiez-vous pour continuer')
  }
  try {
    return await task(state.authToken)
  } catch (error) {
    if (isUnauthorizedError(error) && (await tryRenewAccessToken())) {
      return await task(state.authToken)
    }
    if (logoutOnFailure && isUnauthorizedError(error)) {
      clearSessionState()
    }
    throw error
  }
}

const fetchFilms = async () => {
  state.loading.films = true
  resetError('films')
  try {
    const films = await filmsService.listFilms()
    state.films = films
    persistFilmsCache(films)
    state.serviceDown.films = false
  } catch (error) {
    setError('films', error)
    state.serviceDown.films = true
    if (!state.films.length) {
      const hydrated = hydrateFilmsFromCache()
      if (!hydrated && Array.isArray(error?.offlinePayload) && error.offlinePayload.length) {
        state.films = error.offlinePayload
      }
    }
  } finally {
    state.loading.films = false
  }
}

const fetchSessions = async () => {
  state.loading.sessions = true
  resetError('sessions')
  try {
    state.sessions = await sessionsService.listSessions()
    state.serviceDown.sessions = false
  } catch (error) {
    setError('sessions', error)
    state.serviceDown.sessions = true
  } finally {
    state.loading.sessions = false
  }
}

const fetchAccounts = async () => {
  resetError('accounts')
  if (!state.authToken && state.refreshToken) {
    await tryRenewAccessToken()
  }
  if (!state.authToken) {
    clearSessionState()
    return
  }
  state.loading.accounts = true
  try {
    const profile = await withAccessToken((token) => accountsService.fetchProfile(token))
    const user = enrichUserProfile(profile)
    setAuthSession({ user })
    const isAdmin = user?.role === 'admin'
    const reservations = await withAccessToken((token) =>
      isAdmin ? accountsService.listAllReservations(token) : accountsService.listReservations(token),
    )
    const userId = state.currentUser?.id ?? null
    state.reservations = reservations.map((reservation) => ({
      ...reservation,
      userId: reservation.userId ?? userId ?? undefined,
    }))
    if (isAdmin) {
      const users = await withAccessToken((token) => accountsService.listUsers(token))
      state.users = users.map((entry) => enrichUserProfile(entry))
    } else {
      state.users = [user]
    }
    state.serviceDown.accounts = false
  } catch (error) {
    setError('accounts', error)
    state.serviceDown.accounts = true
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
  persistFilmsCache(state.films)
  return created
}

const editFilm = async (id, payload) => {
  ensureService('films')
  const updated = await filmsService.updateFilm(id, payload)
  state.films = state.films.map((film) => (film.id === id ? updated : film))
  persistFilmsCache(state.films)
}

const removeFilm = async (id) => {
  ensureService('films')
  ensureService('sessions')
  ensureService('accounts')
  await filmsService.deleteFilm(id)
  const relatedSessions = state.sessions.filter((session) => session.filmId === id)
  for (const session of relatedSessions) {
    await removeSession(session.id)
  }
  state.films = state.films.filter((film) => film.id !== id)
  persistFilmsCache(state.films)
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
  if (state.authToken) {
    const relatedReservations = state.reservations.filter((reservation) => reservation.sessionId === id)
    for (const reservation of relatedReservations) {
      try {
        await withAccessToken((token) => accountsService.deleteReservation(reservation.id, token))
      } catch (error) {
        // Ignore ticket cleanup errors so the session removal can continue
      }
    }
  }
  state.sessions = state.sessions.filter((session) => session.id !== id)
  state.reservations = state.reservations.filter((reservation) => reservation.sessionId !== id)
}

const registerUser = async ({ firstName, lastName, email, age, password, pricing = 'standard' }) => {
  ensureService('accounts')
  await accountsService.registerUser({
    firstName,
    lastName,
    email,
    age,
    password,
  })
  writePricingPreference(email, pricing)
  await login({ email, password })
  return state.currentUser
}

const login = async ({ email, password }) => {
  ensureService('accounts')
  const { accessToken, refreshToken } = await accountsService.authenticate({ email, password })
  setAuthSession({ token: accessToken, refreshToken })
  await fetchAccounts()
  return state.currentUser
}

const logout = () => {
  clearSessionState()
}

const remainingSeatsForSession = (session) => {
  if (!session) return 0
  const total = Number(session.seatsTotal) || 0
  const taken = Math.min(Math.max(Number(session.seatsTaken) || 0, 0), total)
  return Math.max(0, total - taken)
}

const seatPriceForSession = (session) => {
  const numericPrice = Number(session?.price)
  if (Number.isFinite(numericPrice) && numericPrice >= 0) {
    return numericPrice
  }
  if (state.currentUser?.pricing && PRICING_RULES[state.currentUser.pricing]) {
    return PRICING_RULES[state.currentUser.pricing]
  }
  return PRICING_RULES.standard
}

const addReservation = async ({ sessionId, seats }) => {
  if (!state.currentUser) throw new Error('Identifiez-vous pour réserver')
  ensureService('sessions')
  ensureService('accounts')

  const session = state.sessions.find((item) => item.id === sessionId)
  if (!session) throw new Error('Séance introuvable')

  const available = remainingSeatsForSession(session)
  if (seats > available) {
    throw new Error(`Il reste seulement ${available} place(s) pour cette séance`)
  }

  const updatedSession = await sessionsService.reserveSeats(sessionId, seats)
  const pricePerSeat = seatPriceForSession(session)
  const showingPayload = {
    sessionId,
    seats,
    totalPrice: seats * pricePerSeat,
    createdAt: new Date().toISOString(),
  }
  const reservation = await withAccessToken((token) => accountsService.addReservation(showingPayload, token))
  const targetId = normalizeId(sessionId)
  state.sessions = state.sessions.map((item) =>
    normalizeId(item.id) === targetId ? updatedSession : item,
  )
  const normalizedReservation = {
    ...showingPayload,
    ...(reservation ?? {}),
    id: reservation?.id ?? reservation?.uuid ?? `reservation-${Date.now()}`,
    userId: state.currentUser.id,
  }
  state.reservations.push(normalizedReservation)
  return normalizedReservation
}

const reservationHistory = computed(() => {
  if (!state.currentUser) return []
  const normalizeDate = (value) => {
    const timestamp = new Date(value ?? 0).getTime()
    return Number.isFinite(timestamp) ? timestamp : 0
  }
  return state.reservations
    .filter((reservation) => reservation.userId === state.currentUser.id)
    .slice()
    .sort((a, b) => normalizeDate(b.createdAt) - normalizeDate(a.createdAt))
})

const sessionsByFilm = computed(() => {
  return state.sessions.reduce((acc, session) => {
    const filmKey = normalizeId(session.filmId)
    if (!filmKey) return acc
    acc[filmKey] = acc[filmKey] ?? []
    acc[filmKey].push(session)
    return acc
  }, {})
})

const upcomingSessions = computed(() => {
  const now = Date.now()
  return state.sessions.filter((session) => {
    const schedule = new Date(session.schedule).getTime()
    return Number.isFinite(schedule) && schedule > now
  })
})

const upcomingSessionsByFilm = computed(() => {
  return upcomingSessions.value.reduce((acc, session) => {
    const filmKey = normalizeId(session.filmId)
    if (!filmKey) return acc
    acc[filmKey] = acc[filmKey] ?? []
    acc[filmKey].push(session)
    return acc
  }, {})
})

const filmsWithUpcomingSessions = computed(() => {
  if (state.serviceDown.sessions) {
    return [...state.films]
  }
  const map = upcomingSessionsByFilm.value
  return state.films.filter((film) => (map[normalizeId(film.id)] ?? []).length > 0)
})

const availableUpcomingSeats = computed(() => {
  return upcomingSessions.value.reduce((total, session) => total + remainingSeatsForSession(session), 0)
})

const seatsRemaining = (sessionId) => {
  const targetId = normalizeId(sessionId)
  if (!targetId) return 0
  const session = state.sessions.find((item) => normalizeId(item.id) === targetId)
  if (!session) return 0
  return remainingSeatsForSession(session)
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
  upcomingSessions,
  upcomingSessionsByFilm,
  filmsWithUpcomingSessions,
  availableUpcomingSeats,
  seatsRemaining,
  remainingSeats: remainingSeatsForSession,
  seatPriceForSession,
  PRICING_RULES,
})
