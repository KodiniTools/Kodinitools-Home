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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(8px);
}

.theme-toggle:hover {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb, 99, 102, 241), 0.1);
}

.theme-icon {
  font-size: 0.85rem;
  line-height: 1;
  display: block;
}
</style>
