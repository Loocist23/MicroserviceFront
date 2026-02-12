import { apiFilms } from './http.js'
import { clone, isNetworkError } from './network.js'
import filmsMock from './mocks/films.json'
import { parseDurationMinutes } from '../utils/filmFormatting.js'

const unwrap = (payload) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload)

let mockFilms = clone(filmsMock)

const nextMockId = () => `film-${Math.random().toString(16).slice(2)}`

const POSTER_CACHE_KEY = 'archlogifront:imdb-posters'
const RUNTIME_CACHE_KEY = 'archlogifront:imdb-runtime'

const resolveViteEnv = () => {
  try {
    return typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env : {}
  } catch (error) {
    return {}
  }
}

const VITE_ENV = resolveViteEnv()
const OMDB_API_KEY = VITE_ENV?.VITE_OMDB_API_KEY ?? ''
const OMDB_API_BASE_URL = 'https://www.omdbapi.com/'

const safePosterStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage ?? null
}

const loadPosterCache = () => {
  const storage = safePosterStorage()
  if (!storage) return {}
  try {
    const raw = storage.getItem(POSTER_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    return {}
  }
}

const posterCache = new Map(Object.entries(loadPosterCache()))

const persistPosterCache = () => {
  const storage = safePosterStorage()
  if (!storage) return
  try {
    storage.setItem(POSTER_CACHE_KEY, JSON.stringify(Object.fromEntries(posterCache)))
  } catch (error) {
    // Ignore quota errors
  }
}

const normalizeTitle = (title) => {
  if (!title || typeof title !== 'string') return ''
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const slugifyTitle = (title) => {
  const normalized = normalizeTitle(title)
  return normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

const buildPosterCacheKeys = (title, year) => {
  const slug = slugifyTitle(title)
  if (!slug) return []
  const keys = [slug]
  if (year) {
    keys.unshift(`${slug}#${year}`)
  }
  return keys
}

const getCachedPoster = (title, year) => {
  const keys = buildPosterCacheKeys(title, year)
  for (const key of keys) {
    if (posterCache.has(key)) {
      return posterCache.get(key)
    }
  }
  return ''
}

const savePosterToCache = (title, year, url) => {
  if (!url) return
  const keys = buildPosterCacheKeys(title, year)
  if (!keys.length) return
  for (const key of keys) {
    posterCache.set(key, url)
  }
  persistPosterCache()
}

const safeRuntimeStorage = safePosterStorage

const loadRuntimeCache = () => {
  const storage = safeRuntimeStorage()
  if (!storage) return {}
  try {
    const raw = storage.getItem(RUNTIME_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    return {}
  }
}

const runtimeCache = new Map(Object.entries(loadRuntimeCache()))

const persistRuntimeCache = () => {
  const storage = safeRuntimeStorage()
  if (!storage) return
  try {
    storage.setItem(RUNTIME_CACHE_KEY, JSON.stringify(Object.fromEntries(runtimeCache)))
  } catch (error) {
    // Ignore quota errors
  }
}

const getCachedRuntime = (title, year) => {
  const keys = buildPosterCacheKeys(title, year)
  for (const key of keys) {
    if (runtimeCache.has(key)) {
      return Number(runtimeCache.get(key) || 0)
    }
  }
  return 0
}

const saveRuntimeToCache = (title, year, minutes) => {
  const normalized = Number(minutes)
  if (!normalized || normalized <= 0) return
  const keys = buildPosterCacheKeys(title, year)
  if (!keys.length) return
  for (const key of keys) {
    runtimeCache.set(key, normalized)
  }
  persistRuntimeCache()
}

const TEXT_DECODER = typeof TextDecoder === 'function' ? new TextDecoder('utf-8') : null
const SUSPICIOUS_ENCODING = /[ÃÂÊÔâœ]/u
const TEXTUAL_FIELDS = ['name', 'genre', 'director', 'synopsis', 'tagline']

const fixEncodingIfNeeded = (value) => {
  if (typeof value !== 'string') return value
  if (!SUSPICIOUS_ENCODING.test(value) || !TEXT_DECODER) return value
  try {
    const bytes = new Uint8Array(value.length)
    for (let i = 0; i < value.length; i += 1) {
      bytes[i] = value.charCodeAt(i)
    }
    return TEXT_DECODER.decode(bytes)
  } catch (error) {
    return value
  }
}

const normalizeFilmText = (film) => {
  if (!film) return film
  let updated = film
  for (const field of TEXTUAL_FIELDS) {
    const currentValue = film[field]
    const fixedValue = fixEncodingIfNeeded(currentValue)
    if (fixedValue !== currentValue) {
      if (updated === film) {
        updated = { ...film }
      }
      updated[field] = fixedValue
    }
  }
  return updated
}

const buildImdbSuggestionUrl = (title) => {
  const slug = slugifyTitle(title)
  if (!slug) return ''
  const firstChar = slug[0] ?? 'a'
  return `https://v2.sg.media-imdb.com/suggestion/${firstChar}/${slug}.json`
}

const pickImdbCandidate = (entries, { title, year }) => {
  if (!Array.isArray(entries)) return null
  const normalizedYear = Number(year) || null
  if (normalizedYear) {
    const sameYear = entries.find((entry) => Number(entry.y) === normalizedYear)
    if (sameYear) return sameYear
  }
  if (title) {
    const normalizedTitle = normalizeTitle(title)
    const sameTitle = entries.find((entry) => normalizeTitle(entry.l) === normalizedTitle)
    if (sameTitle) return sameTitle
  }
  return entries[0] ?? null
}

const canFetchRuntime = () => Boolean(OMDB_API_KEY && typeof fetch === 'function')

const fetchRuntimeFromOmdb = async (title, year) => {
  if (!canFetchRuntime()) return 0
  if (!title) return 0
  const params = new URLSearchParams({
    apikey: OMDB_API_KEY,
    t: title,
    type: 'movie',
  })
  if (year) {
    params.set('y', year)
  }
  try {
    const response = await fetch(`${OMDB_API_BASE_URL}?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`OMDb ${response.status}`)
    }
    const payload = await response.json()
    if (!payload || payload.Response === 'False') {
      return 0
    }
    return parseDurationMinutes(payload.Runtime || payload.runtime || payload.totalRuntime)
  } catch (error) {
    console.warn('[filmsService] Impossible de récupérer la durée depuis OMDb.', error)
    return 0
  }
}

const fetchImdbPoster = async (title, year) => {
  if (typeof fetch !== 'function') return ''
  const url = buildImdbSuggestionUrl(title)
  if (!url) return ''
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`IMDb ${response.status}`)
    }
    const payload = await response.json()
    const entries = Array.isArray(payload?.d) ? payload.d : []
    const candidate = pickImdbCandidate(entries, { title, year })
    return candidate?.i?.imageUrl ?? ''
  } catch (error) {
    return ''
  }
}

const ensurePoster = async (film) => {
  if (!film) return film
  if (film.posterUrl) {
    savePosterToCache(film.name, film.year, film.posterUrl)
    return film
  }
  const cachedPoster = getCachedPoster(film.name, film.year)
  if (cachedPoster) {
    return { ...film, posterUrl: cachedPoster }
  }
  const remotePoster = await fetchImdbPoster(film.name, film.year)
  if (!remotePoster) return film
  savePosterToCache(film.name, film.year, remotePoster)
  return { ...film, posterUrl: remotePoster }
}

const ensureRuntime = async (film) => {
  if (!film?.name) return film
  const normalizedDuration = parseDurationMinutes(film.duration)
  if (normalizedDuration > 0) {
    saveRuntimeToCache(film.name, film.year, normalizedDuration)
    if (normalizedDuration !== film.duration) {
      return { ...film, duration: normalizedDuration }
    }
    return film
  }
  const cachedRuntime = getCachedRuntime(film.name, film.year)
  if (cachedRuntime > 0) {
    return { ...film, duration: cachedRuntime }
  }
  const remoteRuntime = await fetchRuntimeFromOmdb(film.name, film.year)
  if (!remoteRuntime) return film
  saveRuntimeToCache(film.name, film.year, remoteRuntime)
  return { ...film, duration: remoteRuntime }
}

const attachPosterToFilm = async (film) => {
  if (!film) return film
  let enrichedFilm = normalizeFilmText(film)
  enrichedFilm = await ensurePoster(enrichedFilm)
  enrichedFilm = await ensureRuntime(enrichedFilm)
  return enrichedFilm
}

const attachPosters = async (films) => {
  if (!Array.isArray(films)) return []
  return Promise.all(films.map((film) => attachPosterToFilm(film)))
}

const withFilmsFallback = async (factory, fallback, { propagateFallbackError = false } = {}) => {
  try {
    return await factory()
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('[filmsService] API inaccessible. Utilisation des fixtures locales.', error)
      const fallbackPayload = (await fallback()) ?? []
      if (propagateFallbackError) {
        const offlineError = new Error(error?.message || 'Films indisponibles')
        offlineError.cause = error
        offlineError.offlinePayload = fallbackPayload
        offlineError.isOfflineFallback = true
        throw offlineError
      }
      return fallbackPayload
    }
    throw error
  }
}

const cloneMockFilms = () => clone(mockFilms)

const touchMockFilm = (id, updater) => {
  const index = mockFilms.findIndex((film) => film.id === id)
  if (index === -1) throw new Error('Film introuvable en mode hors-ligne.')
  mockFilms[index] = updater(clone(mockFilms[index]))
  return clone(mockFilms[index])
}

export const listFilms = async () =>
  withFilmsFallback(
    async () => {
      const response = await apiFilms.get('/api/films')
      const films = unwrap(response) ?? []
      return attachPosters(films)
    },
    async () => attachPosters(cloneMockFilms()),
    { propagateFallbackError: true },
  )

export const listGenres = async () =>
  withFilmsFallback(
    async () => {
      const response = await apiFilms.get('/api/genres')
      return unwrap(response) ?? []
    },
    async () => {
      // Retourner des genres mock avec IDs
      return [
        { id: 1, label: "Animation" },
        { id: 2, label: "Drame" },
        { id: 3, label: "Science-fiction" },
        { id: 4, label: "Aventure" },
        { id: 5, label: "Comédie" },
        { id: 6, label: "Action" },
        { id: 7, label: "Thriller" },
        { id: 8, label: "Comédie romantique" },
        { id: 9, label: "Fantaisie" },
        { id: 10, label: "Comédie musicale" },
        { id: 11, label: "Famille" },
        { id: 12, label: "Comédie d'aventure" },
        { id: 13, label: "Épopée" },
        { id: 14, label: "Thriller social" },
        { id: 15, label: "Comédie noire" }
      ]
    },
  )

export const listAgeRatings = async () =>
  withFilmsFallback(
    async () => {
      const response = await apiFilms.get('/api/age-ratings')
      return unwrap(response) ?? []
    },
    async () => {
      // Retourner des age ratings mock avec IDs
      return [
        { id: 1, value: 0 },
        { id: 2, value: 6 },
        { id: 3, value: 10 },
        { id: 4, value: 12 },
        { id: 5, value: 16 },
        { id: 6, value: 18 }
      ]
    },
  )

export const createFilm = async (payload) =>
  withFilmsFallback(
    async () => {
      // Adapter les données pour l'API - utiliser directement genreIds et ageRatingId
      const adaptedPayload = {
        name: payload.name,
        synopsis: payload.synopsis,
        author: payload.author,
        ageRatingId: payload.ageRatingId,
        genreIds: payload.genreIds,
        duration: payload.duration,
        year: payload.year
      }
      const response = await apiFilms.post('/api/films', adaptedPayload)
      return attachPosterToFilm(unwrap(response))
    },
    async () => {
      const created = { 
        id: payload.id ?? nextMockId(), 
        name: payload.name,
        synopsis: payload.synopsis,
        author: payload.author,
        ageRatingId: payload.ageRatingId,
        genreIds: payload.genreIds,
        duration: payload.duration,
        year: payload.year,
        // Pour la compatibilité avec l'affichage existant
        genres: payload.genreIds ? payload.genreIds.map(id => ({ id, label: `Genre ${id}` })) : [],
        ageRating: payload.ageRatingId ? { id: payload.ageRatingId, value: payload.ageRatingId } : null
      }
      mockFilms.push(created)
      return attachPosterToFilm(clone(created))
    },
  )

export const updateFilm = async (id, payload) =>
  withFilmsFallback(
    async () => {
      // Adapter les données pour l'API
      const adaptedPayload = {
        name: payload.name,
        synopsis: payload.synopsis,
        author: payload.author,
        ageRatingId: payload.ageRatingId,
        genreIds: payload.genreIds,
        duration: payload.duration,
        year: payload.year
      }
      const response = await apiFilms.put(`/api/films/${id}`, adaptedPayload)
      return attachPosterToFilm(unwrap(response))
    },
    async () => attachPosterToFilm(touchMockFilm(id, (film) => ({ 
      ...film, 
      name: payload.name,
      synopsis: payload.synopsis,
      author: payload.author,
      ageRatingId: payload.ageRatingId,
      genreIds: payload.genreIds,
      duration: payload.duration,
      year: payload.year,
      // Mettre à jour les objets pour l'affichage
      genres: payload.genreIds ? payload.genreIds.map(id => ({ id, label: `Genre ${id}` })) : film.genres,
      ageRating: payload.ageRatingId ? { id: payload.ageRatingId, value: payload.ageRatingId } : film.ageRating
    }))),
  )

export const deleteFilm = async (id) =>
  withFilmsFallback(
    async () => {
      await apiFilms.delete(`/api/films/${id}`)
      return true
    },
    () => {
      mockFilms = mockFilms.filter((film) => film.id !== id)
      return true
    },
  )
