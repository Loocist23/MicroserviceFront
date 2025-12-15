<script setup>
import { computed } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore'

const store = useCinemaStore()

const reservations = computed(() =>
  [...store.state.reservations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
)

const filmName = (sessionId) => {
  const session = store.state.sessions.find((item) => item.id === sessionId)
  if (!session) return 'Séance inconnue'
  const film = store.state.films.find((item) => item.id === session.filmId)
  return film?.name ?? 'Film inconnu'
}

const sessionLabel = (sessionId) => {
  const session = store.state.sessions.find((item) => item.id === sessionId)
  if (!session) return '---'
  return new Date(session.schedule).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const totals = computed(() =>
  reservations.value.reduce(
    (acc, item) => {
      acc.seats += item.seats
      acc.revenue += item.totalPrice
      return acc
    },
    { seats: 0, revenue: 0 },
  ),
)
</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <h2>Réservations globales</h2>
      <p>Vue consolidée réservée aux administrateurs.</p>
      <p class="hint">
        Conformément au RGPD, seules les personnes habilitées accèdent ici aux données clients.
      </p>
    </header>

    <div class="stat-summary">
      <article>
        <p>Places vendues</p>
        <strong>{{ totals.seats }}</strong>
      </article>
      <article>
        <p>Revenus (estim.)</p>
        <strong>{{ totals.revenue }} €</strong>
      </article>
    </div>

    <div class="table-wrapper">
      <table class="table table--compact reservation-table">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Film / séance</th>
            <th>Places</th>
            <th>Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reservation in reservations" :key="reservation.id">
            <td>{{ store.state.users.find((user) => user.id === reservation.userId)?.login }}</td>
            <td>{{ filmName(reservation.sessionId) }}</td>
            <td>{{ reservation.seats }}</td>
            <td>{{ reservation.totalPrice }} €</td>
            <td>{{ sessionLabel(reservation.sessionId) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!reservations.length" class="muted">Aucune réservation enregistrée.</p>
    </div>
  </section>
</template>
