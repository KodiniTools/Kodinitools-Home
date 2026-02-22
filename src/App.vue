<template>
  <div id="app" @mousemove="handleMouseMove">
    <!-- Global Background Effects -->
    <div class="global-background">
      <div class="global-gradient"></div>
      <div class="global-noise"></div>
      <!-- Mouse-following spotlight -->
      <div class="mouse-spotlight" :style="spotlightStyle"></div>
    </div>

    <!-- Global Floating Tool Icons Background -->
    <div class="floating-icons-global" ref="floatingIcons">
      <!-- Audio Waveform -->
      <div class="floating-icon icon-1">
        <svg viewBox="0 0 80 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M5 20h5v-10h5v20h5v-15h5v10h5v-5h5v10h5v-15h5v20h5v-10h5v5h5v-8h5"/>
        </svg>
      </div>
      <!-- Music Note -->
      <div class="floating-icon icon-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
      <!-- Equalizer Bars -->
      <div class="floating-icon icon-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="4" y1="21" x2="4" y2="14"/>
          <line x1="9" y1="21" x2="9" y2="8"/>
          <line x1="14" y1="21" x2="14" y2="12"/>
          <line x1="19" y1="21" x2="19" y2="5"/>
        </svg>
      </div>
      <!-- Gear/Settings -->
      <div class="floating-icon icon-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </div>
      <!-- Speaker/Volume -->
      <div class="floating-icon icon-7">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 010 7.07"/>
          <path d="M19.07 4.93a10 10 0 010 14.14"/>
        </svg>
      </div>
      <!-- Crop/Edit -->
      <div class="floating-icon icon-8">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 2v4h12v12h4"/>
          <path d="M18 22v-4H6V6H2"/>
        </svg>
      </div>
      <!-- Additional icons for full page coverage -->
      <!-- Second Waveform (bottom) -->
      <div class="floating-icon icon-9">
        <svg viewBox="0 0 80 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M5 20h5v-10h5v20h5v-15h5v10h5v-5h5v10h5v-15h5v20h5v-10h5v5h5v-8h5"/>
        </svg>
      </div>
      <!-- Second Music Note -->
      <div class="floating-icon icon-10">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
      <!-- Second Image Icon -->
      <div class="floating-icon icon-11">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      </div>
      <!-- Second Equalizer -->
      <div class="floating-icon icon-12">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="4" y1="21" x2="4" y2="14"/>
          <line x1="9" y1="21" x2="9" y2="8"/>
          <line x1="14" y1="21" x2="14" y2="12"/>
          <line x1="19" y1="21" x2="19" y2="5"/>
        </svg>
      </div>
    </div>

    <!-- Header -->
    <header class="header">
      <nav class="nav-container">
        <div class="logo" @click="goHome" style="cursor: pointer;">
          <img src="/android-chrome-192x192.png" alt="KodiniTools Logo" class="logo-icon">
          <span>{{ $t('footer.company') }}</span>
          <img src="/images/schweiz-192x192.png" alt="Made in Switzerland" class="logo-flag-icon">
        </div>

        <!-- Hamburger Button for Mobile -->
        <button class="hamburger-btn" @click="toggleMobileMenu" :class="{ 'is-active': mobileMenuOpen }" aria-label="Toggle menu">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>

        <div class="nav-links" :class="{ 'is-open': mobileMenuOpen }">
          <!-- Audio Tools Dropdown -->
          <div class="nav-dropdown">
            <a href="#" class="nav-link">
              {{ $t('navigation.audioTools') }} ▾
            </a>
            <div class="dropdown-menu">
              <a href="https://kodinitools.com/audiokonverter/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.audioConverter') }}
              </a>
              <a href="https://kodinitools.com/mp3konverter/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.mp3Converter') }}
              </a>
              <a href="https://kodinitools.com/equaliser19/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.equalizer19') }}
              </a>
              <a href="https://kodinitools.com/audioequalizer/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.audioEqualizer') }}
              </a>
              <a href="https://kodinitools.com/audionormalisierer/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.audioNormalizer') }}
              </a>
              <a href="https://kodinitools.com/modernermusikplayer/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.modernPlayer') }}
              </a>
              <a href="https://kodinitools.com/ultimativermusikplayer/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.ultimatePlayer') }}
              </a>
              <a href="https://kodinitools.com/playlist_generator/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.playlistGenerator') }}
              </a>
              <a href="https://kodinitools.com/playlistkonverter/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.playlistConverter') }}
              </a>
              <a href="https://kodinitools.com/visualizer/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.visualizer') }}
              </a>
              <a href="https://kodinitools.com/alarmtool/" class="dropdown-item">
                {{ $t('navigation.audioToolsMenu.alarmTool') }}
              </a>
            </div>
          </div>

          <!-- Image Tools Dropdown -->
          <div class="nav-dropdown">
            <a href="#" class="nav-link">
              {{ $t('navigation.imageTools') }} ▾
            </a>
            <div class="dropdown-menu">
              <a href="https://kodinitools.com/bildkonverter/" class="dropdown-item">
                {{ $t('navigation.imageToolsMenu.imageConverter') }}
              </a>
              <a href="https://kodinitools.com/bilderseriebearbeiten/" class="dropdown-item">
                {{ $t('navigation.imageToolsMenu.batchImageEditor') }}
              </a>
              <a href="https://kodinitools.com/collagemaker" class="dropdown-item">
                {{ $t('navigation.imageToolsMenu.photoCollage') }}
              </a>
            </div>
          </div>

          <!-- Tools Dropdown -->
          <div class="nav-dropdown">
            <a href="#" class="nav-link">
              {{ $t('navigation.tools') }} ▾
            </a>
            <div class="dropdown-menu">
              <a href="https://kodinitools.com/kodini-color-extractor/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.colorExtractor') }}
              </a>
              <a href="https://kodinitools.com/videokonverter/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.videoConverter') }}
              </a>
            </div>
          </div>

          <a href="https://kodinitools.com/kontaktformular/" class="nav-link" @click="closeMobileMenu">{{ $t('navigation.contact') }}</a>
          <a @click.prevent="toggleFaq(); closeMobileMenu()" href="#faq" class="nav-link faq-link">FAQ</a>
          <a @click.prevent="toggleBlog(); closeMobileMenu()" href="#blog" class="nav-link blog-link">{{ $t('navigation.blog') }}</a>

          <!-- Mobile: Controls inside menu -->
          <div class="nav-controls-mobile">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        <div class="nav-controls nav-controls-desktop">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </nav>
    </header>

    <!-- Blog Page -->
    <BlogPage v-if="showBlog" @goHome="goHome" />

    <!-- FAQ Page -->
    <FaqPage v-else-if="showFaq" @goHome="goHome" />

    <!-- Main Content -->
    <template v-else>
    <!-- Hero Section with Animated Mesh Gradient -->
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
              v-model="searchQuery"
              type="text"
              :placeholder="$t('search.placeholder')"
              class="search-input"
            />
            <kbd class="search-kbd" v-if="!searchQuery">⌘K</kbd>
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
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

    <!-- Search Results Section -->
    <section v-if="hasSearchResults" class="tools-section search-results-section">
      <div class="section-header">
        <h2>{{ $t('search.resultsTitle') }}</h2>
        <p v-if="!showNoResults">{{ filteredTools.length }} {{ $t('search.resultsFound') }}</p>
        <p v-else class="no-results">{{ $t('search.noResults') }}</p>
      </div>

      <div v-if="!showNoResults" class="svg-card-grid">
        <a
          v-for="tool in filteredTools"
          :key="tool.key"
          :href="$t(`${tool.key}.link`)"
          class="svg-card-link"
        >
          <div class="svg-card">
            <img :src="$t(`${tool.key}.svg`)" :alt="$t(`${tool.key}.title`)" />
          </div>
        </a>
      </div>
    </section>

    <!-- Audio Tools Section -->
    <section class="tools-section">
      <div class="section-header">
        <p>{{ $t('tools.sectionDescription') }}</p>
      </div>

      <div class="svg-card-grid">
        <a :href="$t('tools.audioConverter.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.audioConverter.svg')" :alt="$t('tools.audioConverter.title')" />
          </div>
        </a>
        <a :href="$t('tools.audioEqualizer.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.audioEqualizer.svg')" :alt="$t('tools.audioEqualizer.title')" />
          </div>
        </a>
        <a :href="$t('tools.musicPlayer.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.musicPlayer.svg')" :alt="$t('tools.musicPlayer.title')" />
          </div>
        </a>
        <a :href="$t('tools.audioVisualizer.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.audioVisualizer.svg')" :alt="$t('tools.audioVisualizer.title')" />
          </div>
        </a>
        <a :href="$t('tools.mp3Converter.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.mp3Converter.svg')" :alt="$t('tools.mp3Converter.title')" />
          </div>
        </a>
        <a :href="$t('tools.interactiveEqualizer.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.interactiveEqualizer.svg')" :alt="$t('tools.interactiveEqualizer.title')" />
          </div>
        </a>
        <a :href="$t('tools.modernPlayer.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.modernPlayer.svg')" :alt="$t('tools.modernPlayer.title')" />
          </div>
        </a>
        <a :href="$t('tools.playlistGenerator.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.playlistGenerator.svg')" :alt="$t('tools.playlistGenerator.title')" />
          </div>
        </a>
        <a :href="$t('tools.alarmTool.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.alarmTool.svg')" :alt="$t('tools.alarmTool.title')" />
          </div>
        </a>
        <a :href="$t('tools.audioNormalizer.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.audioNormalizer.svg')" :alt="$t('tools.audioNormalizer.title')" />
          </div>
        </a>
        <a :href="$t('tools.playlistToWebm.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('tools.playlistToWebm.svg')" :alt="$t('tools.playlistToWebm.title')" />
          </div>
        </a>
      </div>
    </section>

    <!-- Image Tools Section -->
    <section class="tools-section">
      <div class="section-header">
        <p>{{ $t('imageTools.sectionDescription') }}</p>
      </div>

      <div class="svg-card-grid">
        <a :href="$t('imageTools.imageConverter.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('imageTools.imageConverter.svg')" :alt="$t('imageTools.imageConverter.title')" />
          </div>
        </a>
        <a :href="$t('imageTools.batchImageEditor.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('imageTools.batchImageEditor.svg')" :alt="$t('imageTools.batchImageEditor.title')" />
          </div>
        </a>
        <a :href="$t('imageTools.photoCollage.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('imageTools.photoCollage.svg')" :alt="$t('imageTools.photoCollage.title')" />
          </div>
        </a>
      </div>
    </section>

    <!-- Diverse Tools Section -->
    <section class="tools-section">
      <div class="section-header">
        <p>{{ $t('diverseTools.sectionDescription') }}</p>
      </div>

      <div class="svg-card-grid">
        <a :href="$t('diverseTools.colorExtractor.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('diverseTools.colorExtractor.svg')" :alt="$t('diverseTools.colorExtractor.title')" />
          </div>
        </a>
        <a :href="$t('diverseTools.videoConverter.link')" class="svg-card-link">
          <div class="svg-card">
            <img :src="$t('diverseTools.videoConverter.svg')" :alt="$t('diverseTools.videoConverter.title')" />
          </div>
        </a>
      </div>
    </section>
    </template>

    <!-- Scroll to Top Button -->
    <Transition name="fade-slide">
      <button
        v-if="showScrollTop"
        @click="scrollToTop"
        class="scroll-to-top"
        :aria-label="$t('search.scrollTop')"
      >
        ↑
      </button>
    </Transition>

    <!-- PayPal Donate Button -->
    <DonateButton />

    <!-- Footer with Cookie Settings Link -->
    <AppFooter @openCookieSettings="openCookieSettings" />

    <!-- Cookie Banner -->
    <CookieBanner ref="cookieBannerRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import DonateButton from './components/DonateButton.vue'
