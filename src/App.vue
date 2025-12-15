<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useCinemaStore } from './stores/cinemaStore'

const store = useCinemaStore()
const isAuthenticated = computed(() => Boolean(store.state.currentUser))
const isAdmin = computed(() => store.state.currentUser?.role === 'admin')
const services = computed(() => [
  { key: 'films', label: 'Films', down: store.state.serviceDown.films },
  { key: 'sessions', label: 'Séances', down: store.state.serviceDown.sessions },
  { key: 'accounts', label: 'Comptes', down: store.state.serviceDown.accounts },
])

onMounted(() => {
  store.bootstrap()
})
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="site-header__top">
        <p class="brand">Les Jeunot · Cinéma</p>
        <nav>
          <RouterLink class="nav-link" to="/">Accueil</RouterLink>
          <RouterLink class="nav-link" to="/reserve">Réserver</RouterLink>
          <RouterLink v-if="!isAuthenticated" class="nav-link" to="/login">Se connecter</RouterLink>
          <RouterLink v-else class="nav-link" to="/profil">Profil</RouterLink>
          <RouterLink v-if="isAdmin" class="nav-link" to="/backoffice/dashboard">Back-office</RouterLink>
        </nav>
      </div>
      <div v-if="isAdmin" class="service-indicators">
        <span
          v-for="service in services"
          :key="service.key"
          class="service-indicator"
          :class="{ 'service-indicator--down': service.down }"
        >
          {{ service.label }} · {{ service.down ? 'DOWN' : 'UP' }}
        </span>
      </div>
    </header>

    <RouterView />

    <footer class="site-footer">
      <div>
        <p class="brand">Les Jeunot · Cinéma</p>
        <p class="muted">
          Billetterie certifiée RGPD. Retrouvez toutes les informations liées à la protection de vos
          données.
        </p>
      </div>
      <nav class="footer-nav">
        <RouterLink to="/rgpd/confidentialite">Politique de confidentialité</RouterLink>
        <RouterLink to="/rgpd/droits">Vos droits RGPD</RouterLink>
        <RouterLink to="/legal/mentions">Mentions légales & DPO</RouterLink>
      </nav>
    </footer>
  </div>
</template>
