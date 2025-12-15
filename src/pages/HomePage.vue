<script setup>
import { RouterLink } from 'vue-router'
import NowPlaying from '../components/NowPlaying.vue'
</script>

<template>
  <div class="page page--home">
    <section class="hero">
      <div>
        <p class="eyebrow">Cinéma indépendant · Marseille</p>
        <h1>Les Jeunot</h1>
        <p>
          Salle iconique du Panier, Les Jeunot propose une programmation mêlant grands classiques,
          pépites d’auteur et blockbusters en VO. Réservez vos places en ligne et profitez de tarifs
          adaptés.
        </p>
        <div class="hero__cta">
          <RouterLink class="primary" to="/reserve">Réserver une séance</RouterLink>
          <RouterLink class="ghost" to="/login">Se connecter</RouterLink>
        </div>
      </div>
      <ul class="hero__tags">
        <li>VOSTFR</li>
        <li>Avant-premières</li>
        <li>Tarif étudiant</li>
        <li>Carte -16 ans</li>
        <li>Popcorn local</li>
      </ul>
    </section>

    <section class="panel services-overview">
      <header>
        <p class="eyebrow eyebrow--dark">Services Les Jeunot</p>
        <h2>Une billetterie simple, sûre et rapide</h2>
      </header>
      <div class="services-overview__grid">
        <article>
          <h3>Programmation</h3>
          <p>Catalogue mis à jour quotidiennement avec synopsis, durées et âges conseillés.</p>
        </article>
        <article>
          <h3>Comptes & avantages</h3>
          <p>Tarifs adaptés (étudiant, -16 ans, chômeur) et historique de vos réservations.</p>
        </article>
        <article>
          <h3>Salles & confort</h3>
          <p>Capacité en temps réel, sélection de la salle (IMAX, Dolby Atmos, standard).</p>
        </article>
      </div>
    </section>

    <NowPlaying />
  </div>
</template>
