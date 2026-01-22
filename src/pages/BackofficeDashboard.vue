<script setup>
import { computed, ref } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore.js'
import LineChart from '../components/LineChart.vue'

const store = useCinemaStore()

const RANGE_PRESETS = [
  { key: '3d', label: '3 jours', days: 3 },
  { key: '7d', label: '1 semaine', days: 7 },
  { key: '30d', label: '1 mois', days: 30 },
  { key: '90d', label: '1 trimestre', days: 90 },
  { key: '365d', label: '1 an', days: 365 },
]

const selectedRangeKey = ref('7d')
const selectedRange = computed(() => RANGE_PRESETS.find((entry) => entry.key === selectedRangeKey.value) ?? RANGE_PRESETS[1])
const selectedRangeLabel = computed(() => selectedRange.value.label)
const selectedRangeDays = computed(() => selectedRange.value.days)
const rangeStartTimestamp = computed(() => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (selectedRangeDays.value - 1))
  return start.getTime()
})
const reservationsInRange = computed(() => {
  const start = rangeStartTimestamp.value
  const now = Date.now()
  return store.state.reservations.filter((reservation) => {
    const ts = new Date(reservation.createdAt).getTime()
    return Number.isFinite(ts) && ts >= start && ts <= now
  })
})

const dateRange = (days) => {
  const result = []
  const today = new Date()
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const iso = date.toISOString().slice(0, 10)
    const label = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    result.push({ iso, label })
  }
  return result
}

const dailyAggregates = computed(() =>
  reservationsInRange.value.reduce((acc, reservation) => {
    const key = new Date(reservation.createdAt).toISOString().slice(0, 10)
    acc[key] = acc[key] ?? { seats: 0, totalPrice: 0 }
    acc[key].seats += reservation.seats
    acc[key].totalPrice += reservation.totalPrice
    return acc
  }, {}),
)

const buildSeries = (field) =>
  dateRange(selectedRangeDays.value).map(({ iso, label }) => ({
    label,
    value: dailyAggregates.value[iso]?.[field] ?? 0,
  }))

const dailyRevenueSeries = computed(() => buildSeries('totalPrice'))
const dailySeatsSeries = computed(() => buildSeries('seats'))

const metrics = computed(() => {
  const totalFilms = store.state.films.length
  const totalSessions = store.state.sessions.length
  const totalUsers = store.state.users.length
  const seatsSold = reservationsInRange.value.reduce((sum, reservation) => sum + reservation.seats, 0)
  const revenue = reservationsInRange.value.reduce((sum, reservation) => sum + reservation.totalPrice, 0)
  const seatTotals = store.state.sessions.reduce(
    (acc, session) => {
      const capacity = Math.max(0, Number(session.seatsTotal) || 0)
      const taken = Math.min(Math.max(Number(session.seatsTaken) || 0, 0), capacity)
      acc.taken += taken
      acc.capacity += capacity
      return acc
    },
    { taken: 0, capacity: 0 },
  )
  const occupancyRate =
    seatTotals.capacity === 0 ? 0 : Math.round((seatTotals.taken / seatTotals.capacity) * 100)

  return { totalFilms, totalSessions, totalUsers, seatsSold, revenue, occupancyRate }
})

const filmIndex = computed(() =>
  store.state.films.reduce((acc, film) => {
    acc[film.id] = film.name
    return acc
  }, {}),
)

const sessionIndex = computed(() =>
  store.state.sessions.reduce((acc, session) => {
    acc[session.id] = session
    return acc
  }, {}),
)

const upcomingSessions = computed(() => {
  const now = Date.now()
  return [...store.state.sessions]
    .filter((session) => {
      const schedule = new Date(session.schedule).getTime()
      return Number.isFinite(schedule) && schedule > now
    })
    .sort((a, b) => new Date(a.schedule) - new Date(b.schedule))
    .slice(0, 5)
    .map((session) => ({
      ...session,
      filmName: filmIndex.value[session.filmId] ?? 'Film inconnu',
      label: new Date(session.schedule).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    }))
})

