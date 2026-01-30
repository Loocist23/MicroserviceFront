# Les Jeunot — Billetterie cinéma

Front Vue 3 + Vite connecté à trois microservices (films, séances, comptes). Le site propose un
catalogue en temps réel, un parcours de réservation et un back-office admin complet.

## Fonctionnalités clés

- Catalogue public des films **avec séances à venir** (`/catalogue`).
- Réservation sur une séance future, avec **simulation de paiement** et contrôle des places
  restantes.
- Redirection automatique vers `/login` si la réservation nécessite une session, puis retour à la
  page d’origine.
- Profil client avec historique des réservations, rôle, tarif et données personnelles.
- Pages RGPD (politique + droits) et mentions légales.
- Back-office admin (dashboard, programmation films + séances, réservations, clients, état services).

## Routes

- `/` : accueil + stats de programmation.
- `/catalogue` : liste des films disponibles.
- `/catalogue/:filmId` : réservation pour un film sélectionné (si la page dédiée est présente).
- `/login` : inscription + connexion.
- `/profil` : profil client (protégé).
- `/rgpd/confidentialite` : politique de confidentialité.
- `/rgpd/droits` : droits RGPD + formulaire DPO.
- `/legal/mentions` : mentions légales.
- `/backoffice/*` : back-office admin (protégé).
  - `/backoffice/dashboard`
  - `/backoffice/catalogue`
  - `/backoffice/sessions`
  - `/backoffice/reservations`
  - `/backoffice/clients`
  - `/backoffice/services`

## Back-office (admin)

- Dashboard : KPIs + courbes sur 7 jours (canvas).
- Programmation : CRUD films + planning des séances sur le même écran.
- Séances : création/édition/suppression, capacité, type de salle, prix optionnel.
- Réservations : vue globale + revenus estimés.
- Clients : liste des comptes et rôles.
- Microservices : bascule UP/DOWN pour simuler une panne côté UI.

## Microservices & API attendues

- Films (Node/Express + MySQL) : `/api/films`
- Séances & salles (Node/Express + MySQL) :
  - `/api/show` (séances)
  - `/api/room` (salles)
- Comptes & réservations (Flask + PostgreSQL) :
  - `/v1/user/*` (auth, profil, refresh)
  - `/v1/ticket/*` (réservations)

Les URLs de base sont configurables via variables d’environnement :

```bash
VITE_API_FILMS=http://localhost:5000
VITE_API_SEANCES=http://localhost:5001
VITE_API_COMPTES=http://localhost:5002
```

## Auth & session

- Login par email + mot de passe.
- Stockage local des tokens access/refresh.
- Tentative de refresh automatique en cas de 401.
- Préférence de tarif mémorisée par email.

## Données & mode hors-ligne

- Films et séances : fallback automatique sur `src/services/mocks/*.json` si l’API est hors-ligne.
- Comptes : fallback local pour la **liste des users** et la **liste des réservations** en mode
  admin (les actions d’auth / création nécessitent l’API).
- Cache local des films pour conserver le catalogue en mode dégradé.

## Enrichissement (affiches + durée)

Les films peuvent être enrichis automatiquement :
- Affiches via la suggestion IMDb (cache local).
- Durée via OMDb (cache local), si une clé est fournie :

```bash
VITE_OMDB_API_KEY=your_key
```

## Démarrage

```bash
npm install
npm run dev    # http://localhost:5173

npm run build
npm run preview
```
