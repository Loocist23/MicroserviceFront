<script setup>
import { reactive, ref, computed } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore.js'
import { formatAgeRatingDisplay, formatDurationDisplay } from '../utils/filmFormatting.js'
import { normalizeId } from '../utils/id.js'

const store = useCinemaStore()

// Récupérer les genres, age ratings et salles au chargement
const fetchGenresAndRatingsAndRooms = async () => {
  try {
    await store.fetchGenres()
    await store.fetchAgeRatings()
    await store.fetchRooms()
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  }
}

// Appeler la fonction au chargement du composant
fetchGenresAndRatingsAndRooms()

const blankFilm = () => ({
  name: '',
  genreIds: [],
  duration: '',
  year: '',
  author: '',
  synopsis: '',
  ageRatingId: null,
})

const blankSessionForm = () => ({
  schedule: '',
  roomId: '',
})

const formatDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().slice(0, 16)
}

const dayIdentifier = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toISOString().slice(0, 10)
}

const dayLabel = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Jour inconnu'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' })
}

const sessionTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const filmForm = reactive(blankFilm())
const editingFilmId = ref('')
const filmFeedback = ref('')

const sessionForm = reactive(blankSessionForm())
const sessionFilmId = ref('')
const editingSessionId = ref('')
const sessionFeedback = ref('')

const sortedFilms = computed(() =>
  [...store.state.films].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
)

const clearFilmForm = () => {
  Object.assign(filmForm, blankFilm())
  editingFilmId.value = ''
}

const startSessionPlanner = (filmId, session = null) => {
  sessionFilmId.value = normalizeId(filmId)
  sessionFeedback.value = ''
  if (session) {
    editingSessionId.value = session.id
    Object.assign(sessionForm, {
      schedule: formatDateInput(session.schedule),
      roomId: session.roomId ?? '',
    })
  } else {
    editingSessionId.value = ''
    Object.assign(sessionForm, blankSessionForm())
  }
}

const cancelSessionPlanner = () => {
  sessionFilmId.value = ''
  editingSessionId.value = ''
  sessionFeedback.value = ''
  Object.assign(sessionForm, blankSessionForm())
}

const submitFilm = async () => {
  if (!filmForm.name || filmForm.genreIds.length === 0) {
    filmFeedback.value = 'Merci de renseigner au moins le nom et un genre.'
    return
  }

  const payload = {
    ...filmForm,
    duration: Number(filmForm.duration) || 0,
    year: Number(filmForm.year) || new Date().getFullYear(),
    ageRatingId: filmForm.ageRatingId !== null && filmForm.ageRatingId !== '' ? Number(filmForm.ageRatingId) : 0,
  }

  try {
    if (editingFilmId.value) {
      await store.editFilm(editingFilmId.value, payload)
      filmFeedback.value = 'Film mis à jour.'
    } else {
      const created = await store.addFilm(payload)
      filmFeedback.value = 'Film ajouté. Programme maintenant sa première séance.'
      startSessionPlanner(created?.id ?? '')
    }
    clearFilmForm()
  } catch (error) {
    filmFeedback.value = error.message
  }
}

const handleEdit = (film) => {
  editingFilmId.value = film.id
  // Adapter les données du film pour le formulaire
  Object.assign(filmForm, {
    name: film.name,
    genreIds: film.genres ? film.genres.map(g => g.id) : [],
    duration: film.duration,
    year: film.year,
    author: film.author || film.director || '',
    synopsis: film.synopsis,
    ageRatingId: film.ageRatingId || (film.ageRating ? film.ageRating.id : null),
  })
}

const handleDelete = async (film) => {
  if (!confirm(`Supprimer ${film.name} et les séances associées ?`)) return
  try {
    await store.removeFilm(film.id)
  } catch (error) {
    filmFeedback.value = error.message
  }
}

const sessionsPerFilm = store.sessionsByFilm

