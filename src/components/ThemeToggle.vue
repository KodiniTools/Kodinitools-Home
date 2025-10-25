<template>
  <button @click="toggleTheme" class="theme-toggle" :aria-label="$t('common.toggleTheme')">
    <span class="theme-icon">{{ theme === 'light' ? '🌙' : '☀️' }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const theme = ref<'light' | 'dark'>('light')

onMounted(() => {
  // Load saved theme or detect system preference
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
  
  theme.value = initialTheme
  document.documentElement.setAttribute('data-theme', initialTheme)
})

const toggleTheme = () => {
  const newTheme = theme.value === 'light' ? 'dark' : 'light'
  theme.value = newTheme
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
}
</script>

<style scoped>
.theme-toggle {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background: #f3f4f6;
}

.theme-icon {
  font-size: 1.25rem;
  display: block;
}
</style>