const recentReservations = computed(() => {
  const userIndex = store.state.users.reduce((acc, user) => {
    acc[user.id] = user
    return acc
  }, {})

  return [...reservationsInRange.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((reservation) => {
      const session = sessionIndex.value[reservation.sessionId]
      const filmName = session ? filmIndex.value[session.filmId] : 'Film inconnu'
      const userName = userIndex[reservation.userId]?.login ?? 'Utilisateur inconnu'
      return {
        ...reservation,
        filmName,
        userName,
        formattedDate: new Date(reservation.createdAt).toLocaleString('fr-FR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
      }
    })
})
</script>

<template>
  <section class="panel dashboard-panel">
    <header class="panel__header dashboard-header">
      <div>
        <h2>Tableau de bord</h2>
        <p>Vue synthétique de l’activité billetterie.</p>
      </div>
      <div class="dashboard-range">
        <button
          v-for="preset in RANGE_PRESETS"
          :key="preset.key"
          type="button"
          class="dashboard-range__chip"
          :class="{ 'dashboard-range__chip--active': preset.key === selectedRangeKey }"
          @click="selectedRangeKey = preset.key"
        >
          {{ preset.label }}
        </button>
      </div>
    </header>

    <div class="stats-grid">
      <article class="stat-card">
        <p class="stat-card__label">Films programmés</p>
        <p class="stat-card__value">{{ metrics.totalFilms }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-card__label">Séances actives</p>
        <p class="stat-card__value">{{ metrics.totalSessions }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-card__label">Places vendues</p>
        <p class="stat-card__value">{{ metrics.seatsSold }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-card__label">CA estimé</p>
        <p class="stat-card__value">{{ metrics.revenue }} €</p>
      </article>
      <article class="stat-card">
        <p class="stat-card__label">Taux d’occupation</p>
        <p class="stat-card__value">{{ metrics.occupancyRate }}%</p>
      </article>
      <article class="stat-card">
        <p class="stat-card__label">Comptes actifs</p>
        <p class="stat-card__value">{{ metrics.totalUsers }}</p>
      </article>
    </div>

    <div class="charts-grid">
      <article class="chart-card">
        <header>
          <h3>Revenus · {{ selectedRangeLabel }}</h3>
          <p class="muted">Somme des ventes quotidiennes (en euros)</p>
        </header>
        <LineChart :series="dailyRevenueSeries" unit="€" />
        <ul class="chart-legend">
          <li v-for="point in dailyRevenueSeries" :key="point.label">
            <span>{{ point.label }}</span>
            <strong>{{ point.value }} €</strong>
          </li>
        </ul>
      </article>

      <article class="chart-card">
        <header>
          <h3>Places vendues · {{ selectedRangeLabel }}</h3>
          <p class="muted">Nombre de billets confirmés par jour</p>
        </header>
        <LineChart :series="dailySeatsSeries" />
        <ul class="chart-legend">
          <li v-for="point in dailySeatsSeries" :key="point.label">
            <span>{{ point.label }}</span>
            <strong>{{ point.value }}</strong>
          </li>
        </ul>
      </article>
    </div>

    <div class="dashboard-columns">
      <article class="dashboard-card">
        <h3>Sessions à venir</h3>
        <ul class="dashboard-list">
          <li v-for="session in upcomingSessions" :key="session.id">
            <strong>{{ session.filmName }}</strong>
            <span>{{ session.label }} · Salle {{ session.roomNumber }} · {{ store.remainingSeats(session) }} places libres</span>
          </li>
          <li v-if="!upcomingSessions.length" class="muted">Pas de séance programmée.</li>
        </ul>
      </article>

      <article class="dashboard-card">
        <h3>Réservations récentes</h3>
        <ul class="dashboard-list">
          <li v-for="reservation in recentReservations" :key="reservation.id">
            <strong>{{ reservation.userName }}</strong>
            <span>{{ reservation.filmName }} · {{ reservation.seats }} place(s) · {{ reservation.totalPrice }} € · {{ reservation.formattedDate }}</span>
          </li>
          <li v-if="!recentReservations.length" class="muted">Aucune réservation pour l’instant.</li>
        </ul>
      </article>
    </div>
  </section>
</template>
