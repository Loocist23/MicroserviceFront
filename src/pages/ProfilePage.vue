<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCinemaStore } from '../stores/cinemaStore.js'
import {
  formatTariffLabel,
  discountForTariff,
  DEFAULT_TARIFF,
  DEFAULT_BASE_PRICE,
} from '../utils/pricing.js'

const store = useCinemaStore()
const router = useRouter()

const user = computed(() => store.state.currentUser)
const userTariffLabel = computed(() =>
  user.value ? formatTariffLabel(user.value.pricing ?? user.value.tariff) : '',
)
const savingsForReservation = (reservation) => {
  if (!reservation) return 0
  const appliedTariff =
    reservation.tariff ??
    user.value?.pricing ??
    user.value?.tariff ??
    DEFAULT_TARIFF
  const session = store.state.sessions.find((sessionEntry) => sessionEntry.id === reservation.sessionId)
  const sessionPrice = session ? Number(session.price) : NaN
  const basePrice = Number.isFinite(sessionPrice) && sessionPrice > 0
    ? sessionPrice
    : reservation.basePrice || DEFAULT_BASE_PRICE
  const { total } = discountForTariff(basePrice, appliedTariff, reservation.seats)
  return total
}
const history = store.reservationHistory

const logout = () => {
  store.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="page page--profile">
    <section class="panel intro-panel">
      <header>
        <p class="eyebrow eyebrow--dark">Compte client</p>
        <h2>Profil et préférences</h2>
      </header>
      <p v-if="user">Bienvenue {{ user.firstName }}. Voici vos informations personnelles et votre historique.</p>
      <p v-else class="hint">
        Aucun utilisateur connecté. <RouterLink to="/login">Se connecter</RouterLink>
      </p>
    </section>

    <section class="panel layout-2">
      <div>
        <h3>Informations personnelles</h3>
        <ul class="profile-list">
          <li><strong>Nom complet</strong><span>{{ user?.firstName }} {{ user?.lastName }}</span></li>
          <li><strong>Email</strong><span>{{ user?.email }}</span></li>
          <li><strong>Rôle</strong><span>{{ user?.role }}</span></li>
          <li><strong>Tarif appliqué</strong><span>{{ userTariffLabel }}</span></li>
          <li><strong>Âge</strong><span>{{ user?.age }} ans</span></li>
        </ul>
        <button type="button" class="ghost" @click="logout">Se déconnecter</button>
      </div>
      <div>
        <h3>Protection des données</h3>
        <p class="muted">
          Tu peux demander un export ou une suppression via la page
          <RouterLink to="/rgpd/droits">Vos droits RGPD</RouterLink>.
        </p>
        <p class="muted">
          Consulte également notre <RouterLink to="/rgpd/confidentialite">politique de confidentialité</RouterLink>.
        </p>
      </div>
    </section>

    <section class="panel">
      <h3>Historique de réservations</h3>
      <p v-if="!history.length" class="hint">Pas encore de réservation.</p>
      <ul v-else class="profile-history">
        <li v-for="reservation in history" :key="reservation.id">
          <strong>
            {{
              store.state.films.find(
                (film) => film.id === store.state.sessions.find((s) => s.id === reservation.sessionId)?.filmId,
              )?.name ?? 'Film'
            }}
          </strong>
          <span>
            {{ reservation.seats }} place(s) · {{ reservation.totalPrice }} € ·
            {{
              new Date(reservation.createdAt).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            }}
            <span v-if="savingsForReservation(reservation)" class="muted">
              · {{ savingsForReservation(reservation) }} € économisés vs plein tarif
            </span>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>
