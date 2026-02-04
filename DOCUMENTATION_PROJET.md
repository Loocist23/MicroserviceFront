# Documentation Complète du Projet - Les Jeunot · Cinéma

## Introduction

Ce document fournit une documentation complète du projet "Les Jeunot · Cinéma", un système de billetterie en ligne pour cinéma développé avec Vue 3 et Vite. Le projet est connecté à trois microservices backend et offre une expérience utilisateur complète pour la réservation de billets de cinéma.

## Historique du Projet

### Chronologie des commits

1. **Commit initial (b659ca6)**: Création initiale du projet
2. **FIRST COMMIT (b659ca6)**: Structure de base du projet
3. **feat: brancher le front sur les microservices et refondre le parcours billet (64c6f28)**: Intégration des microservices et refonte du parcours de réservation
4. **ajout du .env.exemple et modification du Dockerfile (1e96118)**: Configuration de l'environnement et amélioration du Dockerfile
5. **Modification des Card de films (15aa644)**: Amélioration de l'affichage des films dans le catalogue
6. **feat: améliorer la résa et le back-office (5ad431d)**: Améliorations majeures de la réservation et du back-office
7. **a (7d67b6b)**: Dernier commit avec des améliorations diverses

## Architecture Technique

### Technologies Utilisées

#### Frontend
- **Vue 3**: Framework JavaScript progressif pour la construction d'interfaces utilisateur
- **Vite**: Outil de build ultra-rapide pour les applications web modernes
- **Vue Router**: Gestion des routes pour une navigation SPA fluide
- **Pinia**: Gestion d'état centralisée (bien que le code utilise une approche réactive personnalisée)

#### Backend (Microservices)
Le projet se connecte à trois microservices distincts:

1. **Service Films** (Node/Express + MySQL):
   - URL: `/api/films`
   - Gère le catalogue des films
   - Technologie: Node.js avec Express et base de données MySQL

2. **Service Séances & Salles** (Node/Express + MySQL):
   - URLs: `/api/show` (séances), `/api/room` (salles)
   - Gère la programmation des séances et les informations sur les salles
   - Technologie: Node.js avec Express et base de données MySQL

3. **Service Comptes & Réservations** (Flask + PostgreSQL):
   - URLs: `/v1/user/*` (authentification, profil, rafraîchissement de token)
   - `/v1/ticket/*` (réservations)
   - Gère l'authentification, les profils utilisateurs et les réservations
   - Technologie: Python avec Flask et base de données PostgreSQL

#### Raisonnement Technologique

- **Vue 3**: Choisi pour sa réactivité, sa composition API et son écosystème mature
- **Vite**: Sélectionné pour ses performances de développement et de build supérieures
- **Microservices**: Architecture permettant une séparation claire des responsabilités et une évolutivité indépendante des composants
- **Fallback local**: Implémentation de mécanismes de secours pour une expérience utilisateur continue même en cas de panne des services backend

## Structure du Projet

```
public/
  └── vite.svg
src/
  ├── assets/
  │   └── vue.svg
  ├── components/
  │   ├── AccountsPanel.vue
  │   ├── AdminReservationsPanel.vue
  │   ├── AdminUsersPanel.vue
  │   ├── AppFooter.vue
  │   ├── AppHeader.vue
  │   ├── FilmsPanel.vue
  │   ├── LineChart.vue
  │   ├── NowPlaying.vue
  │   ├── ReservationsPanel.vue
  │   ├── ServiceStatusPanel.vue
  │   └── SessionsPanel.vue
  ├── pages/
  │   ├── BackofficeDashboard.vue
  │   ├── BackofficeFilms.vue
  │   ├── BackofficePage.vue
  │   ├── BackofficeReservations.vue
  │   ├── BackofficeServices.vue
  │   ├── BackofficeSessions.vue
  │   ├── BackofficeUsers.vue
  │   ├── DataRightsPage.vue
  │   ├── HomePage.vue
  │   ├── LegalNoticePage.vue
  │   ├── LoginPage.vue
  │   ├── PrivacyPolicyPage.vue
  │   ├── ProfilePage.vue
  │   └── ReservePage.vue
  ├── router/
  │   └── index.js
  ├── services/
  │   ├── mocks/
  │   │   ├── films.json
  │   │   ├── reservations.json
  │   │   ├── sessions.json
  │   │   └── users.json
  │   ├── accountsService.js
  │   ├── filmsService.js
  │   ├── http.js
  │   ├── network.js
  │   └── sessionsService.js
  ├── stores/
  │   └── cinemaStore.js
  ├── styles/
  │   ├── admin.css
  │   ├── base.css
  │   ├── components.css
  │   ├── footer.css
  │   └── showcase.css
  ├── App.vue
  ├── main.ts
  └── style.css
.env.exemple
.gitignore
Dockerfile
index.html
package-lock.json
package.json
README.md
vite.config.js
```

## Fonctionnalités Principales

### 1. Catalogue Public des Films
- Affichage des films avec leurs séances à venir
- Page dédiée par film avec possibilité de réservation
- Enrichissement automatique des affiches via IMDb
- Récupération de la durée via OMDb (avec clé API configurable)

