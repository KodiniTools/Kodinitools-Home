<template>
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-links">
        <a href="https://kodinitools.com/datenschutz/" class="footer-link">{{ $t('navigation.privacy') }}</a>
        <a href="https://kodinitools.com/kontaktformular/" class="footer-link">{{ $t('navigation.contact') }}</a>
        <button @click="$emit('openCookieSettings')" class="footer-link footer-link-btn">{{ $t('cookies.cookieSettings') }}</button>
      </div>
      <p class="footer-copyright">&copy; {{ new Date().getFullYear() }} {{ $t('footer.company') }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
defineEmits<{
  openCookieSettings: []
}>()
</script>

<style scoped>
.site-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 1.5rem 2rem;
  margin-top: 2rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.footer-links {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--primary-color);
}

.footer-link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.footer-copyright {
  color: var(--text-muted);
  font-size: 0.8rem;
  margin: 0;
}

@media (max-width: 768px) {
  .site-footer {
    padding: 1.25rem 1rem;
  }

  .footer-links {
    gap: 1rem;
  }

  .footer-link {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .footer-links {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
}
</style>
