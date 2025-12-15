<script setup>
const sections = [
  {
    title: 'Finalités de traitement',
    content:
      "Les Jeunot collecte uniquement les données nécessaires à la réservation (identité, email, historique des transactions) afin d'émettre les billets, gérer les tarifs spécifiques et communiquer les informations relatives à la séance.",
  },
  {
    title: 'Durée de conservation',
    content:
      'Les comptes inactifs sont anonymisés après 24 mois sans connexion. Les traces de paiement sont conservées conformément aux obligations légales françaises (6 ans).',
  },
  {
    title: 'Partage et sous-traitants',
    content:
      'Aucun profil marketing n’est construit à partir de vos données. Les paiements sont traités par un prestataire certifié PCI-DSS situé dans l’Union Européenne.',
  },
  {
    title: 'Sécurité & chiffrement',
    content:
      'Toutes les communications sont chiffrées (HTTPS). Les accès administrateurs sont protégés par MFA et les exports sont journalisés.',
  },
]
</script>

<template>
  <div class="page page--legal">
    <section class="panel intro-panel">
      <header>
        <p class="eyebrow eyebrow--dark">RGPD</p>
        <h2>Politique de confidentialité</h2>
      </header>
      <p>
        Ce document détaille comment Les Jeunot traite, sécurise et protège vos données personnelles
        dans le cadre de sa billetterie en ligne.
      </p>
    </section>

    <section class="panel" v-for="section in sections" :key="section.title">
      <h3>{{ section.title }}</h3>
      <p>{{ section.content }}</p>
    </section>
  </div>
</template>
