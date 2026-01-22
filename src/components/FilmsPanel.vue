<script setup>
import { reactive, ref, computed } from 'vue'
import { useCinemaStore } from '../stores/cinemaStore.js'
import { formatAgeRatingDisplay, formatDurationDisplay } from '../utils/filmFormatting.js'
import { normalizeId } from '../utils/id.js'

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

const blankSessionForm = () => ({
  schedule: '',
  roomNumber: '',
  seatsTotal: '',
  roomType: 'Standard',
  price: '',
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
      roomNumber: session.roomNumber ?? '',
      seatsTotal: session.seatsTotal ?? '',
      roomType: session.roomType ?? 'Standard',
      price: session.price ?? '',
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
  if (!filmForm.name || !filmForm.genre) {
    filmFeedback.value = 'Merci de renseigner au moins le nom et le genre.'
    return
  }

  const payload = {
    ...filmForm,
    duration: Number(filmForm.duration) || 0,
    year: Number(filmForm.year) || new Date().getFullYear(),
    ageRating: Number(filmForm.ageRating) || 0,
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
  Object.assign(filmForm, film)
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

  const payload = {
    filmId: sessionFilmId.value,
    schedule: sessionForm.schedule,
    roomNumber: Number(sessionForm.roomNumber) || 1,
    seatsTotal: Number(sessionForm.seatsTotal) || 0,
    roomType: sessionForm.roomType || 'Standard',
    price: sessionForm.price ? Number(sessionForm.price) : undefined,
  }

  try {
    if (editingSessionId.value) {
      await store.editSession(editingSessionId.value, payload)
      sessionFeedback.value = 'Séance mise à jour.'
    } else {
      await store.addSession(payload)
      sessionFeedback.value = 'Séance ajoutée.'
    }
    Object.assign(sessionForm, { ...sessionForm, schedule: '' })
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
                  {{ film.genre }} · {{ durationText(film.duration) }} · {{ film.year }}
                </p>
                <p class="muted">Réalisateur : {{ film.director || 'Inconnu' }}</p>
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
            <p class="badge">Âge conseillé : {{ ageRatingText(film.ageRating) }}</p>

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
                  <input v-model="sessionForm.roomNumber" type="number" min="1" required />
                </label>
              </div>
              <div class="inline-session-form__row">
                <label>
                  Capacité
                  <input v-model="sessionForm.seatsTotal" type="number" min="1" required />
                </label>
                <label>
                  Type de salle
                  <input v-model="sessionForm.roomType" placeholder="IMAX, Dolby Atmos…" />
                </label>
              </div>
              <label>
                Tarif (optionnel)
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
