<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCinemaStore } from '../stores/cinemaStore.js'

const store = useCinemaStore()
const router = useRouter()
const route = useRoute()

const registerForm = reactive({
  login: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  age: 18,
  pricing: 'standard',
  role: 'client',
})

const loginForm = reactive({
  login: '',
  password: '',
})

const registerFeedback = ref('')
const loginFeedback = ref('')

const pricingOptions = computed(() =>
  Object.entries(store.PRICING_RULES).map(([value, price]) => ({
    value,
    label: `${value === 'standard' ? 'Plein tarif' : value} (${price}€)`,
  })),
)

const redirectToProfile = () => {
  const redirect = route.query.redirect
  if (typeof redirect === 'string') {
    router.push(redirect)
    return
  }
  router.push({ name: 'profile' })
}

const submitRegister = async () => {
  if (!registerForm.login || !registerForm.password) {
    registerFeedback.value = 'Login et mot de passe sont requis.'
    return
  }

  try {
    await store.registerUser({
      ...registerForm,
      age: Number(registerForm.age) || 18,
    })
    registerFeedback.value = 'Compte créé et redirection vers votre profil...'
    redirectToProfile()
  } catch (error) {
    registerFeedback.value = error.message
  }
}

const submitLogin = async () => {
  if (!loginForm.login || !loginForm.password) {
    loginFeedback.value = 'Tous les champs sont requis.'
    return
  }

  try {
    await store.login({ ...loginForm })
    loginFeedback.value = 'Connexion réussie. Redirection en cours...'
    redirectToProfile()
  } catch (error) {
    loginFeedback.value = error.message
  }
}

</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <h2>Espace client Les Jeunot</h2>
      <p>Crée ton profil, choisis ton tarif et suis toutes tes réservations en un clin d’œil.</p>
      <p v-if="store.state.serviceDown.accounts" class="error">
        Service comptes indisponible : inscriptions et connexions bloquées.
      </p>
      <p v-if="store.state.errors.accounts" class="error">{{ store.state.errors.accounts }}</p>
    </header>

    <div class="layout-2">
      <form class="form" @submit.prevent="submitRegister">
        <h3>Inscription</h3>
        <label>
          Login
          <input v-model="registerForm.login" required />
        </label>
        <label>
          Mot de passe
          <input v-model="registerForm.password" type="password" required />
        </label>
        <label>
          Prénom
          <input v-model="registerForm.firstName" required />
        </label>
        <label>
          Nom
          <input v-model="registerForm.lastName" required />
        </label>
        <label>
          Email
          <input v-model="registerForm.email" type="email" required />
        </label>
        <label>
          Âge
          <input v-model="registerForm.age" type="number" min="12" />
        </label>
        <label>
          Type de tarif
          <select v-model="registerForm.pricing">
            <option v-for="option in pricingOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <label>
          Rôle
          <select v-model="registerForm.role">
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" class="primary">Créer le compte</button>
        <p v-if="registerFeedback" class="hint">{{ registerFeedback }}</p>
      </form>

      <form class="form" @submit.prevent="submitLogin">
        <h3>Connexion</h3>
        <label>
          Login
          <input v-model="loginForm.login" required />
        </label>
        <label>
          Mot de passe
          <input v-model="loginForm.password" type="password" required />
        </label>
        <div class="form__actions">
          <button type="submit" class="primary">Se connecter</button>
        </div>
        <p v-if="loginFeedback" class="hint">{{ loginFeedback }}</p>
      </form>
    </div>
  </section>
</template>
