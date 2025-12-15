<script setup>
import { reactive, ref, computed } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore'

const store = useCinemaStore()

const blankFilm = () => ({
  name: '',
  genre: '',
  duration: '',
  year: '',
  director: '',
  synopsis: '',
  ageRating: '',
})

const filmForm = reactive(blankFilm())
const editingId = ref('')
const feedback = ref('')

const sortedFilms = computed(() =>
  [...store.state.films].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
)

const clearForm = () => {
  Object.assign(filmForm, blankFilm())
  editingId.value = ''
}

const submitFilm = async () => {
  if (!filmForm.name || !filmForm.genre) {
    feedback.value = 'Merci de renseigner au moins le nom et le genre.'
    return
  }

  const payload = {
    ...filmForm,
    duration: Number(filmForm.duration) || 0,
    year: Number(filmForm.year) || new Date().getFullYear(),
    ageRating: Number(filmForm.ageRating) || 0,
  }

  try {
    if (editingId.value) {
      await store.editFilm(editingId.value, payload)
      feedback.value = 'Film mis à jour.'
    } else {
      await store.addFilm(payload)
      feedback.value = 'Film ajouté.'
    }
    clearForm()
  } catch (error) {
    feedback.value = error.message
  }
}

const handleEdit = (film) => {
  editingId.value = film.id
  Object.assign(filmForm, film)
}

const handleDelete = async (film) => {
  if (!confirm(`Supprimer ${film.name} et les séances associées ?`)) return
  try {
    await store.removeFilm(film.id)
  } catch (error) {
    feedback.value = error.message
  }
}

const sessionsPerFilm = store.sessionsByFilm
</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <h2>Programmation Les Jeunot</h2>
      <p>Ajoute, modifie ou supprime un film de l’affiche en quelques clics.</p>
      <p v-if="store.state.serviceDown.films" class="error">
        Service films hors-ligne : les modifications sont momentanément bloquées.
      </p>
      <p v-if="store.state.errors.films" class="error">{{ store.state.errors.films }}</p>
    </header>

    <div class="layout-2">
      <form class="form" @submit.prevent="submitFilm">
        <h3>{{ editingId ? 'Modifier' : 'Ajouter' }} un film</h3>
        <label>
          Nom
          <input v-model="filmForm.name" placeholder="Ex : Dune" required />
        </label>
        <label>
          Genre
          <input v-model="filmForm.genre" placeholder="Science-fiction" required />
        </label>
        <label>
          Durée (min)
          <input v-model="filmForm.duration" type="number" min="1" />
        </label>
        <label>
          Année
          <input v-model="filmForm.year" type="number" min="1900" max="2100" />
        </label>
        <label>
          Réalisateur
          <input v-model="filmForm.director" placeholder="Nom du réalisateur" />
        </label>
        <label>
          Synopsis
          <textarea v-model="filmForm.synopsis" rows="3" placeholder="Résumé rapide" />
        </label>
        <label>
          Restriction d’âge
          <input v-model="filmForm.ageRating" type="number" min="0" max="18" step="2" />
        </label>
        <div class="form__actions">
          <button type="submit" class="primary">
            {{ editingId ? 'Mettre à jour' : 'Ajouter' }}
          </button>
          <button type="button" class="ghost" @click="clearForm">Réinitialiser</button>
        </div>
        <p v-if="feedback" class="hint">{{ feedback }}</p>
      </form>

      <div>
        <h3>Films actuellement à l’affiche</h3>
        <p v-if="!sortedFilms.length" class="hint">Aucun film n’est enregistré.</p>

        <div class="card-list">
          <article v-for="film in sortedFilms" :key="film.id" class="card">
            <header class="card__header">
              <div>
                <h4>{{ film.name }}</h4>
                <p class="muted">{{ film.genre }} · {{ film.duration }} min · {{ film.year }}</p>
              </div>
              <div class="card__actions">
                <button type="button" class="ghost" @click="handleEdit(film)">Modifier</button>
                <button type="button" class="danger" @click="handleDelete(film)">Supprimer</button>
              </div>
            </header>
            <p class="muted">Réalisateur : {{ film.director || 'Inconnu' }}</p>
            <p>{{ film.synopsis || 'Pas de synopsis fourni.' }}</p>
            <p class="badge">Âge conseillé : {{ film.ageRating }}+</p>

            <div v-if="sessionsPerFilm[film.id]?.length" class="sessions-chip">
              <p class="muted">Séances reliées :</p>
              <ul>
                <li v-for="session in sessionsPerFilm[film.id]" :key="session.id">
                  Salle {{ session.roomNumber }} ·
                  {{ new Date(session.schedule).toLocaleString('fr-FR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }) }}
                  · {{ session.seatsTotal - session.seatsTaken }} places restantes
                </li>
              </ul>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
