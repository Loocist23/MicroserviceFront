<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore.js'

const store = useCinemaStore()

const blankSession = () => ({
  filmId: '',
  roomNumber: '',
  schedule: '',
  seatsTotal: '',
  roomType: 'Standard',
})

const sessionForm = reactive(blankSession())
const editingId = ref('')
const feedback = ref('')

const sortedSessions = computed(() =>
  [...store.state.sessions].sort((a, b) => new Date(a.schedule) - new Date(b.schedule)),
)

watch(
  () => store.state.films,
  (films) => {
    if (!sessionForm.filmId && films.length) {
      sessionForm.filmId = films[0].id
    }
  },
  { immediate: true, deep: true },
)

const resetForm = () => {
  Object.assign(sessionForm, blankSession())
  if (store.state.films.length) {
    sessionForm.filmId = store.state.films[0].id
  }
  editingId.value = ''
}

const submitSession = async () => {
  if (!sessionForm.filmId) {
    feedback.value = 'Choisis un film.'
    return
  }

  const payload = {
    ...sessionForm,
    roomNumber: Number(sessionForm.roomNumber) || 1,
    seatsTotal: Number(sessionForm.seatsTotal) || 0,
  }

  try {
    if (editingId.value) {
      await store.editSession(editingId.value, payload)
      feedback.value = 'Séance modifiée.'
    } else {
      await store.addSession(payload)
      feedback.value = 'Séance ajoutée.'
    }
    resetForm()
  } catch (error) {
    feedback.value = error.message
  }
}

const startEdit = (session) => {
  editingId.value = session.id
  Object.assign(sessionForm, session)
}

const removeSession = async (session) => {
  if (!confirm('Supprimer cette séance ?')) return
  try {
    await store.removeSession(session.id)
  } catch (error) {
    feedback.value = error.message
  }
}

const filmName = (filmId) => store.state.films.find((film) => film.id === filmId)?.name ?? 'Film supprimé'
</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <h2>Séances et salles</h2>
      <p>Planifie les projections en choisissant salle, horaire et capacité.</p>
      <p v-if="store.state.serviceDown.sessions" class="error">
        Service séances indisponible : les opérations sont bloquées.
      </p>
      <p v-if="store.state.errors.sessions" class="error">{{ store.state.errors.sessions }}</p>
    </header>

    <div class="layout-2">
      <form class="form" @submit.prevent="submitSession">
        <h3>{{ editingId ? 'Modifier' : 'Ajouter' }} une séance</h3>
        <label>
          Film
          <select v-model="sessionForm.filmId" required>
            <option disabled value="">Sélectionne un film</option>
            <option v-for="film in store.state.films" :key="film.id" :value="film.id">
              {{ film.name }}
            </option>
          </select>
        </label>
        <label>
          N° de salle
          <input v-model="sessionForm.roomNumber" type="number" min="1" required />
        </label>
        <label>
          Capacité
          <input v-model="sessionForm.seatsTotal" type="number" min="1" required />
        </label>
        <label>
          Type de salle
          <input v-model="sessionForm.roomType" placeholder="IMAX, Dolby Atmos…" />
        </label>
        <label>
          Horaire
          <input v-model="sessionForm.schedule" type="datetime-local" required />
        </label>
        <div class="form__actions">
          <button type="submit" class="primary">
            {{ editingId ? 'Mettre à jour' : 'Ajouter' }}
          </button>
          <button type="button" class="ghost" @click="resetForm">Réinitialiser</button>
        </div>
        <p v-if="feedback" class="hint">{{ feedback }}</p>
      </form>

      <div>
        <h3>Séances programmées</h3>
        <p v-if="!sortedSessions.length" class="hint">Pas encore de séance.</p>
        <div class="card-list">
          <article v-for="session in sortedSessions" :key="session.id" class="card">
            <header class="card__header">
              <div>
                <h4>{{ filmName(session.filmId) }}</h4>
                <p class="muted">
                  Salle {{ session.roomNumber }} ·
                  {{ new Date(session.schedule).toLocaleString('fr-FR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }) }}
                </p>
              </div>
              <div class="card__actions">
                <button type="button" class="ghost" @click="startEdit(session)">Modifier</button>
                <button type="button" class="danger" @click="removeSession(session)">Supprimer</button>
              </div>
            </header>
            <p>Type de salle : {{ session.roomType }}</p>
            <p>
              {{ session.seatsTotal - session.seatsTaken }} / {{ session.seatsTotal }} places restantes
            </p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
