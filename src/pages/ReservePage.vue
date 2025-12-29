<script setup>
import { RouterLink } from 'vue-router'
import ReservationsPanel from '../components/ReservationsPanel.vue'
</script>

<template>
  <div class="page page--reserve">
    <section class="panel intro-panel">
      <header>
        <p class="eyebrow eyebrow--dark">Réservation en ligne</p>
        <h2>Choisissez votre séance Les Jeunot</h2>
      </header>
      <p>
        Réservez vos billets à l’avance et recevez une confirmation instantanée. Si vous n’avez pas
        encore de compte, rendez-vous sur la page
        <RouterLink to="/login">connexion</RouterLink> pour créer votre profil avant de finaliser
        votre commande.
      </p>
    </section>

    <ReservationsPanel />
  </div>
</template>
