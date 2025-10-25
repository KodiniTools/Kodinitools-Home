<template>
  <div class="language-switcher">
    <button
      @click="setLocale('de')"
      :class="{ active: currentLocale === 'de' }"
      class="locale-btn"
    >
      🇩🇪 DE
    </button>
    <button
      @click="setLocale('en')"
      :class="{ active: currentLocale === 'en' }"
      class="locale-btn"
    >
      🇬🇧 EN
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const currentLocale = computed(() => locale.value)

const setLocale = (newLocale: 'de' | 'en') => {
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
  document.documentElement.setAttribute('lang', newLocale)
}
</script>

<style scoped>
.language-switcher {
  display: flex;
  gap: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.locale-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.locale-btn:hover {
  background: #f3f4f6;
}

.locale-btn.active {
  background: #3b82f6;
  color: white;
}
</style>
