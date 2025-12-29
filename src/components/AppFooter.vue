<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  brand: string
}>()
</script>

<template>
  <footer class="site-footer">
    <div>
      <p class="brand">{{ brand }}</p>
      <p class="muted">
        Billetterie certifiée RGPD. Retrouvez toutes les informations liées à la protection de vos
        données.
      </p>
    </div>
    <nav class="footer-nav">
      <RouterLink to="/rgpd/confidentialite">Politique de confidentialité</RouterLink>
      <RouterLink to="/rgpd/droits">Vos droits RGPD</RouterLink>
      <RouterLink to="/legal/mentions">Mentions légales &amp; DPO</RouterLink>
    </nav>
  </footer>
</template>