const sessionsGroupedByFilm = computed(() => {
  const result = {}
  const entries = sessionsPerFilm.value ?? {}
  Object.entries(entries).forEach(([filmKey, sessions]) => {
    const days = sessions.reduce((acc, session) => {
      const dayKey = dayIdentifier(session.schedule)
      acc[dayKey] = acc[dayKey] ?? {
        key: dayKey,
        label: dayLabel(session.schedule),
        sessions: [],
      }
      acc[dayKey].sessions.push(session)
      return acc
    }, {})
    result[filmKey] = Object.values(days)
      .map((day) => ({
        ...day,
        sessions: day.sessions.sort((a, b) => new Date(a.schedule) - new Date(b.schedule)),
      }))
      .sort((a, b) => new Date(a.key) - new Date(b.key))
  })
  return result
})

const submitSession = async () => {
  if (!sessionFilmId.value) {
    sessionFeedback.value = 'Choisis un film avant de planifier.'
    return
  }
  if (!sessionForm.schedule) {
    sessionFeedback.value = 'Renseigne la date et l’heure de la séance.'
    return
  }
  if (!sessionForm.roomId) {
    sessionFeedback.value = 'Sélectionne une salle.'
    return
  }

  // Utiliser un tarif par défaut (par exemple 10€)
  const defaultPrice = 10
  
  const payload = {
    filmId: sessionFilmId.value,
    schedule: sessionForm.schedule,
    roomId: sessionForm.roomId,
    price: defaultPrice,
  }

  try {
    if (editingSessionId.value) {
      await store.editSession(editingSessionId.value, payload)
      sessionFeedback.value = 'Séance mise à jour.'
    } else {
      await store.addSession(payload)
      sessionFeedback.value = 'Séance ajoutée.'
    }
    Object.assign(sessionForm, { ...sessionForm, schedule: '', roomId: '' })
    editingSessionId.value = ''
  } catch (error) {
    sessionFeedback.value = error.message
  }
}

const removeSession = async (session) => {
  if (!confirm('Supprimer cette séance ?')) return
  try {
    await store.removeSession(session.id)
  } catch (error) {
    sessionFeedback.value = error.message
  }
}

const ageRatingText = (value) => formatAgeRatingDisplay(value)
const durationText = (value) => formatDurationDisplay(value, { fallback: '—' })
const seatsAvailable = (session) => store.remainingSeats(session)
const filmSessions = (filmId) => sessionsGroupedByFilm.value[normalizeId(filmId)] ?? []

