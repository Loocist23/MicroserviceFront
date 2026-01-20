<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import FeaturedCarousel from '../components/FeaturedCarousel.vue'
import NowPlaying from '../components/NowPlaying.vue'
import { useCinemaStore } from '../stores/cinemaStore.js'

const store = useCinemaStore()

const stats = computed(() => {
  const filmsCount = store.filmsWithUpcomingSessions.value.length
  const sessionsCount = store.upcomingSessions.value.length
  const availableSeats = store.availableUpcomingSeats.value
  return [
    { label: 'Films à l’affiche', value: filmsCount || '—' },
    { label: 'Séances programmées', value: sessionsCount || '—' },
    { label: 'Places libres', value: availableSeats || '—' },
  ]
})

const perks = [
  {
    title: 'Programmation audacieuse',
    description: 'Classiques restaurés, créations locales et blockbusters en VO chaque semaine.',
  },
  {
    title: 'Expérience premium',
    description: 'Projection laser, confort Dolby Atmos, snacks artisanaux et équipe passionnée.',
  },
  {
    title: 'Réservation fluide',
    description: 'Tarifs adaptés, paiement sécurisé et historique disponible sur ton profil.',
  },
]
</script>

<template>
  <div class="page page--home">
    <section class="hero hero--cinema">
      <div class="hero__content">
        <p class="eyebrow">Cinéma indépendant · Marseille</p>
        <h1>Les Jeunot</h1>
        <p>
          Une salle pensée pour vibrer devant les sorties cultes comme les pépites intimistes.
          Réserve ta place, choisis ton fauteuil et laisse-nous t’accueillir comme un habitué.
        </p>
        <div class="hero__cta">
          <RouterLink class="primary" to="/catalogue">Catalogue & réservations</RouterLink>
          <RouterLink class="ghost" to="/login">Accéder à mon profil</RouterLink>
        </div>
      </div>
      <div class="hero__stats">
        <div v-for="item in stats" :key="item.label" class="hero__stat">
          <p>{{ item.label }}</p>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </section>

    <FeaturedCarousel />

    <section class="panel highlight-grid">
      <header>
        <p class="eyebrow eyebrow--dark">L’expérience Les Jeunot</p>
        <h2>On ne programme pas uniquement des films, on fabrique des souvenirs.</h2>
      </header>
      <div class="highlight-grid__items">
        <article v-for="perk in perks" :key="perk.title" class="highlight-card">
          <h3>{{ perk.title }}</h3>
          <p>{{ perk.description }}</p>
        </article>
      </div>
    </section>

    <NowPlaying />
  </div>
</template>