### 2. Parcours de Réservation
- Sélection de séance et choix du nombre de places
- Simulation de paiement
- Contrôle des places restantes en temps réel
- Redirection automatique vers la page de connexion si nécessaire

### 3. Authentification et Profils
- Connexion par email/mot de passe
- Stockage sécurisé des tokens (access/refresh) dans le localStorage
- Mécanisme de rafraîchissement automatique des tokens
- Profil utilisateur avec historique des réservations
- Mémorisation des préférences tarifaires par email

### 4. Back-office Administrateur
- **Dashboard**: KPIs et courbes d'activité sur 7 jours
- **Programmation**: CRUD complet pour les films et les séances
- **Réservations**: Vue globale des réservations et revenus estimés
- **Clients**: Gestion des comptes utilisateurs et des rôles
- **Services**: Interface pour simuler des pannes de microservices

### 5. Gestion des Pannes
- Détection automatique des services indisponibles
- Basculer vers des données mockées en cas de panne
- Cache local des films pour une expérience dégradée acceptable
- Indicateurs visuels de l'état des services

## Mécanismes Techniques Clés

### 1. Gestion d'État Centralisée
Le projet utilise un store réactif personnalisé (`cinemaStore.js`) qui gère:
- L'état des films, séances, utilisateurs et réservations
- L'authentification et les tokens
- Les indicateurs de chargement et d'erreurs
- L'état des services (up/down)

### 2. Communication avec les Microservices
Le module `http.js` fournit un client HTTP configuré pour chaque microservice avec:
- Construction automatique des URLs
- Gestion des headers et des tokens d'authentification
- Parsing des réponses et gestion des erreurs HTTP

### 3. Fallback et Résilience
Chaque service (`filmsService.js`, `sessionsService.js`, `accountsService.js`) implémente:
- Détection des erreurs réseau
- Basculer vers des données mockées locales
- Cache local pour les films et les affiches
- Mécanismes de réessai et de récupération

### 4. Enrichissement des Données
Le service des films inclut des fonctionnalités d'enrichissement:
- Récupération automatique des affiches depuis IMDb
- Extraction de la durée depuis OMDb
- Correction des problèmes d'encodage des textes
- Cache local pour éviter les requêtes répétées

### 5. Authentification et Sécurité
- Stockage sécurisé des tokens dans le localStorage
- Mécanisme de rafraîchissement automatique des tokens expirés
- Protection des routes sensibles (admin et utilisateur authentifié)
- Déconnexion automatique en cas d'erreur 401

## Configuration et Environnement

### Variables d'Environnement

```bash
# URLs des microservices
VITE_API_FILMS=http://localhost:5000
VITE_API_SEANCES=http://localhost:5001
VITE_API_COMPTES=http://localhost:5002

# Clé API OMDb pour l'enrichissement des films
VITE_OMDB_API_KEY=your_key
```

### Commandes de Développement

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run dev    # http://localhost:5173

# Build pour production
npm run build

# Prévisualisation du build
npm run preview
```

## Bonnes Pratiques Implémentées

1. **Séparation des Responsabilités**: Chaque composant et service a une responsabilité claire
2. **Gestion des Erreurs**: Traitement complet des erreurs à tous les niveaux
3. **Résilience**: Mécanismes de fallback pour une expérience utilisateur continue
4. **Performance**: Cache local, enrichissement asynchrone, chargement optimisé
5. **Sécurité**: Gestion sécurisée des tokens, protection des routes
6. **Maintenabilité**: Code bien structuré, commentaires appropriés, noms de variables clairs
7. **Accessibilité**: Structure sémantique, navigation claire

## Défis Techniques Relevés

1. **Intégration des Microservices**: Coordination entre trois services backend distincts
2. **Gestion des États**: Synchronisation complexe entre les données locales et distantes
3. **Résilience**: Maintien d'une expérience utilisateur acceptable malgré les pannes
4. **Authentification**: Implémentation sécurisée avec rafraîchissement de tokens
5. **Enrichissement des Données**: Récupération et cache des données externes (IMDb, OMDb)

## Conclusion

Le projet "Les Jeunot · Cinéma" représente une implémentation complète et robuste d'un système de billetterie en ligne pour cinéma. Il démontre une architecture moderne basée sur des microservices, une gestion d'état sophistiquée, et des mécanismes de résilience avancés. Le code est bien structuré, documenté et suit les meilleures pratiques de développement frontend moderne.

Le système offre une expérience utilisateur fluide tout en gérant efficacement les complexités techniques inhérentes à la coordination de multiples services backend et à la gestion des états d'authentification et de réservation.

## Recommandations pour l'Avenir

1. **Tests Automatiques**: Ajouter des tests unitaires et d'intégration pour améliorer la stabilité
2. **Internationalisation**: Préparer le code pour une localisation multi-langues
3. **Accessibilité**: Audit complet et améliorations pour WCAG 2.1
4. **Performance**: Optimisation supplémentaire des requêtes et du cache
5. **Monitoring**: Intégration d'outils de monitoring pour le suivi des performances
6. **CI/CD**: Mise en place d'un pipeline de déploiement continu
7. **Documentation Utilisateur**: Création de guides utilisateur et d'aide en ligne