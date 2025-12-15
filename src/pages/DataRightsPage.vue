<script setup>
const rights = [
  {
    title: 'Accès et portabilité',
    description:
      'Recevez un export complet (JSON ou PDF) de vos réservations et informations de compte sous 30 jours.',
  },
  {
    title: 'Rectification',
    description: 'Mettez à jour vos informations (email, tarif appliqué, préférences) à tout moment.',
  },
  {
    title: 'Effacement',
    description:
      'Demandez la suppression totale de votre compte. Vos réservations sont anonymisées pour raisons comptables.',
  },
  {
    title: 'Limitation & opposition',
    description:
      'Suspendez tout traitement marketing ou limitation du suivi d’audience. Nous n’exécutons aucune publicité ciblée.',
  },
]
</script>

<template>
  <div class="page page--legal">
    <section class="panel intro-panel">
      <header>
        <p class="eyebrow eyebrow--dark">Protection des données</p>
        <h2>Exercer vos droits RGPD</h2>
      </header>
      <p>
        Utilisez le formulaire ci-dessous pour contacter notre Délégué à la Protection des Données et
        exercer vos droits. Chaque demande est horodatée et traitée sous 30 jours maximum.
      </p>
    </section>

    <section class="panel layout-2">
      <div>
        <h3>Droits garantis</h3>
        <ul class="rgpd-rights">
          <li v-for="item in rights" :key="item.title">
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
          </li>
        </ul>
      </div>
      <form class="form" @submit.prevent>
        <h3>Formulaire de contact DPO</h3>
        <label>
          Nom / Prénom
          <input type="text" placeholder="Votre nom complet" required />
        </label>
        <label>
          Email utilisé pour les réservations
          <input type="email" placeholder="prenom@exemple.fr" required />
        </label>
        <label>
          Type de demande
          <select required>
            <option>Accès / export</option>
            <option>Rectification</option>
            <option>Suppression</option>
            <option>Opposition</option>
          </select>
        </label>
        <label>
          Message
          <textarea rows="4" placeholder="Précisez votre demande" required></textarea>
        </label>
        <button type="submit" class="primary">Envoyer la demande</button>
        <p class="hint">
          Un accusé de réception automatique est envoyé et votre demande est journalisée côté
          back-office.
        </p>
      </form>
    </section>
  </div>
</template>
