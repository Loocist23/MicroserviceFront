<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore'

const store = useCinemaStore()

const bookingForm = reactive({
  filmId: '',
  sessionId: '',
  seats: 1,
})

const feedback = ref('')

const pricePerSeat = computed(() => {
  if (!store.state.currentUser) return store.PRICING_RULES.standard
  return store.PRICING_RULES[store.state.currentUser.pricing] ?? store.PRICING_RULES.standard
})

const availableSessions = computed(() => {
  if (!bookingForm.filmId) return store.state.sessions
  return store.state.sessions.filter((session) => session.filmId === bookingForm.filmId)
})

watch(
  () => store.state.films,
  (films) => {
    if (!bookingForm.filmId && films.length) {
      bookingForm.filmId = films[0].id
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => bookingForm.filmId,
  () => {
    const list = availableSessions.value
    if (list.length) {
      bookingForm.sessionId = list[0].id
    } else {
      bookingForm.sessionId = ''
    }
  },
)

const seatsLeft = computed(() => store.seatsRemaining(bookingForm.sessionId))
const totalPrice = computed(() => (bookingForm.seats || 0) * pricePerSeat.value)

const formatSchedule = (session) =>
  new Date(session.schedule).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

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

const filmName = (filmId) => store.state.films.find((film) => film.id === filmId)?.name ?? 'Film'

const history = store.reservationHistory
</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <h2>Réservations en ligne</h2>
      <p>Connecte-toi, choisis ta séance et réserve en fonction du nombre de places restantes.</p>
      <p v-if="store.state.serviceDown.sessions || store.state.serviceDown.accounts" class="error">
        Service comptes ou séances indisponible : patience, on règle ça en salle de projection.
      </p>
    </header>

    <form class="form" @submit.prevent="submitReservation">
      <h3>Nouvelle réservation</h3>
      <label>
        Film
        <select v-model="bookingForm.filmId">
          <option v-for="film in store.state.films" :key="film.id" :value="film.id">
            {{ film.name }}
          </option>
        </select>
      </label>
      <label>
        Séance
        <select v-model="bookingForm.sessionId">
          <option v-if="!availableSessions.length" disabled value="">Aucune séance</option>
          <option v-for="session in availableSessions" :key="session.id" :value="session.id">
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

    <div class="card-list">
      <article class="card">
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
