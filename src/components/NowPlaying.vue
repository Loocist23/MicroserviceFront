<script setup>
import { computed } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore'

const store = useCinemaStore()

const films = computed(() =>
  [...store.state.films].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
)

const sessionsForFilm = (filmId) =>
  store.state.sessions
    .filter((session) => session.filmId === filmId)
    .sort((a, b) => new Date(a.schedule) - new Date(b.schedule))

const formatSchedule = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

const availability = (session) => session.seatsTotal - session.seatsTaken
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
      <article v-for="film in films" :key="film.id" class="poster" :class="`poster--${film.posterTheme}`">
        <div>
          <h3>{{ film.name }}</h3>
          <p class="poster__tagline">{{ film.tagline }}</p>
          <p class="poster__meta">
            {{ film.genre }} · {{ film.duration }} min · {{ film.year }} · Âge {{ film.ageRating }}+
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
