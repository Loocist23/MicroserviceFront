<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore.js'
import { formatAgeRatingDisplay, formatDurationDisplay } from '../utils/filmFormatting.js'
import { normalizeId } from '../utils/id.js'

const props = defineProps({
  selectedFilmId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const store = useCinemaStore()
const normalizedSelectedFilmId = computed(() => normalizeId(props.selectedFilmId))
const filmSelectionLocked = computed(() => Boolean(normalizedSelectedFilmId.value))

const bookingForm = reactive({
  filmId: '',
  sessionId: '',
  seats: 1,
})

const feedback = ref('')

const upcomingSessions = computed(() => {
  const now = Date.now()
  return store.state.sessions.filter((session) => {
    const schedule = new Date(session.schedule).getTime()
    return Number.isFinite(schedule) && schedule > now
  })
})

const availableSessions = computed(() => {
  if (!bookingForm.filmId) return upcomingSessions.value
  return upcomingSessions.value.filter(
    (session) => normalizeId(session.filmId) === bookingForm.filmId,
  )
})

watch(
  () => store.state.films,
  (films) => {
    if (!films.length) return
    const normalizedSelected = normalizedSelectedFilmId.value
    if (normalizedSelected) {
      const exists = films.some((film) => normalizeId(film.id) === normalizedSelected)
      if (exists) {
        bookingForm.filmId = normalizedSelected
        return
      }
    }
    if (!bookingForm.filmId && films[0]) {
      bookingForm.filmId = normalizeId(films[0].id)
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => normalizedSelectedFilmId.value,
  (filmId) => {
    if (filmId && bookingForm.filmId !== filmId) {
      bookingForm.filmId = filmId
    }
  },
)

watch(
  () => bookingForm.filmId,
  () => {
    const list = availableSessions.value
    if (list.length) {
      bookingForm.sessionId = normalizeId(list[0].id)
    } else {
      bookingForm.sessionId = ''
    }
  },
)

const seatsLeft = computed(() => store.seatsRemaining(bookingForm.sessionId))
const selectedSession = computed(
  () =>
    store.state.sessions.find((session) => normalizeId(session.id) === bookingForm.sessionId) ?? null,
)
const pricePerSeat = computed(() => store.seatPriceForSession(selectedSession.value))
const totalPrice = computed(() => (bookingForm.seats || 0) * pricePerSeat.value)

const currentFilm = computed(
  () => store.state.films.find((film) => normalizeId(film.id) === bookingForm.filmId) ?? null,
)

const formatSchedule = (session) =>
  new Date(session.schedule).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

const filmBackdropStyle = computed(() => {
  if (!currentFilm.value?.posterUrl) return {}
  return {
    backgroundImage: `linear-gradient(120deg, rgba(15,23,42,0.4), rgba(0,0,0,0.7)), url(${currentFilm.value.posterUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

const submitReservation = async () => {
  if (!store.state.currentUser) {
    feedback.value = 'Connecte-toi avant de réserver.'
    return
  }
  if (!bookingForm.sessionId) {
    feedback.value = 'Sélectionne une séance.'
    return
  }
  if (!bookingForm.seats || bookingForm.seats < 1) {
    feedback.value = 'Choisis au moins une place.'
    return
  }

  try {
    await store.addReservation({
      sessionId: bookingForm.sessionId,
      seats: Number(bookingForm.seats),
    })
    feedback.value = 'Réservation confirmée.'
  } catch (error) {
    feedback.value = error.message
  }
}

const closePanel = () => emit('close')

const filmName = (filmId) =>
  store.state.films.find((film) => normalizeId(film.id) === normalizeId(filmId))?.name ?? 'Film'

const history = store.reservationHistory
const ageRatingText = (value) => formatAgeRatingDisplay(value)
const durationText = (value) => formatDurationDisplay(value)
</script>

<template>
  <section class="panel booking-panel">
    <header class="booking-panel__header">
      <div>
        <p class="eyebrow eyebrow--dark">Réservation</p>
        <h2 v-if="currentFilm">{{ currentFilm.name }}</h2>
        <h2 v-else>Choisis un film dans le catalogue</h2>
        <p>
          Connecte-toi, sélectionne ta séance et confirme en fonction des places restantes. L’ensemble
          des étapes se passe ici, sans rechargement de page.
        </p>
        <p v-if="store.state.serviceDown.sessions || store.state.serviceDown.accounts" class="error">
          Service comptes ou séances indisponible : patience, on règle ça en salle de projection.
        </p>
      </div>
      <button class="ghost" type="button" @click="closePanel">Fermer</button>
    </header>

    <div v-if="currentFilm" class="booking-panel__film">
      <div class="booking-panel__poster" :style="filmBackdropStyle" />
      <div>
        <p class="booking-panel__tagline">{{ currentFilm.tagline }}</p>
        <p class="muted">
          {{ currentFilm.genre }} · {{ durationText(currentFilm.duration) }} · {{ currentFilm.year }} ·
          Âge {{ ageRatingText(currentFilm.ageRating) }}
        </p>
        <p>{{ currentFilm.synopsis }}</p>
      </div>
    </div>

    <div class="booking-panel__grid">
      <form class="form booking-panel__form" @submit.prevent="submitReservation">
        <h3>Nouvelle réservation</h3>
        <p class="hint">Choisis ta séance et tes places puis confirme immédiatement.</p>
        <label v-if="!filmSelectionLocked">
          Film
          <select v-model="bookingForm.filmId">
            <option
              v-for="film in store.state.films"
              :key="film.id"
              :value="normalizeId(film.id)"
            >
              {{ film.name }}
            </option>
          </select>
        </label>
        <div v-else class="readonly-field">
          <span>Film</span>
          <div class="readonly-field__value">{{ currentFilm?.name ?? 'Film sélectionné' }}</div>
        </div>
        <label>
          Séance
          <select v-model="bookingForm.sessionId">
            <option v-if="!availableSessions.length" disabled value="">Aucune séance</option>
            <option
              v-for="session in availableSessions"
              :key="session.id"
              :value="normalizeId(session.id)"
            >
              {{ formatSchedule(session) }} — Salle {{ session.roomNumber }}
            </option>
          </select>
        </label>
        <label>
          Nombre de places
          <input v-model.number="bookingForm.seats" type="number" min="1" />
        </label>
        <p class="muted">Places restantes : {{ seatsLeft }}</p>
        <p class="muted">Tarif appliqué : {{ pricePerSeat }} € · Total : {{ totalPrice }} €</p>
        <button type="submit" class="primary" :disabled="!store.state.currentUser">
          Réserver
        </button>
        <p v-if="feedback" class="hint">{{ feedback }}</p>
      </form>

      <article class="card booking-panel__history">
        <h3>Historique personnel</h3>
        <p v-if="!history.length" class="hint">Pas encore de réservation.</p>
        <ul v-else class="reservation-history">
          <li v-for="reservation in history" :key="reservation.id">
            {{ filmName(
              store.state.sessions.find((s) => s.id === reservation.sessionId)?.filmId ?? '',
            ) }}
            · {{ reservation.seats }} place(s) · {{ reservation.totalPrice }} € ·
            {{ new Date(reservation.createdAt).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
            }) }}
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
