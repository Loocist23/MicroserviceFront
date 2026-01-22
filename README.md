# Les Jeunot — billets cinéma (Architecture microservices)

Application Vue 3 + Vite qui dialogue avec trois microservices (films, séances, comptes) et couvre tout le périmètre demandé dans l’exercice noté. Cette page résume **ce que le site permet** et **quelles options bonus sont déjà actives**.

## Fonctionnalités principales

- Catalogue public des films à l’affiche, affichable même si les services comptes/séances sont down.
- Fiche film détaillée avec séances futures, choix du film verrouillé pendant la réservation.
- Inscription / connexion utilisateur (formulaire classique, stockage JWT access+refresh).
- Gestion des profils utilisateur (coordonnées, rôle) avec redirection après connexion.
- Réservation de places sur une séance avec contrôle du stock (`seatsRemaining`), calcul du total et animation de paiement.
- Historique personnel des réservations trié du plus récent au plus ancien.
- Redirection automatique vers `/login` lorsqu’un visiteur non connecté tente de réserver, puis retour à la page d’origine après identification.

## Espace back-office

- Dashboard administrateur avec filtres temporels (3j, semaine, mois, trimestre, an), graphiques interactifs et tooltips au survol.
- Gestion complète des films : Ajouter / Modifier / Supprimer (Nom, Genre, Durée, Année, Réalisateur, Synopsis, Age).
- Gestion complète des séances fusionnée au même écran : création guidée juste après l’ajout d’un film, édition et suppression en un clic.
- Vue par film des séances classées par jour, avec capacité restante et salle.
- Aperçu global des réservations (table triée, cumul des places et du CA estimé).
- Consultation de tous les comptes (login, nom, email, rôle, tarif) dès qu’on est admin.
- Panel d’état des microservices en lecture seule (Films, Séances, Comptes) indiquant UP/DOWN.

## Microservices & technos

- Films : Node.js / Express, base MySQL, CRUD catalogue et métadonnées (affiches OMDb facultatives).
- Séances & salles : Node.js / Express, base MySQL, gestion des salles, tarifs et disponibilités.
- Comptes & réservations : Python / Flask, base PostgreSQL, authentification JWT (login + refresh), création de tickets.
- Scripts SQL fournis dans `for-bdd/` pour initialiser chaque base séparément.

## Workflows utilisateurs

- Ajouter / Modifier / Supprimer un film (Nom, Genre, Durée, Année, Réalisateur, Synopsis, Age).
- Ajouter / Modifier / Supprimer une séance (Film, Salle, Horaire, Capacité, Type, Prix).
- S’inscrire avec prénom, nom, email, mot de passe, âge.
- Se connecter, conserver la session (access + refresh token).
- Réserver une séance avec vérification du quota et génération d’un ticket côté microservice comptes.
- Consulter ses réservations dans le profil, consulter les films même si Comptes ou Séances sont indisponibles.

## Démarrage rapide

```bash
npm install
npm run dev    # http://localhost:5173

npm run build
npm run preview
```

## Bonus

### Bonus réalisés
- Permettre de consulter la liste des films même si les services Comptes/Séances sont hors ligne.
- Mettre en place une authentification JWT complète (login, refresh, access token).

### Bonus faciles à ajouter
- Gérer les tarifs en fonction des types d’utilisateur (étudiant, -16 ans, chômeur, …).
