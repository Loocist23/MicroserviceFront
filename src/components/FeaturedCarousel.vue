<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCinemaStore } from '../stores/cinemaStore.js'
import { formatAgeRatingDisplay, formatDurationDisplay } from '../utils/filmFormatting.js'

const store = useCinemaStore()
const router = useRouter()

const featuredFilms = computed(() => {
  if (!store.state.films.length) return []
  return [...store.state.films].slice(0, 5)
})

const activeIndex = ref(0)

watch(
  featuredFilms,
  (films) => {
    if (!films.length) {
      activeIndex.value = 0
      return
    }
    if (activeIndex.value > films.length - 1) {
      activeIndex.value = films.length - 1
    }
  },
  { immediate: true },
)

const activeFilm = computed(() => featuredFilms.value[activeIndex.value] ?? null)
const activeFilmData = computed(() => activeFilm.value ?? {})
const hasPoster = computed(() => Boolean(activeFilmData.value?.posterUrl))

const goTo = (direction) => {
  const total = featuredFilms.value.length
  if (!total) return
  activeIndex.value = (activeIndex.value + direction + total) % total
}

const selectFilm = (index) => {
  if (index === activeIndex.value) return
  const total = featuredFilms.value.length
  if (index < 0 || index > total - 1) return
  activeIndex.value = index
}

const openFilm = () => {
  if (!activeFilm.value) return
  router.push({ name: 'catalogue-film', params: { filmId: activeFilm.value.id } })
}

const coverStyle = computed(() => {
  if (!activeFilm.value?.posterUrl) {
    return {
      background:
        'linear-gradient(130deg, rgba(15,23,42,0.9), rgba(30,58,138,0.8)), radial-gradient(circle at top, rgba(255,255,255,0.12), transparent)',
    }
  }
  return {
    backgroundImage: `linear-gradient(120deg, rgba(5, 7, 29, 0.85), rgba(15, 23, 42, 0.65)), url(${activeFilm.value.posterUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

const ageRatingText = (value) => formatAgeRatingDisplay(value)
const durationText = (value) => formatDurationDisplay(value)
</script>

<template>
  <section v-if="featuredFilms.length" class="panel featured-carousel">
    <header>
      <p class="eyebrow eyebrow--dark">Films à la une</p>
      <h2>Fais défiler le carrousel et réserve ta séance</h2>
    </header>

    <div class="carousel">
      <div class="carousel__visual" :style="coverStyle" @click="openFilm">
        <div class="carousel__content">
          <p class="carousel__genre">
            {{ activeFilmData.genre }} · {{ durationText(activeFilmData.duration) }}
          </p>
          <h3>{{ activeFilmData.name }}</h3>
          <p class="carousel__tagline">{{ activeFilmData.tagline }}</p>
          <button class="primary" type="button" @click.stop="openFilm">
            Réserver {{ activeFilmData.name || 'ce film' }}
          </button>
        </div>
        <div v-if="hasPoster" class="carousel__artwork">
          <img :src="activeFilmData.posterUrl" :alt="`Affiche ${activeFilmData.name}`" loading="lazy" />
        </div>
        <div class="carousel__controls">
          <button class="chip" type="button" aria-label="Film précédent" @click.stop="goTo(-1)">
            ←
          </button>
          <button class="chip" type="button" aria-label="Film suivant" @click.stop="goTo(1)">
            →
          </button>
        </div>
      </div>
      <div class="carousel__thumbs">
        <button
          v-for="(film, index) in featuredFilms"
          :key="film.id"
          class="carousel__thumb"
          :class="{ 'carousel__thumb--active': index === activeIndex }"
          type="button"
          @click="selectFilm(index)"
        >
          <span>{{ film.name }}</span>
          <small>{{ film.year }} · {{ ageRatingText(film.ageRating) }}</small>
        </button>
      </div>
    </div>
  </section>
</template>
