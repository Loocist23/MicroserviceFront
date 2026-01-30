<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCinemaStore } from '../stores/cinemaStore.js'
import { formatAgeRatingDisplay, formatDurationDisplay } from '../utils/filmFormatting.js'
import { normalizeId } from '../utils/id.js'
import {
  DEFAULT_TARIFF,
  DEFAULT_BASE_PRICE,
  formatTariffLabel,
  discountForTariff,
} from '../utils/pricing.js'

const props = defineProps({
  selectedFilmId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const store = useCinemaStore()
const router = useRouter()
const route = useRoute()
const normalizedSelectedFilmId = computed(() => normalizeId(props.selectedFilmId))
const filmSelectionLocked = computed(() => Boolean(normalizedSelectedFilmId.value))

const bookingForm = reactive({
  filmId: '',
  sessionId: '',
  seats: 1,
})

const feedback = ref('')
const paymentState = reactive({
  visible: false,
  phase: 'idle',
  result: '',
  title: '',
  description: '',
  variant: 'calm',
})
let paymentToggle = false
const nextPaymentShouldSucceed = () => {
  paymentToggle = !paymentToggle
  return paymentToggle
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const successCopy = [
  { title: 'Paiement confirmé', description: 'Tes billets sont prêts, un reçu arrive par mail.' },
  { title: 'Transaction validée', description: 'Merci ! La salle est réservée à ton nom.' },
]
const failureCopy = [
  { title: 'Paiement interrompu', description: 'Le prestataire a refusé la transaction.' },
  { title: 'Transaction annulée', description: 'Aucune place n’a été débitée.' },
]
const randomFrom = (items) => items[Math.floor(Math.random() * items.length)] ?? items[0]

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
const sessionBasePrice = (session) => {
  const numeric = Number(session?.price)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : DEFAULT_BASE_PRICE
}
const bookingBasePrice = computed(() => sessionBasePrice(selectedSession.value))
const pricePerSeat = computed(() => store.seatPriceForSession(selectedSession.value))
const totalPrice = computed(() => (bookingForm.seats || 0) * pricePerSeat.value)
const activeTariff = computed(() => {
  if (!store.state.currentUser) return DEFAULT_TARIFF
  return store.state.currentUser.pricing ?? store.state.currentUser.tariff ?? DEFAULT_TARIFF
})
const activeTariffLabel = computed(() => formatTariffLabel(activeTariff.value))
const discountDetails = computed(() =>
  discountForTariff(bookingBasePrice.value, activeTariff.value, Number(bookingForm.seats) || 1),
)

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

const openPaymentStage = ({ phase, title, description, result = '' }) => {
  paymentState.visible = true
  paymentState.phase = phase
  paymentState.title = title
  paymentState.description = description
  paymentState.result = result
}

const closePaymentModal = () => {
  paymentState.visible = false
  paymentState.phase = 'idle'
  paymentState.result = ''
  paymentState.title = ''
  paymentState.description = ''
}

const simulatePayment = async (task) => {
  paymentState.variant = Math.random() > 0.5 ? 'spark' : 'pulse'
  openPaymentStage({
    phase: 'redirect',
    title: 'Redirection bancaire',
    description: 'Connexion au prestataire sécurisé…',
  })
  await wait(1000)
  openPaymentStage({
    phase: 'processing',
    title: 'Paiement en cours',
    description: 'Ne ferme pas cette fenêtre, on confirme la transaction.',
  })
  const shouldSucceed = nextPaymentShouldSucceed()
  try {
    if (!shouldSucceed) {
      await wait(700)
      throw new Error('Paiement refusé par la banque.')
    }
    await Promise.all([task(), wait(650)])
    paymentState.variant = Math.random() > 0.5 ? 'spark' : 'pulse'
    const copy = randomFrom(successCopy)
    openPaymentStage({
      phase: 'result',
      title: copy.title,
      description: copy.description,
      result: 'success',
    })
    await wait(1300)
    closePaymentModal()
  } catch (error) {
    paymentState.variant = Math.random() > 0.5 ? 'shake' : 'dim'
    const copy = randomFrom(failureCopy)
    openPaymentStage({
      phase: 'result',
      title: copy.title,
      description: error?.message || copy.description,
      result: 'error',
    })
    await wait(1500)
    closePaymentModal()
    throw error
  }
}

const submitReservation = async () => {
  if (!store.state.currentUser) {
    feedback.value = ''
    const target = route.fullPath || router.currentRoute.value.fullPath
    router.push({ name: 'login', query: { redirect: target } })
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
    await simulatePayment(() =>
      store.addReservation({
        sessionId: bookingForm.sessionId,
        seats: Number(bookingForm.seats),
      }),
    )
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
const historySavings = (reservation) => {
  if (!reservation) return 0
  const appliedTariff =
    reservation.tariff ??
    store.state.currentUser?.pricing ??
    store.state.currentUser?.tariff ??
    DEFAULT_TARIFF
  const session =
    reservation.sessionId &&
    store.state.sessions.find(
      (sessionEntry) => normalizeId(sessionEntry.id) === normalizeId(reservation.sessionId),
    )
  const rawSessionPrice = session ? Number(session.price) : NaN
  const sessionPrice = Number.isFinite(rawSessionPrice) && rawSessionPrice > 0 ? rawSessionPrice : null
  const basePrice = sessionPrice ?? reservation.basePrice ?? DEFAULT_BASE_PRICE
  const { total } = discountForTariff(basePrice, appliedTariff, reservation.seats)
  return total
}
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
        <p class="muted">
          Tarif {{ activeTariffLabel }} : {{ pricePerSeat }} € / place
          <template v-if="store.state.currentUser && discountDetails.hasDiscount">
            · Économie {{ discountDetails.perSeat }} € / place
            <span v-if="bookingForm.seats > 1">({{ discountDetails.total }} € au total)</span>
          </template>
          · Total : {{ totalPrice }} €
        </p>
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
            <span v-if="historySavings(reservation)" class="muted">
              · {{ historySavings(reservation) }} € économisés vs plein tarif
            </span>
          </li>
        </ul>
      </article>
    </div>
  </section>
  <Teleport to="body">
    <transition name="payment-modal-fade">
      <div v-if="paymentState.visible" class="payment-modal">
        <div class="payment-modal__backdrop" />
        <div class="payment-modal__dialog">
          <div
            class="payment-modal__icon"
            :class="[
              `payment-modal__icon--${paymentState.result || paymentState.phase}`,
              `payment-modal__icon--${paymentState.variant}`,
            ]"
          >
            <span v-if="paymentState.phase === 'processing' && !paymentState.result" class="payment-modal__spinner" />
            <span v-else-if="paymentState.result === 'success'" class="payment-modal__glyph">✓</span>
            <span v-else-if="paymentState.result === 'error'" class="payment-modal__glyph">!</span>
            <span v-else class="payment-modal__glyph">→</span>
          </div>
          <p class="payment-modal__title">{{ paymentState.title }}</p>
          <p class="payment-modal__text">{{ paymentState.description }}</p>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