import CookieBanner from './components/CookieBanner.vue'
import AppFooter from './components/AppFooter.vue'
import BlogPage from './components/BlogPage.vue'
import FaqPage from './components/FaqPage.vue'

const { t, locale } = useI18n()

// Mobile menu toggle
const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// Blog page toggle
const showBlog = ref(false)

const toggleBlog = () => {
  showBlog.value = !showBlog.value
  showFaq.value = false
  if (showBlog.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// FAQ page toggle
const showFaq = ref(false)

const toggleFaq = () => {
  showFaq.value = !showFaq.value
  showBlog.value = false
  if (showFaq.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const goHome = () => {
  showBlog.value = false
  showFaq.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Cookie Banner ref
const cookieBannerRef = ref<InstanceType<typeof CookieBanner> | null>(null)

const openCookieSettings = () => {
  cookieBannerRef.value?.openSettings()
}

// Typing animation for hero title
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
      // Variable typing speed for more natural feel
      const delay = Math.random() * 50 + 50 // 50-100ms per character
      typingTimeout = setTimeout(typeNextChar, delay)
    }
  }

  // Start typing after a small delay
  typingTimeout = setTimeout(typeNextChar, 500)
}

// Restart typing animation when language changes
watch(locale, () => {
  // Clear any existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }
  // Restart the typing animation with the new language
  startTypingAnimation()
})

// Mouse-following spotlight effect
const mouseX = ref(50)
const mouseY = ref(50)
const floatingIcons = ref<HTMLElement | null>(null)

// Store mouse offsets for each icon
const iconMouseOffsets = ref<{x: number, y: number}[]>([])
const iconScrollOffsets = ref<number[]>([])

const spotlightStyle = computed(() => {
  // Check current theme for appropriate spotlight color
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
  const spotlightColor = isDark ? 'rgba(201, 152, 77, 0.15)' : 'rgba(1, 79, 153, 0.20)'
  return {
    background: `radial-gradient(1200px circle at ${mouseX.value}% ${mouseY.value}%, ${spotlightColor}, transparent 45%)`
  }
})

// Update icon transforms combining mouse + scroll
const updateIconTransforms = () => {
  if (!floatingIcons.value) return
  const icons = floatingIcons.value.querySelectorAll('.floating-icon')
  icons.forEach((icon, index) => {
    const mouseOffset = iconMouseOffsets.value[index] || { x: 0, y: 0 }
    const scrollOffset = iconScrollOffsets.value[index] || 0
    ;(icon as HTMLElement).style.transform = `translate(${mouseOffset.x}px, ${mouseOffset.y + scrollOffset}px)`
  })
}

const handleMouseMove = (e: MouseEvent) => {
  if (typeof window === 'undefined') return

  // Update spotlight position (percentage of viewport)
  mouseX.value = (e.clientX / window.innerWidth) * 100
  mouseY.value = (e.clientY / window.innerHeight) * 100

  // Calculate mouse parallax offsets for floating icons
  if (floatingIcons.value) {
    const icons = floatingIcons.value.querySelectorAll('.floating-icon')
    const newOffsets: {x: number, y: number}[] = []
    icons.forEach((_, index) => {
      const speed = 0.08 + (index * 0.015)
      const x = (e.clientX - window.innerWidth / 2) * speed
      const y = (e.clientY - window.innerHeight / 2) * speed
      newOffsets.push({ x, y })
    })
    iconMouseOffsets.value = newOffsets
    updateIconTransforms()
  }
}

// Search functionality
const searchQuery = ref('')

// All tools data for filtering
const allTools = computed(() => [
  // Audio Tools
  { key: 'tools.audioConverter', section: 'audio', icon: '🎵' },
  { key: 'tools.audioEqualizer', section: 'audio', icon: '🎚️' },
  { key: 'tools.musicPlayer', section: 'audio', icon: '🎧' },
  { key: 'tools.audioVisualizer', section: 'audio', icon: '🎬' },
  { key: 'tools.mp3Converter', section: 'audio', icon: '🎼' },
  { key: 'tools.interactiveEqualizer', section: 'audio', icon: '🎛️' },
  { key: 'tools.modernPlayer', section: 'audio', icon: '🎶' },
  { key: 'tools.playlistGenerator', section: 'audio', icon: '📃' },
  { key: 'tools.alarmTool', section: 'audio', icon: '⏰' },
  { key: 'tools.audioNormalizer', section: 'audio', icon: '📊' },
  { key: 'tools.playlistToWebm', section: 'audio', icon: '📼' },
  // Image Tools
  { key: 'imageTools.imageConverter', section: 'image', icon: '🖼️' },
  { key: 'imageTools.batchImageEditor', section: 'image', icon: '📸' },
  { key: 'imageTools.photoCollage', section: 'image', icon: '🎨' },
  // Diverse Tools
  { key: 'diverseTools.colorExtractor', section: 'diverse', icon: '🎨' },
  { key: 'diverseTools.videoConverter', section: 'diverse', icon: '🎬' },
])

const filteredTools = computed(() => {
  if (!searchQuery.value.trim()) return null
  const query = searchQuery.value.toLowerCase()
  return allTools.value.filter(tool => {
    const title = t(`${tool.key}.title`).toLowerCase()
    const description = t(`${tool.key}.description`).toLowerCase()
    return title.includes(query) || description.includes(query)
  })
})

const hasSearchResults = computed(() => filteredTools.value !== null)
const showNoResults = computed(() => filteredTools.value !== null && filteredTools.value.length === 0)

// Scroll to top functionality
const showScrollTop = ref(false)
let scrollTicking = false

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 400

  // Use requestAnimationFrame for smooth scroll parallax
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      // Scroll parallax for floating icons
      if (floatingIcons.value && typeof window !== 'undefined') {
        const scrollY = window.scrollY
        const icons = floatingIcons.value.querySelectorAll('.floating-icon')
        const newScrollOffsets: number[] = []
        icons.forEach((_, index) => {
          const speed = 0.08 + (index * 0.025)
          const yOffset = scrollY * speed
          newScrollOffsets.push(yOffset)
        })
        iconScrollOffsets.value = newScrollOffsets
        updateIconTransforms()
      }
      scrollTicking = false
    })
    scrollTicking = true
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Check if device supports touch (disable tilt on touch devices)
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// 3D Tilt Effect for Cards - Using Event Delegation for reliability
const initTiltEffect = () => {
  if (typeof window === 'undefined') return
  if (isTouchDevice()) return // Skip tilt on touch devices

  // Use event delegation on document for better reliability
  document.addEventListener('mousemove', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target || typeof target.closest !== 'function') return
    const card = target.closest('.tool-card, .svg-card') as HTMLElement
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = (y - centerY) / 15
    const rotateY = (centerX - x) / 15

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`

    // Update glow position
    const glowX = (x / rect.width) * 100
    const glowY = (y / rect.height) * 100
    card.style.setProperty('--mouse-x', `${glowX}%`)
    card.style.setProperty('--mouse-y', `${glowY}%`)
  })

  document.addEventListener('mouseleave', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target || typeof target.closest !== 'function') return
    const card = target.closest('.tool-card, .svg-card') as HTMLElement
    if (!card) return

    card.style.transform = ''
    card.style.setProperty('--mouse-x', '50%')
    card.style.setProperty('--mouse-y', '50%')
  }, true)

  // Also handle when mouse leaves a card
  document.addEventListener('mouseout', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement

    if ((target.classList.contains('tool-card') || target.classList.contains('svg-card')) &&
        (!relatedTarget || !target.contains(relatedTarget))) {
      target.style.transform = ''
      target.style.setProperty('--mouse-x', '50%')
      target.style.setProperty('--mouse-y', '50%')
    }
  })
}

// 3D Tilt Effect for Feature Cards in Hero Section
const initFeatureCardTilt = () => {
  if (typeof window === 'undefined') return
  if (isTouchDevice()) return // Skip tilt on touch devices

  const featuresGrid = document.querySelector('.features-grid')
  if (!featuresGrid) return

  featuresGrid.addEventListener('mousemove', (e: Event) => {
    const mouseEvent = e as MouseEvent
    const target = mouseEvent.target as HTMLElement
    if (!target || typeof target.closest !== 'function') return
    const card = target.closest('.feature-card') as HTMLElement
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = mouseEvent.clientX - rect.left
    const y = mouseEvent.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Subtle 3D tilt effect
    const rotateX = (y - centerY) / 12
    const rotateY = (centerX - x) / 12

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px) scale(1.02)`

    // Update glow position
    const glowX = (x / rect.width) * 100
    const glowY = (y / rect.height) * 100
    card.style.setProperty('--feature-mouse-x', `${glowX}%`)
    card.style.setProperty('--feature-mouse-y', `${glowY}%`)
  })

  featuresGrid.addEventListener('mouseleave', () => {
    const cards = featuresGrid.querySelectorAll('.feature-card') as NodeListOf<HTMLElement>
    cards.forEach(card => {
      card.style.transform = ''
      card.style.setProperty('--feature-mouse-x', '50%')
      card.style.setProperty('--feature-mouse-y', '50%')
    })
  })

  // Handle individual card mouse leave
  const cards = featuresGrid.querySelectorAll('.feature-card')
  cards.forEach(card => {
    card.addEventListener('mouseleave', () => {
      const htmlCard = card as HTMLElement
      htmlCard.style.transform = ''
      htmlCard.style.setProperty('--feature-mouse-x', '50%')
      htmlCard.style.setProperty('--feature-mouse-y', '50%')
    })
  })
}

