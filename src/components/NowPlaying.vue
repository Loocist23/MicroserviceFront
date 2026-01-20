<script setup>
import { computed } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore.js'
import { normalizeId } from '../utils/id.js'
import { formatAgeRatingDisplay, formatDurationDisplay } from '../utils/filmFormatting.js'

const store = useCinemaStore()
const upcomingSessionsByFilm = store.upcomingSessionsByFilm

const films = computed(() =>
  [...store.state.films]
    .filter((film) => (upcomingSessionsByFilm.value[normalizeId(film.id)] ?? []).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
)

const sessionsForFilm = (filmId) =>
  [...(upcomingSessionsByFilm.value[normalizeId(filmId)] ?? [])].sort(
    (a, b) => new Date(a.schedule) - new Date(b.schedule),
  )

const formatSchedule = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

const availability = (session) => store.remainingSeats(session)

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
          <p class="poster__synopsis">{{ film.synopsis }}</p>
        </div>

        <div class="poster__sessions">
          <template v-if="sessionsForFilm(film.id).length">
            <p class="eyebrow eyebrow--light">Séances</p>
            <ul>
              <li v-for="session in sessionsForFilm(film.id)" :key="session.id">
                {{ formatSchedule(session.schedule) }} · Salle {{ session.roomNumber }} ·
                {{ availability(session) }} places
              </li>
            </ul>
          </template>
          <p v-else class="muted">Aucune séance planifiée pour le moment.</p>
        </div>
      </article>
    </div>
  </section>
</template>
