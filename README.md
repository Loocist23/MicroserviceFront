# Les Jeunot — Billetterie cinéma

Site officiel du cinéma “Les Jeunot”, réalisé en Vue 3 + Vite + Vue Router. Le front-end consomme
(via mocks) trois microservices indépendants et couvre toutes les fonctionnalités attendues :
films, séances, comptes, réservation avec vérification du nombre de places.

## Techno & microservices

| Domaine             | Pile choisie                    | Base simulée | Rôle principal                                         |
| ------------------- | ------------------------------- | ------------ | ------------------------------------------------------ |
| Films               | NodeJS · Express                | MySQL        | CRUD des films, genres et restrictions d’âge           |
| Comptes / réserv.   | Python · Flask                  | PostgreSQL   | Comptes, rôles, tarifs, réservations et authentif.     |
| Séances / salles    | NodeJS · Express                | MySQL        | Gestion des salles, horaires, disponibilités de place  |

Le front embarque des mocks pour chacun de ces services (`src/services/*`) afin de pouvoir
travailler hors-ligne. Le panneau “Etat des microservices” permet de simuler une panne par service.
Même si Comptes ou Séances sont coupés, la liste des films reste accessible (bonus demandé).

## Démarrer

```bash
npm install
npm run dev
# puis ouvrir http://localhost:5173
```

Pour un build de production :

```bash
npm run build
npm run preview
```

## Métadonnées IMDb / OMDb

Le front tente d’enrichir automatiquement chaque film avec l’affiche et la durée récupérées depuis les
APIs publiques d’IMDb (via OMDb). Pour activer la durée automatique, génère une clé sur
[omdbapi.com](https://www.omdbapi.com/apikey.aspx) puis crée un fichier `.env` à la racine :

```
VITE_OMDB_API_KEY=ta_cle_personnelle
```

Sans clé, les durées renseignées manuellement dans le back-office sont conservées telles quelles.

## Pages / fonctionnalités

- **Accueil (/**)** : hero marketing, présentation des services Les Jeunot et section “À l’affiche”
  consultable même si les autres services sont coupés.
- **Catalogue (/catalogue)** : sélectionne un film qui dispose de séances à venir puis réserve en
  ligne via la page `/catalogue/:filmId` avec contrôle des places restantes et tarification dynamique.
- **Connexion (/login)** : création de compte, connexion, suivi du profil actif.
- **Back-office (/backoffice)** : état des services, gestion du catalogue films et des séances.
- **Bonus techniques** : bascule d’état pour simuler une panne, tarifs spéciaux (Etudiant, -16 ans,
  Chômeur…), architecture prête pour brancher une auth JWT/OAuth réelle.

## Conformité avec le cahier des charges “Architecture microservices”

| Exigence | Implémentation |
| --- | --- |
| 3 microservices minimum | • Films + séances : Node/Express (API `/api/films`, `/api/show`, `/api/room`)<br>• Comptes & réservations : Python/Flask (API `/v1/user`, `/v1/ticket`)<br>Chaque service possède ses schémas SQL dédiés (`for-bdd/*.sql`). |
| Technologies différentes | NodeJS pour films/séances, Python (Flask) pour comptes. |
| Bases indépendantes | Scripts SQL distincts pour chaque microservice ; aucune base partagée. |
| CRUD Films | Backoffice `/backoffice/catalogue` branché sur `/api/films` (ajout, édition, suppression). |
| CRUD Séances | Backoffice `/backoffice/sessions` branché sur `/api/show` (room, horaire, nb de places, prix). |
| Comptes utilisateurs | Formulaire inscription/connexion (`/login`) relié aux routes `/v1/user/*` avec stockage JWT (access + refresh). |
| Réservation avec quota | `ReservationsPanel` vérifie `seatsTaken` vs `seatsTotal`, appelle `/api/show/:id/reserve` puis crée un ticket via `/v1/ticket/`. |
| Hébergement local navigateur | Front Vue 3 (Vite) → `npm run dev` ; chaque service tourne en local (Docker ou node/python). |
| Bonus “catalogue accessible si autres services down” | Store `serviceDown` + mocks pour films/seances/comptes ; listing films reste disponible même si comptes/séances sont coupés. |
| Bonus “tarifs selon profil” | `PRICING_RULES` (standard, étudiant, -16, chômeur, …) + champ `price` par séance ; total calculé dynamiquement selon la séance et/ou le profil. |
| Bonus “authentification OAuth/JWT” | Service comptes expose une authentification JWT complète (login, refresh, access token). |

> Pour la soutenance : lancer chaque microservice (films, séances, comptes) avec les scripts fournis, puis `npm run dev` pour le front. Les API exposées correspondent au périmètre demandé et peuvent être vérifiées via les docs résumées ci-dessus.
