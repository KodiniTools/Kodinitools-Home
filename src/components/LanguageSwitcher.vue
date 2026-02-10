<template>
  <div class="language-switcher">
    <button
      @click="setLocale('de')"
      :class="{ active: currentLocale === 'de' }"
      class="locale-btn"
      aria-label="Deutsch"
    >
      DE
    </button>
    <button
      @click="setLocale('en')"
      :class="{ active: currentLocale === 'en' }"
      class="locale-btn"
      aria-label="English"
    >
      EN
    </button>
    <div class="slider" :class="{ 'slide-right': currentLocale === 'en' }"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n({ useScope: 'global' })

const currentLocale = computed(() => locale.value)

const setLocale = (newLocale: 'de' | 'en') => {
  locale.value = newLocale

  // SSR-safe localStorage and document access
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', newLocale)
    document.documentElement.setAttribute('lang', newLocale)
  }
}
</script>

<style scoped>
.language-switcher {
  display: flex;
  position: relative;
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 3px;
  gap: 2px;
  border: 1px solid var(--border-color);
  backdrop-filter: blur(8px);
}

.locale-btn {
  position: relative;
  z-index: 1;
  padding: 0.35rem 0.65rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.25s ease;
  font-weight: 600;
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  color: var(--text-muted);
}

.locale-btn:hover {
  color: var(--text-color);
}

.locale-btn.active {
  color: white;
}

[data-theme="dark"] .locale-btn.active {
  color: #091428;
}

/* Animated slider background */
.slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 4px);
  height: calc(100% - 6px);
  background: var(--gradient-1);
  border-radius: 4px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.slider.slide-right {
  transform: translateX(calc(100% + 2px));
}

/* Subtle glow on hover */
.language-switcher:hover {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb, 99, 102, 241), 0.1);
}

/* Focus states for accessibility */
.locale-btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 1px;
}
</style>