</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <h2>Programmation & séances</h2>
      <p>Ajoute un film puis enchaîne sur les séances sans changer d’écran.</p>
      <p v-if="store.state.errors.films" class="error">{{ store.state.errors.films }}</p>
      <p v-if="store.state.errors.sessions" class="error">{{ store.state.errors.sessions }}</p>
    </header>

    <div class="programming-grid">
      <form class="form programming-form" @submit.prevent="submitFilm">
        <h3>{{ editingFilmId ? 'Modifier' : 'Ajouter' }} un film</h3>
        <label>
          Nom
          <input v-model="filmForm.name" placeholder="Ex : Dune" required />
        </label>
        <label>
          Genre(s)
          <div class="genre-checkboxes">
            <label v-for="genre in store.state.genres" :key="genre.id" class="checkbox-label">
              <input
                type="checkbox"
                :value="genre.id"
                v-model="filmForm.genreIds"
                class="checkbox-input"
              />
              {{ genre.label }}
            </label>
          </div>
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
          Auteur
          <input v-model="filmForm.author" placeholder="Nom de l'auteur" />
        </label>
        <label>
          Synopsis
          <textarea v-model="filmForm.synopsis" rows="3" placeholder="Résumé rapide" />
        </label>
        <label>
          Restriction d’âge
          <div class="age-rating-buttons">
            <label v-for="rating in store.state.ageRatings" :key="rating.id" class="radio-label">
              <input
                type="radio"
                :value="rating.id"
                v-model="filmForm.ageRatingId"
                class="radio-input"
              />
              {{ rating.value }}+
            </label>
          </div>
        </label>
        <div class="form__actions">
          <button type="submit" class="primary">
            {{ editingFilmId ? 'Mettre à jour' : 'Ajouter' }}
          </button>
          <button type="button" class="ghost" @click="clearFilmForm">Réinitialiser</button>
        </div>
        <p v-if="filmFeedback" class="hint">{{ filmFeedback }}</p>
      </form>

      <div class="programming-list">
        <h3>Films actuellement à l’affiche</h3>
        <p v-if="!sortedFilms.length" class="hint">Aucun film n’est enregistré.</p>

        <div class="programming-film-list">
          <article v-for="film in sortedFilms" :key="film.id" class="programming-film">
            <header class="programming-film__header">
              <div>
                <h4>{{ film.name }}</h4>
                <p class="muted">
                  {{ film.genres ? film.genres.map(g => g.label).join(', ') : '' }} · {{ durationText(film.duration) }} · {{ film.year }}
                </p>
                <p class="muted">Auteur : {{ film.author || 'Inconnu' }}</p>
              </div>
              <div class="programming-film__actions">
                <button type="button" class="ghost" @click="handleEdit(film)">Modifier</button>
                <button type="button" class="ghost" @click="startSessionPlanner(film.id)">
                  Planifier une séance
                </button>
                <button type="button" class="danger" @click="handleDelete(film)">Supprimer</button>
              </div>
            </header>
            <p>{{ film.synopsis || 'Pas de synopsis fourni.' }}</p>
            <p class="badge">Âge conseillé : {{ ageRatingText(film.ageRatingId || film.ageRating) }}</p>

            <div class="programming-film__sessions">
              <p class="muted">Séances reliées</p>
              <details
                v-for="day in filmSessions(film.id)"
                :key="day.key"
                class="session-day"
              >
                <summary>
                  {{ day.label }} · {{ day.sessions.length }} séance(s)
                </summary>
                <ul>
                  <li v-for="session in day.sessions" :key="session.id">
                    <div>
                      <strong>{{ sessionTime(session.schedule) }}</strong>
                      <span>
                        Salle {{ session.roomNumber }} · {{ seatsAvailable(session) }} /
                        {{ session.seatsTotal }} places · {{ session.roomType }}
                      </span>
                    </div>
                    <div class="session-actions">
                      <button
                        type="button"
                        class="ghost"
                        @click="startSessionPlanner(film.id, session)"
                      >
                        Modifier
                      </button>
                      <button type="button" class="danger" @click="removeSession(session)">
                        Supprimer
                      </button>
                    </div>
                  </li>
                </ul>
              </details>
              <p v-if="!filmSessions(film.id).length" class="muted">
                Aucune séance programmée.
              </p>
            </div>

            <form
              v-if="sessionFilmId === normalizeId(film.id)"
              class="inline-session-form"
              @submit.prevent="submitSession"
            >
              <h5>
                {{ editingSessionId ? 'Modifier la séance' : 'Ajouter une séance' }}
              </h5>
              <div class="inline-session-form__row">
                <label>
                  Date & heure
                  <input v-model="sessionForm.schedule" type="datetime-local" required />
                </label>
                <label>
                  Salle
                  <select v-model="sessionForm.roomId" required class="room-select">
                    <option value="">Sélectionnez une salle</option>
                    <option v-for="room in store.state.rooms" :key="room.id" :value="room.id">
                      Salle {{ room.room_number }} - {{ room.room_type }} ({{ room.seat_number }} places)
                    </option>
                  </select>
                </label>
              </div>

              <label>
                Tarif
                <input v-model="sessionForm.price" type="number" min="0" step="0.5" />
              </label>
              <div class="form__actions">
                <button type="submit" class="primary">
                  {{ editingSessionId ? 'Mettre à jour' : 'Ajouter la séance' }}
                </button>
                <button type="button" class="ghost" @click="cancelSessionPlanner">Annuler</button>
              </div>
              <p v-if="sessionFeedback" class="hint">{{ sessionFeedback }}</p>
            </form>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.genre-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.checkbox-label:hover {
  background: #e9e9e9;
}

.checkbox-input {
  cursor: pointer;
}

.age-rating-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.radio-label:hover {
  background: #e9e9e9;
}

.radio-input {
  cursor: pointer;
}

.radio-label input:checked + span {
  background: #4CAF50;
  color: white;
}

.room-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.room-select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}
</style>
