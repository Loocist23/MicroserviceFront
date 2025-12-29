<script setup lang="ts">
import { RouterLink } from 'vue-router'

type ServiceStatus = {
  key: string
  label: string
  down: boolean
}

defineProps<{
  brand: string
  isAuthenticated: boolean
  isAdmin: boolean
  services: ServiceStatus[]
}>()
</script>

<template>
  <header class="site-header">
    <div class="site-header__top">
      <p class="brand">{{ brand }}</p>
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
</template>
