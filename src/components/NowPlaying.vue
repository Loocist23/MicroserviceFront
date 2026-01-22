<script setup>
import { computed } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore.js'
import { normalizeId } from '../utils/id.js'
import { formatAgeRatingDisplay, formatDurationDisplay } from '../utils/filmFormatting.js'

const store = useCinemaStore()
const upcomingSessionsByFilm = store.upcomingSessionsByFilm

const films = computed(() => {
  const sorted = [...store.state.films].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  if (store.state.serviceDown.sessions) {
    return sorted
  }
  return sorted.filter((film) => (upcomingSessionsByFilm.value[normalizeId(film.id)] ?? []).length > 0)
})

const todayBounds = computed(() => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return {
    start: start.getTime(),
    end: end.getTime(),
  }
})

const todaysSessionCount = (filmId) => {
  const sessions = upcomingSessionsByFilm.value[normalizeId(filmId)] ?? []
  return sessions.filter((session) => {
    const scheduledAt = new Date(session.schedule).getTime()
    return Number.isFinite(scheduledAt) && scheduledAt >= todayBounds.value.start && scheduledAt < todayBounds.value.end
  }).length
}

const posterStyle = (film) => {
  if (!film?.posterUrl) return {}
  return {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.55)), url(${film.posterUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}

const ageRatingText = (value) => formatAgeRatingDisplay(value)
const durationText = (value) => formatDurationDisplay(value)
</script>

<template>
  <section id="now-playing" class="now-playing panel">
    <header>
      <p class="eyebrow eyebrow--dark">Programmation</p>
      <h2>Films à l’affiche</h2>
      <p class="muted">
        Catalogue mis à jour en continu. Les fiches films restent accessibles même hors connexion.
      </p>
    </header>

    <div class="now-playing__grid">
      <article
        v-for="film in films"
        :key="film.id"
        class="poster"
        :class="`poster--${film.posterTheme || 'cosmos'}`"
        :style="posterStyle(film)"
      >
        <div>
          <h3>{{ film.name }}</h3>
          <p class="poster__tagline">{{ film.tagline }}</p>
          <p class="poster__meta">
            {{ film.genre }} · {{ durationText(film.duration) }} · {{ film.year }} ·
            Âge {{ ageRatingText(film.ageRating) }}
          </p>
        </div>

        <div class="poster__sessions">
          <p class="eyebrow eyebrow--light">Séances prévues aujourd’hui</p>
          <p v-if="todaysSessionCount(film.id)" class="poster__sessions-count">
            {{ todaysSessionCount(film.id) }} séance(s)
          </p>
          <p v-else class="muted">Aucune séance prévue aujourd’hui.</p>
        </div>
      </article>
    </div>
  </section>
</template>
