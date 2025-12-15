import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import ReservePage from '../pages/ReservePage.vue'
import BackofficePage from '../pages/BackofficePage.vue'
import BackofficeDashboard from '../pages/BackofficeDashboard.vue'
import BackofficeFilms from '../pages/BackofficeFilms.vue'
import BackofficeSessions from '../pages/BackofficeSessions.vue'
import BackofficeServices from '../pages/BackofficeServices.vue'
import BackofficeReservations from '../pages/BackofficeReservations.vue'
import BackofficeUsers from '../pages/BackofficeUsers.vue'
import LoginPage from '../pages/LoginPage.vue'
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage.vue'
import DataRightsPage from '../pages/DataRightsPage.vue'
import LegalNoticePage from '../pages/LegalNoticePage.vue'
import ProfilePage from '../pages/ProfilePage.vue'
import { useCinemaStore } from '../stores/cinemaStore'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/reserve', name: 'reserve', component: ReservePage },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/rgpd/confidentialite', name: 'privacy', component: PrivacyPolicyPage },
  { path: '/rgpd/droits', name: 'data-rights', component: DataRightsPage },
  { path: '/legal/mentions', name: 'legal-notice', component: LegalNoticePage },
  { path: '/profil', name: 'profile', component: ProfilePage, meta: { requiresAuth: true } },
  {
    path: '/backoffice',
    component: BackofficePage,
    meta: { requiresAdmin: true },
    children: [
      { path: '', redirect: '/backoffice/dashboard' },
      { path: 'dashboard', name: 'backoffice-dashboard', component: BackofficeDashboard },
      { path: 'catalogue', name: 'backoffice-catalogue', component: BackofficeFilms },
      { path: 'sessions', name: 'backoffice-sessions', component: BackofficeSessions },
      { path: 'services', name: 'backoffice-services', component: BackofficeServices },
      { path: 'reservations', name: 'backoffice-reservations', component: BackofficeReservations },
      { path: 'clients', name: 'backoffice-users', component: BackofficeUsers },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const store = useCinemaStore()

  if (to.meta.requiresAdmin && store.state.currentUser?.role !== 'admin') {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresAuth && !store.state.currentUser) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (!store.state.films.length && !store.loading.films) {
    store.bootstrap()
  }

  next()
})

export default router
