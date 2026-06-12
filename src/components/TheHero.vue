<template>
  <section class="hero">
    <!-- Animated Mesh Gradient Background -->
    <div class="mesh-gradient-container">
      <div class="mesh-blob mesh-blob-1"></div>
      <div class="mesh-blob mesh-blob-2"></div>
      <div class="mesh-blob mesh-blob-3"></div>
      <div class="mesh-blob mesh-blob-4"></div>
    </div>

    <!-- Noise Texture Overlay -->
    <div class="noise-overlay"></div>

    <!-- Hero Content -->
    <div class="hero-content">
      <!-- Promo Section with Logo -->
      <div class="hero-promo">
        <div class="hero-logo">
          <img src="https://kodinitools.com/images/logo.svg" alt="KodiniTools Logo" />
        </div>
        <h1 class="hero-title typing-title">
          <span class="typed-text">{{ typedTitle }}</span>
        </h1>
        <p class="hero-subtitle">{{ $t('hero.subtitle') }}</p>
      </div>

      <!-- Features Grid -->
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-text">{{ $t('hero.features.free') }}</div>
        </div>
        <div class="feature-card">
          <div class="feature-text">{{ $t('hero.features.privacy') }}</div>
        </div>
        <div class="feature-card">
          <div class="feature-text">{{ $t('hero.features.browserBased') }}</div>
        </div>
        <div class="feature-card">
          <div class="feature-text">{{ $t('hero.features.serverBased') }}</div>
        </div>
        <div class="feature-card">
          <div class="feature-text">{{ $t('hero.features.multiLanguage') }}</div>
        </div>
        <div class="feature-card">
          <div class="feature-text">{{ $t('hero.features.noInstall') }}</div>
        </div>
      </div>

      <!-- Spotlight Search Box -->
      <div class="search-container">
        <div class="search-box spotlight-search">
          <svg class="search-icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQueryModel"
            type="text"
            :placeholder="$t('search.placeholder')"
            class="search-input"
          />
          <kbd class="search-kbd" v-if="!searchQueryModel">⌘K</kbd>
          <button
            v-if="searchQueryModel"
            @click="searchQueryModel = ''"
            class="search-clear"
            :aria-label="$t('search.clear')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ searchQuery: string }>()
const emit = defineEmits<{ 'update:searchQuery': [value: string] }>()

const { t, locale } = useI18n()

// Two-way binding for search
const searchQueryModel = computed({
  get: () => props.searchQuery,
  set: (val) => emit('update:searchQuery', val),
})

// Typing animation (moved from App.vue)
const typedTitle = ref('')
let typingTimeout: ReturnType<typeof setTimeout> | null = null

const startTypingAnimation = () => {
  const fullTitle = t('hero.title')
  let currentIndex = 0
  typedTitle.value = ''
  const typeNextChar = () => {
    if (currentIndex < fullTitle.length) {
      typedTitle.value += fullTitle[currentIndex]
      currentIndex++
      typingTimeout = setTimeout(typeNextChar, Math.random() * 50 + 50)
    }
  }
  typingTimeout = setTimeout(typeNextChar, 500)
}

watch(locale, () => {
  if (typingTimeout) clearTimeout(typingTimeout)
  startTypingAnimation()
})

// Feature card 3D tilt (moved from App.vue)
const isTouchDevice = () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

const initFeatureCardTilt = () => {
  if (typeof window === 'undefined' || isTouchDevice()) return
  const featuresGrid = document.querySelector('.features-grid')
  if (!featuresGrid) return

  let tiltRaf: number | null = null
  featuresGrid.addEventListener('mousemove', (e: Event) => {
    if (tiltRaf !== null) return
    tiltRaf = requestAnimationFrame(() => {
      tiltRaf = null
      const me = e as MouseEvent
      const card = (me.target as HTMLElement).closest?.('.feature-card') as HTMLElement | null
      if (!card) return
      const rect = card.getBoundingClientRect()
      const x = me.clientX - rect.left
      const y = me.clientY - rect.top
      card.style.transform = `perspective(800px) rotateX(${(y - rect.height / 2) / 12}deg) rotateY(${(rect.width / 2 - x) / 12}deg) translateY(-5px) scale(1.02)`
      card.style.setProperty('--feature-mouse-x', `${(x / rect.width) * 100}%`)
      card.style.setProperty('--feature-mouse-y', `${(y / rect.height) * 100}%`)
    })
  })

  featuresGrid.addEventListener('mouseleave', () => {
    featuresGrid.querySelectorAll<HTMLElement>('.feature-card').forEach(card => {
      card.style.transform = ''
      card.style.setProperty('--feature-mouse-x', '50%')
      card.style.setProperty('--feature-mouse-y', '50%')
    })
  })

  featuresGrid.querySelectorAll<HTMLElement>('.feature-card').forEach(card => {
    card.addEventListener('mouseleave', () => {
      card.style.transform = ''
      card.style.setProperty('--feature-mouse-x', '50%')
      card.style.setProperty('--feature-mouse-y', '50%')
    })
  })
}

onMounted(() => {
  startTypingAnimation()
  setTimeout(() => initFeatureCardTilt(), 100)
})

onUnmounted(() => {
  if (typingTimeout) clearTimeout(typingTimeout)
})
</script>
