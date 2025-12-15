<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useCinemaStore } from '../stores/cinemaStore'

const store = useCinemaStore()
const route = useRoute()

const menuLinks = [
  { label: 'Dashboard', to: '/backoffice/dashboard' },
  { label: 'Programmation', to: '/backoffice/catalogue' },
  { label: 'Séances', to: '/backoffice/sessions' },
  { label: 'Réservations', to: '/backoffice/reservations' },
  { label: 'Clients', to: '/backoffice/clients' },
  { label: 'Microservices', to: '/backoffice/services' },
]

const adminName = computed(() => {
  const current = store.state.currentUser
  if (!current) return 'Compte'
  return `${current.firstName} ${current.lastName}`
})

const adminRole = computed(() => store.state.currentUser?.role ?? '---')
const services = computed(() => [
  { key: 'films', label: 'Films', down: store.state.serviceDown.films },
  { key: 'sessions', label: 'Séances', down: store.state.serviceDown.sessions },
  { key: 'accounts', label: 'Comptes', down: store.state.serviceDown.accounts },
])

const isActive = (target) => route.path.startsWith(target)
</script>

<template>
  <div class="page page--backoffice">
    <section class="panel intro-panel">
      <header>
        <p class="eyebrow eyebrow--dark">Espace exploitation</p>
        <h2>Back-office Les Jeunot</h2>
      </header>
      <p class="muted">
        Contrôle interne complet : supervision des services critiques, programmation et pilotage des
        performances commerciales.
      </p>
      <div class="admin-summary">
        <p>Connecté en tant que {{ adminName }} ({{ adminRole }})</p>
        <div class="status-pills">
          <span
            v-for="service in services"
            :key="service.key"
            class="status-pill"
            :class="{ 'status-pill--down': service.down }"
          >
            {{ service.label }} · {{ service.down ? 'DOWN' : 'UP' }}
          </span>
        </div>
      </div>
    </section>

    <nav class="backoffice-nav">
      <RouterLink
        v-for="link in menuLinks"
        :key="link.to"
        class="backoffice-nav__link"
        :class="{ 'backoffice-nav__link--active': isActive(link.to) }"
        :to="link.to"
      >
        {{ link.label }}
      </RouterLink>
    </nav>

    <div class="backoffice-content">
      <RouterView />
    </div>
  </div>
</template>
