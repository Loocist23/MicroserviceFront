<script setup>
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useCinemaStore } from './stores/cinemaStore.js'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

const store = useCinemaStore()
const isAuthenticated = computed(() => Boolean(store.state.currentUser))
const isAdmin = computed(() => store.state.currentUser?.role === 'admin')
const brand = 'Les Jeunot · Cinéma'
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
    <AppHeader
      :brand="brand"
      :is-authenticated="isAuthenticated"
      :is-admin="isAdmin"
      :services="services"
    />

    <RouterView />

    <AppFooter :brand="brand" />
  </div>
</template>
