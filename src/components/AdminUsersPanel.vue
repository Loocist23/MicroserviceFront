<script setup>
import { computed } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore'

const store = useCinemaStore()

const stats = computed(() => {
  const total = store.state.users.length
  const admins = store.state.users.filter((user) => user.role === 'admin').length
  const clients = total - admins
  return { total, admins, clients }
})

const users = computed(() =>
  [...store.state.users].sort((a, b) => a.login.localeCompare(b.login, 'fr')),
)
</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <h2>Utilisateurs & rôles</h2>
      <p>Consultation réservée à l’équipe habilitée.</p>
    </header>

    <div class="stat-summary">
      <article>
        <p>Comptes actifs</p>
        <strong>{{ stats.total }}</strong>
      </article>
      <article>
        <p>Administrateurs</p>
        <strong>{{ stats.admins }}</strong>
      </article>
      <article>
        <p>Clients</p>
        <strong>{{ stats.clients }}</strong>
      </article>
    </div>

    <div class="table-wrapper">
      <table class="table table--compact">
        <thead>
          <tr>
            <th>Login</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Tarif</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.login }}</td>
            <td>{{ user.firstName }} {{ user.lastName }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>{{ user.pricing }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!users.length" class="muted">Pas de compte enregistré.</p>
    </div>
  </section>
</template>
