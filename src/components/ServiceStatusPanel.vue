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

const statusLabel = (serviceKey) => (store.state.serviceDown[serviceKey] ? 'DOWN' : 'UP')
const statusClass = (serviceKey) =>
  store.state.serviceDown[serviceKey] ? 'service-status service-status--down' : 'service-status service-status--up'
</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <h2>Etat des services Les Jeunot</h2>
      <p>Lecture seule : statut transmis par les microservices.</p>
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
        <span :class="statusClass(service.key)">{{ statusLabel(service.key) }}</span>
      </article>
    </div>
    <p class="hint">Les statuts passent à DOWN lorsqu’un microservice ne répond plus.</p>
  </section>
</template>
