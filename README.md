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

## Pages / fonctionnalités

- **Accueil (/**)** : hero marketing, présentation des services Les Jeunot et section “À l’affiche”
  consultable même si les autres services sont coupés.
- **Réserver (/reserve)** : réservation en ligne avec contrôle des places restantes et tarification
  dynamique selon le profil connecté.
- **Connexion (/login)** : création de compte, connexion, suivi du profil actif.
- **Back-office (/backoffice)** : état des services, gestion du catalogue films et des séances.
- **Bonus techniques** : bascule d’état pour simuler une panne, tarifs spéciaux (Etudiant, -16 ans,
  Chômeur…), architecture prête pour brancher une auth JWT/OAuth réelle.
