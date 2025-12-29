<script setup>
import { computed } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore.js'

const store = useCinemaStore()

const services = computed(() => [
  {
    key: 'films',
    label: 'Catalogue films',
    description: 'Gestion de la programmation et des fiches',
  },
  {
    key: 'sessions',
    label: 'Séances & salles',
    description: 'Contrôle des horaires et des capacités',
  },
  {
    key: 'accounts',
    label: 'Comptes & réservations',
    description: 'Utilisateurs, rôles et paiements',
  },
])

const toggleService = (service) => {
  const current = store.state.serviceDown[service]
  store.setServiceStatus(service, !current)
}
</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <h2>Etat des services Les Jeunot</h2>
      <p>Active ou coupe un service pour simuler une panne côté billetterie.</p>
    </header>
    <div class="services-grid">
      <article
        v-for="service in services"
        :key="service.key"
        class="service-card"
        :class="{ 'service-card--down': store.state.serviceDown[service.key] }"
      >
        <div>
          <h3>{{ service.label }}</h3>
          <p>{{ service.description }}</p>
        </div>
        <button type="button" class="chip" @click="toggleService(service.key)">
          {{ store.state.serviceDown[service.key] ? 'DOWN' : 'UP' }}
        </button>
      </article>
    </div>
    <p class="hint">La liste des films reste disponible même si les autres services sont coupés.</p>
  </section>
</template>