// Intersection Observer for scroll animations with stagger
const observeElements = () => {
  if (typeof window === 'undefined') return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add stagger delay based on index
          const parent = entry.target.parentElement
          if (parent) {
            const siblings = Array.from(parent.children)
            const index = siblings.indexOf(entry.target as Element)
            const delay = index * 0.08
            ;(entry.target as HTMLElement).style.transitionDelay = `${delay}s`
          }
          entry.target.classList.add('is-visible')
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )

  document.querySelectorAll('.tools-section, .tool-card-link, .svg-card-link').forEach((el) => {
    el.classList.add('scroll-reveal')
    observer.observe(el)
  })
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Start typing animation
    startTypingAnimation()
    // Delay setup to ensure DOM is ready
    setTimeout(() => {
      observeElements()
      initTiltEffect()
      initFeatureCardTilt()
      // Initialize scroll parallax on page load
      handleScroll()
    }, 100)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
    // Clear typing animation timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
  }
})
</script>

<style>
@font-face {
  font-family: 'Supreme';
  src: url('/fonts/Supreme-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* New Color Palette */
  --color-gold: #c9984d;
  --color-blue: #014f99;
  --color-blue-dark: #003971;
  --color-gold-light: #f8e1a9;
  --color-cream: #f9f2d5;

  /* Light Theme */
  --bg-color: #f9f2d5;
  --bg-secondary: #ffffff;
  --text-color: #003971;
  --text-secondary: #014f99;
  --text-muted: #4f6f8e;
  --border-color: #d4c09a;
  --primary-color: #014f99;
  --primary-dark: #003971;
  --primary-light: #3a7bc8;
  --accent-color: #c9984d;
  --gradient-1: linear-gradient(135deg, #014f99 0%, #003971 100%);
  --gradient-2: linear-gradient(135deg, #c9984d 0%, #014f99 100%);
  --gradient-3: linear-gradient(135deg, #003971 0%, #001d3d 100%);
  --gradient-hero: linear-gradient(135deg, #014f99 0%, #003971 50%, #001d3d 100%);
  --shadow-sm: 0 1px 2px 0 rgba(0, 57, 113, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 57, 113, 0.08);
  --shadow-lg: 0 10px 15px -3px rgba(0, 57, 113, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 57, 113, 0.12);
}

[data-theme="dark"] {
  /* Navy & Gold Dark Theme */
  --color-gold: #c9984d;
  --color-blue: #014f99;
  --color-blue-dark: #0a2e5c;
  --color-gold-light: #f8e1a9;
  --color-cream: #f9f2d5;

  --bg-color: #091428;
  --bg-secondary: #0E1C32;
  --card-bg: #142640;
  --text-color: #f9f2d5;
  --text-secondary: #f8e1a9;
  --text-muted: #7A8DA0;
  --border-color: #1d3a5c;
  --primary-color: #c9984d;
  --primary-dark: #a67d3d;
  --primary-light: #f8e1a9;
  --accent-color: #014f99;
  --accent-text: #091428;
  --gradient-1: linear-gradient(135deg, #c9984d 0%, #014f99 100%);
  --gradient-2: linear-gradient(135deg, #014f99 0%, #0a2e5c 100%);
  --gradient-3: linear-gradient(135deg, #142640 0%, #0E1C32 100%);
  --gradient-hero: linear-gradient(135deg, #091428 0%, #0E1C32 50%, #142640 100%);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.6);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.7);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(201, 152, 77, 0.15),
                0 0 40px rgba(201, 152, 77, 0.1),
                0 0 60px rgba(201, 152, 77, 0.05);
  }
  50% {
    box-shadow: 0 0 30px rgba(201, 152, 77, 0.25),
                0 0 60px rgba(201, 152, 77, 0.15),
                0 0 90px rgba(201, 152, 77, 0.1);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(200%) rotate(45deg);
  }
}

@keyframes borderGlow {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

body {
  font-family: 'Supreme', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
  background: var(--bg-color);
  color: var(--text-color);
  transition: background 0.3s ease, color 0.3s ease;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  animation: fadeIn 0.6s ease-in;
  position: relative;
}

/* Global Background Effects */
.global-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: -1;
}

.global-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(ellipse 80% 50% at 20% 10%, rgba(1, 79, 153, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 30%, rgba(201, 152, 77, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 70% 50% at 10% 80%, rgba(0, 57, 113, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 90% 90%, rgba(1, 79, 153, 0.04) 0%, transparent 50%);
}

[data-theme="dark"] .global-gradient {
  background:
    radial-gradient(ellipse 80% 50% at 20% 10%, rgba(201, 152, 77, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 30%, rgba(1, 79, 153, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse 70% 50% at 10% 80%, rgba(201, 152, 77, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 90% 90%, rgba(1, 79, 153, 0.04) 0%, transparent 50%);
}

.global-noise {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.025;
}

[data-theme="dark"] .global-noise {
  opacity: 0.04;
}

/* Mouse-following spotlight */
.mouse-spotlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: background 0.3s ease;
}

/* Dark theme spotlight color is handled by spotlightStyle computed property */

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(249, 242, 213, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

[data-theme="dark"] .header {
  background: rgba(9, 20, 40, 0.92);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.1rem;
  font-weight: 700;
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: transform 0.3s ease;
  cursor: pointer;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.logo-icon {
  height: 24px;
  width: 24px;
  object-fit: contain;
}

.logo-flag-icon {
  height: 20px;
  width: 20px;
  object-fit: contain;
}

.logo:hover {
  transform: scale(1.05);
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  padding: 0.4rem 0;
}

.nav-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 0;
  left: 50%;
  background: var(--gradient-1);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}


.nav-link:hover {
  color: var(--primary-color);
}

.nav-link:hover::after {
  width: 100%;
}

/* Dropdown Navigation */
.nav-dropdown {
  position: relative;
  display: inline-block;
}

.nav-dropdown > .nav-link {
  padding-bottom: 1rem;
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-xl);
  min-width: 220px;
  z-index: 1000;
  padding: 0.5rem;
  animation: fadeInUp 0.2s ease;
}

.dropdown-menu::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 10px;
}

[data-theme="dark"] .dropdown-menu {
  background: rgba(14, 28, 50, 0.98);
}

.nav-dropdown:hover .dropdown-menu {
  display: block;
}

.dropdown-item {
  display: block;
  padding: 0.5rem 0.85rem;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.3s ease;
  white-space: nowrap;
  border-radius: 0.4rem;
  font-weight: 500;
  font-size: 0.8rem;
}


.dropdown-item:hover {
  background: linear-gradient(135deg, rgba(1, 79, 153, 0.1) 0%, rgba(0, 57, 113, 0.1) 100%);
  color: var(--primary-color);
  transform: translateX(5px);
}

.dropdown-item:first-child {
  border-radius: 0.5rem;
}

.dropdown-item:last-child {
  border-radius: 0.5rem;
}

.nav-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Hide mobile controls in nav-links on desktop */
.nav-controls-mobile {
  display: none;
}

/* Hamburger Button */
.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 28px;
  height: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.hamburger-line {
  width: 100%;
  height: 3px;
  background: #003971;
  border-radius: 2px;
  transition: all 0.3s ease;
}

[data-theme="dark"] .hamburger-line {
  background: #f9f2d5;
}

.hamburger-btn.is-active .hamburger-line:nth-child(1) {
  transform: translateY(8.5px) rotate(45deg);
}

.hamburger-btn.is-active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.hamburger-btn.is-active .hamburger-line:nth-child(3) {
  transform: translateY(-8.5px) rotate(-45deg);
}

/* Hero with Animated Mesh Gradient */
.hero {
  position: relative;
  max-width: 1200px;
  margin: 2rem auto 0;
  padding: 4rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 2rem;
  margin-bottom: 2.5rem;
  overflow: hidden;
  border: 1px solid rgba(1, 79, 153, 0.12);
  box-shadow: 0 8px 32px rgba(0, 57, 113, 0.08),
              0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

[data-theme="dark"] .hero {
  background: rgba(14, 28, 50, 0.8);
  border: 1px solid rgba(201, 152, 77, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(201, 152, 77, 0.1) inset;
}

/* Animated Mesh Gradient Background */
.mesh-gradient-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.mesh-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.6;
  animation: meshFloat 20s ease-in-out infinite;
}

.mesh-blob-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #014f99 0%, #3a7bc8 100%);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.mesh-blob-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #c9984d 0%, #f8e1a9 100%);
  top: -50px;
  right: -80px;
  animation-delay: -5s;
  animation-duration: 25s;
}

.mesh-blob-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #003971 0%, #2a6db5 100%);
  bottom: -100px;
  left: 30%;
  animation-delay: -10s;
  animation-duration: 22s;
}

.mesh-blob-4 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #f8e1a9 0%, #f9f2d5 100%);
  bottom: -80px;
  right: 10%;
  animation-delay: -15s;
  animation-duration: 18s;
}

@keyframes meshFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  25% {
    transform: translate(30px, -30px) scale(1.1) rotate(5deg);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.95) rotate(-5deg);
  }
  75% {
    transform: translate(20px, 10px) scale(1.05) rotate(3deg);
  }
}

[data-theme="dark"] .mesh-blob-1 {
  background: linear-gradient(135deg, #c9984d 0%, #a67d3d 100%);
  opacity: 0.4;
}

[data-theme="dark"] .mesh-blob-2 {
  background: linear-gradient(135deg, #014f99 0%, #3a7bc8 100%);
  opacity: 0.35;
}

[data-theme="dark"] .mesh-blob-3 {
  background: linear-gradient(135deg, #c9984d 0%, #f8e1a9 100%);
  opacity: 0.3;
}

[data-theme="dark"] .mesh-blob-4 {
  background: linear-gradient(135deg, #014f99 0%, #0a2e5c 100%);
  opacity: 0.4;
}

/* Noise Texture Overlay */
.noise-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  z-index: 1;
}

[data-theme="dark"] .noise-overlay {
  opacity: 0.05;
}

/* Global Floating Tool Icons */
.floating-icons-global {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.floating-icon {
  position: absolute;
  color: var(--color-blue);
  opacity: 0.12;
  animation: float 20s ease-in-out infinite;
  --scroll-y: 0px;
  transition: transform 0.15s ease-out;
  will-change: transform;
}

[data-theme="dark"] .floating-icon {
  color: var(--color-gold);
  opacity: 0.08;
}

.floating-icon svg {
  width: 100%;
  height: 100%;
}

/* Individual icon positions distributed across full viewport */
.icon-1 {
  width: 140px;
  height: 70px;
  top: 8%;
  left: 3%;
  animation-delay: 0s;
  animation-duration: 25s;
}

.icon-2 {
  width: 50px;
  height: 50px;
  top: 15%;
  right: 8%;
  animation-delay: -3s;
  animation-duration: 22s;
  filter: blur(1px);
}

.icon-4 {
  width: 45px;
  height: 45px;
  top: 5%;
  right: 30%;
  animation-delay: -5s;
  animation-duration: 20s;
  filter: blur(0.5px);
}

.icon-5 {
  width: 55px;
  height: 55px;
  top: 50%;
  right: 5%;
  animation-delay: -10s;
  animation-duration: 24s;
}

.icon-7 {
  width: 40px;
  height: 40px;
  top: 60%;
  left: 12%;
  animation-delay: -8s;
  animation-duration: 21s;
}

.icon-8 {
  width: 48px;
  height: 48px;
  top: 22%;
  right: 15%;
  animation-delay: -12s;
  animation-duration: 23s;
  filter: blur(0.5px);
}

/* Additional icons for full page coverage */
.icon-9 {
  width: 120px;
  height: 60px;
  top: 75%;
  right: 10%;
  animation-delay: -4s;
  animation-duration: 27s;
}

.icon-10 {
  width: 45px;
  height: 45px;
  top: 85%;
  left: 25%;
  animation-delay: -9s;
  animation-duration: 19s;
  filter: blur(0.5px);
}

.icon-11 {
  width: 55px;
  height: 55px;
  top: 70%;
  right: 35%;
  animation-delay: -6s;
  animation-duration: 24s;
}

.icon-12 {
  width: 42px;
  height: 42px;
  top: 90%;
  right: 20%;
  animation-delay: -11s;
  animation-duration: 22s;
  filter: blur(1px);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-20px) rotate(3deg);
  }
  50% {
    transform: translateY(-8px) rotate(-2deg);
  }
  75% {
    transform: translateY(-25px) rotate(2deg);
  }
}

/* Hide floating icons on mobile for performance */
@media (max-width: 768px) {
  .floating-icons-global {
    display: none;
  }
}

/* Hero Content */
.hero-content {
  position: relative;
  z-index: 3;
}

/* Hero Title with Word Animation */
.hero-title {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.title-word {
  display: inline-block;
  background: linear-gradient(135deg, #014f99 0%, #003971 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: wordReveal 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

/* Typing Animation Styles */
.typing-title {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.2em;
}

.typed-text {
  background: linear-gradient(135deg, #014f99 0%, #003971 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

[data-theme="dark"] .typed-text {
  background: linear-gradient(135deg, #c9984d 0%, #f8e1a9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@keyframes wordReveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

[data-theme="dark"] .title-word {
  background: linear-gradient(135deg, #c9984d 0%, #f8e1a9 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #014f99;
  margin-bottom: 0;
  animation: fadeInUp 1s ease 0.3s forwards;
  opacity: 0;
  font-weight: 500;
  max-width: 600px;
  margin: 0 auto;
  white-space: pre-line;
}

[data-theme="dark"] .hero-subtitle {
  color: #f8e1a9;
}

/* Hero Promo Section with Logo */
.hero-promo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.hero-logo {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.hero-logo:hover {
  transform: scale(1.08) rotate(3deg);
}

.hero-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}


/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.6rem;
  margin-top: 2rem;
}

.feature-card {
  --feature-mouse-x: 50%;
  --feature-mouse-y: 50%;
  position: relative;
  background: linear-gradient(135deg, #014f99 0%, #003971 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(201, 152, 77, 0.2);
  padding: 0.85rem 0.5rem;
  border-radius: 0.75rem;
  text-align: center;
  transition: transform 0.15s ease, box-shadow 0.3s ease, background 0.3s ease, border-color 0.3s ease;
  animation: fadeInUp 0.8s ease forwards;
  animation-fill-mode: both;
  transform-style: preserve-3d;
  cursor: pointer;
  overflow: hidden;
}

/* Feature card glow effect on hover */
.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at var(--feature-mouse-x) var(--feature-mouse-y),
    rgba(201, 152, 77, 0.2) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border-radius: inherit;
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.15s; }
.feature-card:nth-child(3) { animation-delay: 0.2s; }
.feature-card:nth-child(4) { animation-delay: 0.25s; }
.feature-card:nth-child(5) { animation-delay: 0.3s; }
.feature-card:nth-child(6) { animation-delay: 0.35s; }

.feature-card:hover {
  background: linear-gradient(135deg, #0160b8 0%, #014f99 100%);
  border-color: rgba(201, 152, 77, 0.5);
  box-shadow: 0 10px 30px rgba(0, 57, 113, 0.3), 0 0 15px rgba(201, 152, 77, 0.15);
  transform: translateY(-2px);
}

[data-theme="dark"] .feature-card {
  background: rgba(20, 38, 64, 0.8);
  border: 1px solid rgba(201, 152, 77, 0.1);
}

[data-theme="dark"] .feature-card::before {
  background: radial-gradient(
    circle at var(--feature-mouse-x) var(--feature-mouse-y),
    rgba(201, 152, 77, 0.12) 0%,
    transparent 60%
  );
}

[data-theme="dark"] .feature-card:hover {
  background: rgba(20, 38, 64, 0.95);
  border-color: rgba(201, 152, 77, 0.3);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 5px 15px rgba(201, 152, 77, 0.1);
}

[data-theme="dark"] .feature-text {
  color: #f8e1a9;
}

.feature-text {
  position: relative;
  z-index: 1;
  font-weight: 600;
  color: #F5F4D6;
  font-size: 0.7rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

/* Spotlight Search Box */
.search-container {
  margin-top: 2.5rem;
}

.spotlight-search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 500px;
  margin: 0 auto;
  padding: 0.85rem 1.25rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(1, 79, 153, 0.15);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 57, 113, 0.08),
              0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.spotlight-search:focus-within {
  border-color: rgba(1, 79, 153, 0.35);
  box-shadow: 0 8px 30px rgba(0, 57, 113, 0.12),
              0 0 0 3px rgba(1, 79, 153, 0.1);
  transform: scale(1.02);
}

[data-theme="dark"] .spotlight-search {
  background: rgba(14, 28, 50, 0.95);
  border-color: rgba(201, 152, 77, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .spotlight-search:focus-within {
  border-color: rgba(201, 152, 77, 0.4);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4),
              0 0 0 3px rgba(201, 152, 77, 0.1);
}

.search-icon-svg {
  color: #014f99;
  flex-shrink: 0;
}

[data-theme="dark"] .search-icon-svg {
  color: #c9984d;
}

.spotlight-search .search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: #003971;
  outline: none;
}

.spotlight-search .search-input::placeholder {
  color: #4f6f8e;
}

[data-theme="dark"] .spotlight-search .search-input {
  color: #f9f2d5;
}

[data-theme="dark"] .spotlight-search .search-input::placeholder {
  color: #7A8DA0;
}

.search-kbd {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  background: rgba(1, 79, 153, 0.08);
  border: 1px solid rgba(1, 79, 153, 0.15);
  border-radius: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #014f99;
  font-family: inherit;
}

[data-theme="dark"] .search-kbd {
  background: rgba(201, 152, 77, 0.1);
  border-color: rgba(201, 152, 77, 0.2);
  color: #c9984d;
}

.spotlight-search .search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: rgba(1, 79, 153, 0.08);
  border: none;
  border-radius: 0.4rem;
  color: #014f99;
  cursor: pointer;
  transition: all 0.2s ease;
}

.spotlight-search .search-clear:hover {
  background: rgba(1, 79, 153, 0.15);
  color: #003971;
}

[data-theme="dark"] .spotlight-search .search-clear {
  background: rgba(201, 152, 77, 0.1);
  color: #c9984d;
}

[data-theme="dark"] .spotlight-search .search-clear:hover {
  background: rgba(201, 152, 77, 0.2);
}

/* Tools Section */
.tools-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
  animation: fadeIn 1s ease;
}

.section-header {
  text-align: center;
  margin-bottom: 1.5rem;
  animation: fadeInUp 0.8s ease;
}

.section-header h2 {
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-header p {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

[data-theme="dark"] .section-header p {
  color: var(--text-secondary);
}

/* Bento Grid Layout */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.bento-small {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.bento-featured {
  /* Featured card - slightly larger on desktop */
}

.bento-wide {
  /* Wide card */
}

@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .bento-featured {
    grid-column: span 2;
  }

  .bento-wide {
    grid-column: span 2;
  }
}

@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Legacy tools-grid for search results */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.tool-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  perspective: 1000px;
}

.tool-card {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 1.25rem;
  border-radius: 1rem;
  transition: transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease;
  height: 100%;
  overflow: hidden;
  transform-style: preserve-3d;
  will-change: transform;
  cursor: pointer;
}

/* Card Glow Effect */
.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(1, 79, 153, 0.12) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 0;
}

[data-theme="dark"] .card-glow {
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(201, 152, 77, 0.15) 0%,
    transparent 50%
  );
}

.tool-card-link:hover .card-glow {
  opacity: 1;
}

/* Card Arrow for Featured Cards */
.card-arrow {
  position: absolute;
  bottom: 1.25rem;
  right: 1.25rem;
  font-size: 1.5rem;
  color: var(--primary-color);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.tool-card-link:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* 3D Tilt Effect on Hover - Enhanced by JavaScript */
.tool-card-link:hover .tool-card {
  box-shadow:
    0 25px 50px rgba(0, 57, 113, 0.15),
    0 0 0 1px rgba(1, 79, 153, 0.12);
  border-color: rgba(1, 79, 153, 0.2);
}

[data-theme="dark"] .tool-card-link:hover .tool-card {
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(201, 152, 77, 0.12);
  border-color: rgba(201, 152, 77, 0.25);
}

/* Card inner content lift effect */
.tool-card-link:hover .tool-icon,
.tool-card-link:hover h3,
.tool-card-link:hover .badge-container {
  transform: translateZ(20px);
}

/* Featured Card Styles */
.bento-featured .tool-card {
  background: var(--bg-secondary);
  padding: 1.5rem;
}

[data-theme="dark"] .bento-featured .tool-card {
  background: var(--bg-secondary);
}

.bento-featured .tool-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

.bento-featured h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.bento-featured p {
  font-size: 0.85rem;
}

/* Wide Card Styles */
.bento-wide .tool-card {
  padding: 1.25rem;
}

.bento-wide .tool-icon {
  width: 2.5rem;
  height: 2.5rem;
}

.bento-wide h3 {
  font-size: 0.95rem;
}

.bento-wide p {
  font-size: 0.8rem;
}

.tool-icon {
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s ease, color 0.3s ease;
  position: relative;
  z-index: 1;
  color: var(--primary-color);
}

.tool-icon svg {
  width: 100%;
  height: 100%;
}

.tool-card-link:hover .tool-icon {
  transform: scale(1.15) rotate(5deg);
  color: var(--accent-color);
}

[data-theme="dark"] .tool-icon {
  color: var(--primary-color);
}

[data-theme="dark"] .tool-card-link:hover .tool-icon {
  color: var(--primary-light);
}

/* Badge Container */
.badge-container {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.tool-badge {
  display: inline-block;
  background: var(--gradient-1);
  color: #ffffff;
  padding: 0.2rem 0.5rem;
  border-radius: 0.3rem;
  font-size: 0.6rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.tool-card-link:hover .tool-badge {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

/* Processing Badge */
.processing-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 0.3rem;
  font-size: 0.6rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.processing-badge.browser {
  background: linear-gradient(135deg, #003971 0%, #001d3d 100%);
  color: #f8e1a9;
}

.processing-badge.server {
  background: linear-gradient(135deg, #c9984d 0%, #014f99 100%);
  color: #ffffff;
}

.tool-card-link:hover .processing-badge {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.tool-card h3 {
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
  font-weight: 600;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

.tool-card-link:hover .tool-card h3 {
  color: var(--primary-color);
}

.tool-card p {
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 0.75rem;
  position: relative;
  z-index: 1;
}

[data-theme="dark"] .tool-card p {
  color: var(--text-secondary);
}

/* SVG Card Grid */
.svg-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

@media (min-width: 768px) {
  .svg-card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .svg-card-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.svg-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  perspective: 1000px;
}

.svg-card {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  transform-style: preserve-3d;
  will-change: transform;
  cursor: pointer;
  background: transparent;
}

.svg-card img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 1rem;
  transition: transform 0.3s ease, filter 0.3s ease;
}

.svg-card-link:hover .svg-card {
  transform: translateY(-6px);
  box-shadow:
    0 20px 40px rgba(0, 57, 113, 0.18),
    0 0 0 1px rgba(1, 79, 153, 0.12);
}

[data-theme="dark"] .svg-card-link:hover .svg-card {
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(201, 152, 77, 0.15);
}

.svg-card-link:hover .svg-card img {
  transform: scale(1.03);
  filter: brightness(1.05);
}

[data-theme="dark"] .svg-card-link:hover .svg-card img {
  filter: brightness(1.1);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 2rem;
  }

  .title-word {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .section-header h2 {
    font-size: 1.25rem;
  }

  /* Bento Grid Tablet */
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: minmax(160px, auto);
  }

  .bento-small {
    grid-template-columns: repeat(3, 1fr);
  }

  .bento-featured {
    grid-column: span 2;
    grid-row: span 2;
  }

  .bento-wide {
    grid-column: span 2;
  }

  .tools-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.85rem;
  }

  /* Mesh blobs smaller on tablet */
  .mesh-blob-1 { width: 300px; height: 300px; }
  .mesh-blob-2 { width: 250px; height: 250px; }
  .mesh-blob-3 { width: 220px; height: 220px; }
  .mesh-blob-4 { width: 180px; height: 180px; }

  .features-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  /* Mobile Navigation */
  .nav-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    position: relative;
  }

  .hamburger-btn {
    display: flex;
    order: 2;
    width: 44px;
    height: 44px;
    padding: 12px 8px;
  }

  .nav-controls-desktop {
    display: none;
  }

  .nav-controls-mobile {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding-top: 1rem;
    margin-top: 0.5rem;
    border-top: 1px solid rgba(1, 79, 153, 0.12);
  }

  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
    text-align: center;
    background: rgba(249, 242, 213, 0.98);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 1rem;
    border-radius: 0 0 1rem 1rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-height: 80vh;
    overflow-y: auto;
  }

  [data-theme="dark"] .nav-links {
    background: rgba(9, 20, 40, 0.98);
  }

  .nav-links.is-open {
    display: flex;
  }

  .nav-dropdown {
    width: 100%;
  }

  .dropdown-menu {
    display: block; /* Always visible in mobile menu */
    position: relative;
    width: 100%;
    margin-top: 0.25rem;
    box-shadow: none;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 0.5rem;
    border: none;
    animation: none;
  }

  .dropdown-menu::before {
    display: none;
  }

  [data-theme="dark"] .dropdown-menu {
    background: rgba(255, 255, 255, 0.05);
  }

  .nav-dropdown > .nav-link {
    padding-bottom: 0.5rem;
    font-weight: 600;
    pointer-events: none; /* Disable parent link click on mobile */
  }

  .nav-link {
    padding: 0.75rem 1rem;
    display: block;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dropdown-item {
    padding: 0.6rem 1rem 0.6rem 1.5rem;
    min-height: 44px; /* Minimum touch target size */
    display: flex;
    align-items: center;
  }

  .hero {
    padding: 3rem 1.25rem;
    border-radius: 1.5rem;
    margin: 1rem;
    margin-bottom: 2rem;
  }

  .hero-logo {
    width: 90px;
    height: 90px;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .title-word {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 0.9rem;
  }

  /* Features Grid Mobile */
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .feature-card {
    padding: 0.65rem 0.4rem;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .feature-text {
    font-size: 0.6rem;
  }

  /* Bento Grid Mobile */
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: minmax(140px, auto);
    gap: 0.75rem;
  }

  .bento-small {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento-featured {
    grid-column: span 2;
    grid-row: span 1;
  }

  .bento-featured .tool-icon {
    font-size: 2.5rem;
  }

  .bento-featured h3 {
    font-size: 1rem;
  }

  .bento-featured p {
    font-size: 0.8rem;
  }

  .bento-wide {
    grid-column: span 2;
  }

  .bento-wide .tool-card {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .bento-wide .tool-icon {
    font-size: 2rem;
  }

  .tools-section {
    padding: 1.5rem 1rem;
  }

  .section-header h2 {
    font-size: 1.1rem;
  }

  .section-header p {
    font-size: 0.75rem;
  }

  .svg-card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .tool-card {
    padding: 1rem;
  }

  .tool-icon {
    font-size: 1.75rem;
  }

  /* Spotlight Search Mobile */
  .spotlight-search {
    padding: 0.75rem 1rem;
  }

  .spotlight-search .search-input {
    font-size: 16px; /* Prevents iOS auto-zoom on focus */
  }

  .search-kbd {
    display: none;
  }

  /* Mesh blobs smaller on mobile */
  .mesh-blob-1 { width: 200px; height: 200px; top: -50px; left: -50px; }
  .mesh-blob-2 { width: 180px; height: 180px; }
  .mesh-blob-3 { width: 150px; height: 150px; }
  .mesh-blob-4 { width: 120px; height: 120px; }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 0.5rem;
  }

  .logo {
    font-size: 0.95rem;
  }

  .logo-icon {
    height: 20px;
    width: 20px;
  }

  .logo-flag-icon {
    height: 16px;
    width: 16px;
  }

  .hero {
    padding: 2rem 1rem;
    margin: 0.75rem;
    border-radius: 1.25rem;
  }

  .hero-logo {
    width: 80px;
    height: 80px;
  }

  @keyframes logoFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  .hero-title {
    font-size: 1.35rem;
  }

  .title-word {
    font-size: 1.35rem;
  }

  .hero-subtitle {
    font-size: 0.8rem;
  }

  /* Features Grid Small Mobile */
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.4rem;
  }

  .feature-card {
    padding: 0.55rem 0.4rem;
  }

  .feature-text {
    font-size: 0.55rem;
  }

  /* Bento Grid Small Mobile */
  .bento-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 0.6rem;
  }

  .bento-small {
    grid-template-columns: 1fr;
  }

  .bento-featured,
  .bento-wide {
    grid-column: span 1;
    grid-row: span 1;
  }

  .bento-featured .tool-card,
  .bento-wide .tool-card {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }

  .bento-featured .tool-icon,
  .bento-wide .tool-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .bento-featured h3,
  .bento-wide h3 {
    font-size: 0.9rem;
  }

  .bento-featured p,
  .bento-wide p {
    font-size: 0.7rem;
  }

  .card-arrow {
    display: none;
  }

  .tools-section {
    padding: 1.25rem 0.75rem;
  }

  .svg-card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .tools-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .tool-card {
    padding: 0.85rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
  }

  .tool-icon {
    font-size: 1.75rem;
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .tool-card h3 {
    font-size: 0.8rem;
  }

  .tool-card p {
    font-size: 0.7rem;
    line-height: 1.4;
  }

  .tool-badge,
  .processing-badge {
    font-size: 0.5rem;
    padding: 0.15rem 0.35rem;
  }

  .badge-container {
    margin-bottom: 0.25rem;
  }

  /* Spotlight Search Small Mobile */
  .spotlight-search {
    padding: 0.65rem 0.85rem;
    border-radius: 0.75rem;
  }

  .search-icon-svg {
    width: 18px;
    height: 18px;
  }

  .spotlight-search .search-input {
    font-size: 0.9rem;
  }

  /* Mesh blobs minimal on small mobile */
  .mesh-blob {
    filter: blur(40px);
    opacity: 0.4;
  }
  .mesh-blob-1 { width: 150px; height: 150px; }
  .mesh-blob-2 { width: 120px; height: 120px; }
  .mesh-blob-3 { width: 100px; height: 100px; }
  .mesh-blob-4 { display: none; }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
  overflow-x: hidden;
}

body {
  overflow-x: hidden;
}

/* Better focus styles for accessibility */
a:focus,
button:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Performance optimization */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Disable 3D tilt and hover effects on touch devices */
@media (hover: none) and (pointer: coarse) {
  .tool-card {
    transform: none !important;
  }

  .feature-card {
    transform: none !important;
  }

  .tool-card-link:hover .tool-icon,
  .tool-card-link:hover h3,
  .tool-card-link:hover .badge-container {
    transform: none;
  }

  .card-glow {
    display: none;
  }

  .feature-card::before {
    display: none;
  }

  .mouse-spotlight {
    display: none;
  }

  .svg-card {
    transform: none !important;
  }
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .mesh-blob,
  .floating-icon,
  .hero-logo {
    animation: none !important;
  }

  .scroll-reveal {
    opacity: 1 !important;
    transform: none !important;
  }
}

/* Search Box Styles */
.search-container {
  margin-top: 2rem;
  position: relative;
  z-index: 1;
}

.search-box {
  display: flex;
  align-items: center;
  max-width: 400px;
  margin: 0 auto;
  background: rgba(1, 79, 153, 0.05);
  border: 1px solid rgba(1, 79, 153, 0.15);
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
}

.search-box:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(1, 79, 153, 0.12);
  background: rgba(1, 79, 153, 0.08);
}

[data-theme="dark"] .search-box {
  background: rgba(201, 152, 77, 0.05);
  border-color: rgba(201, 152, 77, 0.2);
}

[data-theme="dark"] .search-box:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(201, 152, 77, 0.15);
  background: rgba(201, 152, 77, 0.1);
}

.search-icon {
  font-size: 1rem;
  margin-right: 0.5rem;
  opacity: 0.7;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 0.9rem;
  outline: none;
  padding: 0.3rem 0;
}

.search-input::placeholder {
  color: var(--text-muted);
}

[data-theme="dark"] .search-input::placeholder {
  color: var(--text-muted);
}

.search-clear {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.2rem 0.4rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.search-clear:hover {
  color: var(--text-color);
  background: rgba(1, 79, 153, 0.1);
}

[data-theme="dark"] .search-clear:hover {
  background: rgba(201, 152, 77, 0.15);
}

/* Search Results Section */
.search-results-section {
  border: 2px dashed var(--primary-color);
  border-radius: 1rem;
  margin: 1rem auto;
  padding: 1.5rem !important;
  background: rgba(1, 79, 153, 0.03);
}

[data-theme="dark"] .search-results-section {
  background: rgba(201, 152, 77, 0.03);
}

.no-results {
  color: var(--text-muted);
  font-style: italic;
}

/* Scroll to Top Button */
.scroll-to-top {
  position: fixed;
  bottom: 6rem;
  right: 1.5rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: none;
  background: var(--gradient-1);
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scroll-to-top:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-xl);
}

.scroll-to-top:active {
  transform: translateY(0) scale(0.98);
}

[data-theme="dark"] .scroll-to-top {
  box-shadow: 0 4px 15px rgba(201, 152, 77, 0.3);
}

[data-theme="dark"] .scroll-to-top:hover {
  box-shadow: 0 6px 20px rgba(201, 152, 77, 0.4);
}

/* Vue Transition for Scroll to Top */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Scroll Reveal Animations */
.scroll-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered animation for tool cards */
.tools-grid .scroll-reveal:nth-child(1) { transition-delay: 0.05s; }
.tools-grid .scroll-reveal:nth-child(2) { transition-delay: 0.1s; }
.tools-grid .scroll-reveal:nth-child(3) { transition-delay: 0.15s; }
.tools-grid .scroll-reveal:nth-child(4) { transition-delay: 0.2s; }
.tools-grid .scroll-reveal:nth-child(5) { transition-delay: 0.25s; }
.tools-grid .scroll-reveal:nth-child(6) { transition-delay: 0.3s; }
.tools-grid .scroll-reveal:nth-child(7) { transition-delay: 0.35s; }
.tools-grid .scroll-reveal:nth-child(8) { transition-delay: 0.4s; }
.tools-grid .scroll-reveal:nth-child(9) { transition-delay: 0.45s; }
.tools-grid .scroll-reveal:nth-child(10) { transition-delay: 0.5s; }
.tools-grid .scroll-reveal:nth-child(11) { transition-delay: 0.55s; }
.tools-grid .scroll-reveal:nth-child(12) { transition-delay: 0.6s; }

.svg-card-grid .scroll-reveal:nth-child(1) { transition-delay: 0.05s; }
.svg-card-grid .scroll-reveal:nth-child(2) { transition-delay: 0.1s; }
.svg-card-grid .scroll-reveal:nth-child(3) { transition-delay: 0.15s; }
.svg-card-grid .scroll-reveal:nth-child(4) { transition-delay: 0.2s; }
.svg-card-grid .scroll-reveal:nth-child(5) { transition-delay: 0.25s; }
.svg-card-grid .scroll-reveal:nth-child(6) { transition-delay: 0.3s; }
.svg-card-grid .scroll-reveal:nth-child(7) { transition-delay: 0.35s; }
.svg-card-grid .scroll-reveal:nth-child(8) { transition-delay: 0.4s; }
.svg-card-grid .scroll-reveal:nth-child(9) { transition-delay: 0.45s; }
.svg-card-grid .scroll-reveal:nth-child(10) { transition-delay: 0.5s; }
.svg-card-grid .scroll-reveal:nth-child(11) { transition-delay: 0.55s; }
.svg-card-grid .scroll-reveal:nth-child(12) { transition-delay: 0.6s; }

/* Mobile adjustments for new features */
@media (max-width: 768px) {
  .search-box {
    max-width: 100%;
  }

  .search-results-section {
    margin: 0.75rem 1rem;
    padding: 1rem !important;
    border-radius: 0.75rem;
  }

  .search-results-section .section-header h2 {
    font-size: 1rem;
  }

  .search-results-section .section-header p {
    font-size: 0.75rem;
  }

  .scroll-to-top {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1rem;
    bottom: 5.5rem;
    right: 1rem;
  }
}

@media (max-width: 480px) {
  .search-container {
    margin-top: 1.5rem;
  }

  .search-box {
    padding: 0.4rem 0.8rem;
  }

  .search-input {
    font-size: 0.8rem;
  }

  .search-icon {
    font-size: 0.9rem;
  }

  .search-results-section {
    margin: 0.5rem 0.75rem;
    padding: 0.75rem !important;
  }

  .scroll-to-top {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 0.9rem;
    bottom: 5rem;
    right: 0.75rem;
  }
}

</style>
