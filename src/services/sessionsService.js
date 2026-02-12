import { apiSessions } from './http.js'
import { clone, isNetworkError } from './network.js'
import sessionsMock from './mocks/sessions.json'

const unwrap = (payload) => (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload)

let mockSessions = clone(sessionsMock)

const nextMockSessionId = () => `session-${Math.random().toString(16).slice(2)}`

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

const normalizeRoomIdentifier = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = Number(value)
  return Number.isNaN(parsed) ? value : parsed
}

const toIsoString = (value) => {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }
  return date.toISOString()
}

const withSessionsFallback = async (factory, fallback) => {
  try {
    return await factory()
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('[sessionsService] API inaccessible. Utilisation des fixtures locales.', error)
      return fallback()
    }
    throw error
  }
}

const cloneMockSessions = () => clone(mockSessions)

const touchMockSession = (id, updater) => {
  const index = mockSessions.findIndex((session) => session.id === id)
  if (index === -1) throw new Error('Séance introuvable en mode hors-ligne.')
  mockSessions[index] = updater(clone(mockSessions[index]))
  return clone(mockSessions[index])
}

const normalizeRoom = (payload = {}, fallback = {}) => ({
  id: payload.id ?? fallback.id ?? null,
  room_number: toNumber(payload.room_number ?? fallback.room_number ?? payload.roomNumber ?? 0),
  seat_number: toNumber(payload.seat_number ?? fallback.seat_number ?? payload.seatsTotal ?? 0),
  room_type: payload.room_type ?? fallback.room_type ?? payload.roomType ?? 'Standard',
})

const normalizeSession = (payload = {}) => {
  const room = normalizeRoom(payload.room ?? payload.Room ?? {}, {
    id: payload.id_room ?? payload.roomId ?? null,
    room_number: payload.roomNumber ?? payload.id_room ?? 0,
    seat_number: payload.seatsTotal ?? 0,
    room_type: payload.roomType ?? 'Standard',
  })
  const seatPrice = toNumber(payload.price ?? payload.cost ?? 0, 0)
  return {
    id: String(payload.id ?? payload.uuid ?? nextMockSessionId()),
    filmId: payload.filmId ?? payload.id_movie ?? '',
    roomId: room.id ?? payload.id_room ?? null,
    roomNumber: toNumber(room.room_number ?? 0),
    roomType: room.room_type ?? 'Standard',
    price: seatPrice,
    seatsTotal: toNumber(room.seat_number ?? 0),
    seatsTaken: toNumber(payload.seatsTaken ?? payload.seats_taken ?? 0),
    schedule: toIsoString(payload.schedule ?? payload.date ?? new Date().toISOString()),
  }
}

const ensureRoom = async ({ roomNumber, seatsTotal, roomType, roomId }) => {
  const normalizedNumber = toNumber(roomNumber, 1)
  const fallbackRoom = () => ({
    id: roomId ?? normalizedNumber ?? `room-${Math.random().toString(16).slice(2)}`,
    room_number: normalizedNumber,
    seat_number: toNumber(seatsTotal, 0),
    room_type: roomType ?? 'Standard',
  })

  try {
    const response = await apiSessions.get('/api/room')
    const rooms = unwrap(response) ?? []
    let existing = rooms.find((room) => Number(room.room_number) === normalizedNumber)
    if (existing) {
      const desiredSeats = toNumber(seatsTotal, existing.seat_number ?? 0)
      const desiredType = roomType ?? existing.room_type ?? null
      const needsUpdate =
        desiredSeats !== toNumber(existing.seat_number, desiredSeats) ||
        (desiredType ?? 'Standard') !== (existing.room_type ?? 'Standard')
      if (needsUpdate) {
        const updatePayload = {
          room_number: existing.room_number,
          seat_number: desiredSeats,
          room_type: desiredType,
        }
        const updated = await apiSessions.put(`/api/room/${existing.id}`, updatePayload)
        existing = unwrap(updated) ?? { ...existing, ...updatePayload }
      }
      return existing
    }

    const createPayload = {
      room_number: normalizedNumber,
      seat_number: toNumber(seatsTotal, 0),
      room_type: roomType ?? null,
    }
    const created = await apiSessions.post('/api/room', createPayload)
    return unwrap(created)
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('[sessionsService] Service salle indisponible. Fallback local utilisé.', error)
      return fallbackRoom()
    }
    throw error
  }
}

