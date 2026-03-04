<template>
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-links">
        <a href="https://kodinitools.com/datenschutz/" class="footer-link">{{ $t('navigation.privacy') }}</a>
        <a href="https://kodinitools.com/kontaktformular/" class="footer-link">{{ $t('navigation.contact') }}</a>
        <button @click="$emit('openCookieSettings')" class="footer-link footer-link-btn">{{ $t('cookies.cookieSettings') }}</button>
        <a href="https://www.facebook.com/KodiniTools" target="_blank" rel="noopener noreferrer" class="footer-link social-link" aria-label="Facebook">
          <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <button class="fb-share-btn" :aria-label="$t('footer.shareOnFacebook')" @click="shareOnFacebook">
          <svg class="fb-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>{{ $t('footer.share') }}</span>
        </button>
      </div>
      <p class="footer-copyright">&copy; {{ new Date().getFullYear() }} {{ $t('footer.company') }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
defineEmits<{
  openCookieSettings: []
}>()

function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href)
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    'facebook-share',
    'width=580,height=400,menubar=no,toolbar=no'
  )
}
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

.social-link {
  display: inline-flex;
  align-items: center;
}

.social-icon {
  width: 1rem;
  height: 1rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.social-link:hover .social-icon {
  opacity: 1;
}

.fb-share-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #1877F2;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 6px rgba(24, 119, 242, 0.3);
}

.fb-share-btn:hover {
  background: #166FE5;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 119, 242, 0.4);
}

.fb-share-btn:active {
  transform: translateY(0);
}

.fb-share-btn .fb-icon {
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
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
