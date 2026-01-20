<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCinemaStore } from '../stores/cinemaStore.js'
import { formatAgeRatingDisplay, formatDurationDisplay } from '../utils/filmFormatting.js'
import { normalizeId } from '../utils/id.js'

const router = useRouter()
const store = useCinemaStore()

const upcomingSessionsByFilm = store.upcomingSessionsByFilm

const catalogFilms = computed(() =>
  [...store.filmsWithUpcomingSessions.value].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
)

const sessionCount = (filmId) => (upcomingSessionsByFilm.value[normalizeId(filmId)] ?? []).length

const goToFilm = (filmId) => {
  router.push({ name: 'catalogue-film', params: { filmId: normalizeId(filmId) } })
}

const ageRatingText = (value) => formatAgeRatingDisplay(value)
const durationText = (value) => formatDurationDisplay(value)
</script>

<template>
  <div class="page page--catalogue">
    <section class="hero hero--catalog">
      <div class="hero__content">
        <p class="eyebrow">Catalogue en temps réel</p>
        <h1>Réserve directement depuis le catalogue</h1>
        <p>
          Explore tous les films disponibles, découvre les formats projetés et choisis ta séance au
          clic. Une fois ton film sélectionné, les séances correspondantes s’ouvrent automatiquement.
        </p>
        <p class="muted">
          Besoin d’aide ? Connecte-toi pour retrouver tes tarifs préférés ou contacte l’équipe en
          caisse.
        </p>
      </div>
    </section>

    <section class="panel catalog-panel">
      <header class="panel__header">
        <p class="eyebrow eyebrow--dark">Films disponibles</p>
        <h2>Sélectionne ton film et laisse la magie opérer</h2>
        <p class="muted">
          Seuls les films disposant encore de séances à venir sont affichés. Le reste du catalogue
          reviendra dès qu’une salle sera programmée.
        </p>
      </header>
      <p v-if="!catalogFilms.length" class="hint">Aucun film n’a de séance programmée pour le moment.</p>
      <div class="catalog-grid">
        <article
          v-for="film in catalogFilms"
          :key="film.id"
          class="film-card"
          @click="goToFilm(film.id)"
        >
          <div class="film-card__poster" :style="{ backgroundImage: film.posterUrl ? `url(${film.posterUrl})` : '' }" />
          <div class="film-card__body">
            <div>
              <h3>{{ film.name }}</h3>
              <p class="muted">
                {{ film.genre }} · {{ durationText(film.duration) }} · {{ film.year }}
              </p>
              <p>{{ film.synopsis }}</p>
            </div>
            <div class="film-card__meta">
              <span>Âge {{ ageRatingText(film.ageRating) }}</span>
              <span>{{ sessionCount(film.id) }} séance(s)</span>
            </div>
            <button class="primary film-card__cta" type="button">Voir les séances</button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