const buildShowPayload = (session, roomId) => {
  const normalizedPrice = toNumber(session.price, null)
  return {
    date: toIsoString(session.schedule),
    id_movie: Number(session.filmId) || session.filmId,
    id_room: normalizeRoomIdentifier(roomId ?? session.roomId ?? session.roomNumber, session.roomNumber),
    ...(normalizedPrice !== null ? { price: normalizedPrice } : {}),
  }
}

const normalizeSeatQuantity = (value) => {
  const parsed = Math.floor(toNumber(value, 0))
  return parsed > 0 ? parsed : 0
}

const fetchSessionById = async (sessionId) => {
  const response = await apiSessions.get(`/api/show/${sessionId}`)
  const data = unwrap(response)
  if (!data) {
    throw new Error('Séance introuvable')
  }
  return normalizeSession(data)
}

export const listSessions = async () =>
  withSessionsFallback(
    async () => {
      const response = await apiSessions.get('/api/show')
      const data = unwrap(response) ?? []
      return data.map((entry) => normalizeSession(entry))
    },
    () => cloneMockSessions().map((session) => normalizeSession(session)),
  )

export const createSession = async (payload) =>
  withSessionsFallback(
    async () => {
      const room = await ensureRoom(payload)
      const response = await apiSessions.post('/api/show', buildShowPayload(payload, room.id))
      const show = unwrap(response)
      return normalizeSession({ ...show, room })
    },
    () => {
      const created = normalizeSession({
        ...payload,
        id: payload.id ?? nextMockSessionId(),
      })
      mockSessions.push(created)
      return clone(created)
    },
  )

export const updateSession = async (id, payload) =>
  withSessionsFallback(
    async () => {
      const room = await ensureRoom(payload)
      const response = await apiSessions.put(`/api/show/${id}`, buildShowPayload(payload, room.id))
      const show = unwrap(response)
      return normalizeSession({ ...show, room })
    },
    () => touchMockSession(id, (session) => ({ ...session, ...payload })),
  )

export const deleteSession = async (id) =>
  withSessionsFallback(
    async () => {
      await apiSessions.delete(`/api/show/${id}`)
      return true
    },
    () => {
      mockSessions = mockSessions.filter((session) => session.id !== id)
      return true
    },
  )

export const reserveSeats = async (sessionId, seats) =>
  withSessionsFallback(
    async () => {
      const seatsToAdd = normalizeSeatQuantity(seats)
      if (seatsToAdd > 0) {
        await apiSessions.post(`/api/show/${sessionId}/reserve`, { seats: seatsToAdd })
      }
      return fetchSessionById(sessionId)
    },
    () =>
      normalizeSession(
        touchMockSession(sessionId, (session) => {
          const seatsToAdd = normalizeSeatQuantity(seats)
          const updatedTaken = Math.min(
            toNumber(session.seatsTotal, 0),
            toNumber(session.seatsTaken, 0) + seatsToAdd,
          )
          return { ...session, seatsTaken: updatedTaken }
        }),
      ),
  )

export const listRooms = async () =>
  withSessionsFallback(
    async () => {
      const response = await apiSessions.get('/api/room')
      const rooms = unwrap(response) ?? []
      return rooms.map((room) => normalizeRoom(room))
    },
    () => {
      // Retourner des salles mock
      return [
        { id: 1, room_number: 1, seat_number: 120, room_type: 'Standard' },
        { id: 2, room_number: 2, seat_number: 80, room_type: '3D' },
        { id: 3, room_number: 3, seat_number: 150, room_type: 'IMAX' },
        { id: 4, room_number: 4, seat_number: 100, room_type: 'Dolby Atmos' },
        { id: 5, room_number: 5, seat_number: 60, room_type: 'VIP' }
      ]
    },
  )

export const getRoomById = async (roomId) =>
  withSessionsFallback(
    async () => {
      const response = await apiSessions.get(`/api/room/${roomId}`)
      return normalizeRoom(unwrap(response))
    },
    () => {
      // Retourner une salle mock basée sur l'ID
      const mockRooms = [
        { id: 1, room_number: 1, seat_number: 120, room_type: 'Standard' },
        { id: 2, room_number: 2, seat_number: 80, room_type: '3D' },
        { id: 3, room_number: 3, seat_number: 150, room_type: 'IMAX' },
        { id: 4, room_number: 4, seat_number: 100, room_type: 'Dolby Atmos' },
        { id: 5, room_number: 5, seat_number: 60, room_type: 'VIP' }
      ]
      return mockRooms.find(room => room.id === roomId) || mockRooms[0]
    },
  )
