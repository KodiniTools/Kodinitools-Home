<template>
  <div id="donate-button-container" class="donate-floating-button">
    <div id="donate-button"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  // Lade PayPal Donate SDK
  const script = document.createElement('script')
  script.src = 'https://www.paypalobjects.com/donate/sdk/donate-sdk.js'
  script.charset = 'UTF-8'
  script.async = true

  script.onload = () => {
    // @ts-expect-error - PayPal ist global verfügbar nach dem Laden des Scripts
    if (window.PayPal && window.PayPal.Donation) {
      // @ts-expect-error - PayPal-Global ist nicht typisiert
      window.PayPal.Donation.Button({
        env: 'production',
        hosted_button_id: '3TP3LXWDVBA4E',
        image: {
          src: 'https://www.paypalobjects.com/de_DE/CH/i/btn/btn_donateCC_LG.gif',
          alt: 'Spenden mit dem PayPal-Button',
          title: 'PayPal - The safer, easier way to pay online!',
        }
      }).render('#donate-button')
    }
  }

  document.head.appendChild(script)
})
</script>

<style scoped>
.donate-floating-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  transition: transform 0.3s ease;
}

.donate-floating-button:hover {
  transform: scale(1.05);
}

/* Responsive Anpassung für mobile Geräte */
@media (max-width: 768px) {
  .donate-floating-button {
    bottom: 1rem;
    right: 1rem;
    transform: scale(0.9);
    transform-origin: bottom right;
  }
}

@media (max-width: 480px) {
  .donate-floating-button {
    bottom: 0.75rem;
    right: 0.75rem;
    transform: scale(0.85);
    transform-origin: bottom right;
  }
}
</style>
