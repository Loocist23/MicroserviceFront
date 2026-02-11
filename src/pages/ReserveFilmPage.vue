<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ReservationsPanel from '../components/ReservationsPanel.vue'
import { useCinemaStore } from '../stores/cinemaStore.js'
import { formatDurationDisplay, formatAgeRatingDisplay } from '../utils/filmFormatting.js'
import { normalizeId } from '../utils/id.js'

const route = useRoute()
const router = useRouter()
const store = useCinemaStore()

const routeFilmId = computed(() => normalizeId(route.params.filmId))

const film = computed(
  () => store.state.films.find((item) => normalizeId(item.id) === routeFilmId.value) ?? null,
)

const upcomingSessions = computed(() => {
  const now = Date.now()
  return store.state.sessions
    .filter((session) => normalizeId(session.filmId) === routeFilmId.value)
    .filter((session) => {
      const schedule = new Date(session.schedule).getTime()
      return Number.isFinite(schedule) && schedule > now
    })
    .sort((a, b) => new Date(a.schedule) - new Date(b.schedule))
})

const goBackToCatalogue = () => {
  router.push({ name: 'catalogue' })
}

const durationText = (value) => formatDurationDisplay(value)
const ageRatingText = (value) => formatAgeRatingDisplay(value)

const nextSessionForPricing = computed(() => upcomingSessions.value[0] ?? null)
const pricePerSeat = computed(() => store.seatPriceForSession(nextSessionForPricing.value))
</script>

<template>
  <div class="page page--catalogue-detail">
    <section v-if="film" class="hero hero--catalog">
      <div class="hero__content">
        <p class="eyebrow">Réservation</p>
        <h1>{{ film.name }}</h1>
        <p>{{ film.tagline || film.synopsis }}</p>
        <p class="muted">
          {{ film.genre }} · {{ durationText(film.duration) }} · {{ film.year }} · Âge
          {{ ageRatingText(film.ageRating) }}
        </p>
        <div class="hero__cta">
          <button class="ghost" type="button" @click="goBackToCatalogue">← Retour au catalogue</button>
        </div>
        <p class="hint">
          Les séances apparaissent directement dans le formulaire ci-dessous. Tarif appliqué :
          {{ pricePerSeat }} € / place
        </p>
      </div>
      <div class="hero__stats">
        <div class="hero__stat">
          <p>Prochaines séances</p>
          <strong>{{ upcomingSessions.length }}</strong>
        </div>
        <div class="hero__stat">
          <p>Genre</p>
          <strong>{{ film.genre }}</strong>
        </div>
        <div class="hero__stat">
          <p>Âge</p>
          <strong>{{ ageRatingText(film.ageRating) }}</strong>
        </div>
      </div>
    </section>

    <section v-else class="panel">
      <header class="panel__header">
        <h2>Film introuvable</h2>
        <p>La fiche demandée n’existe plus ou n’a pas encore été publiée.</p>
      </header>
      <button class="primary" type="button" @click="goBackToCatalogue">Retour au catalogue</button>
    </section>

    <ReservationsPanel
      v-if="film"
      :selected-film-id="film.id"
      @close="goBackToCatalogue"
    />
  </div>
</template>
