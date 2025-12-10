<template>
  <div id="app">
    <!-- Header -->
    <header class="header">
      <nav class="nav-container">
        <div class="logo">{{ $t('footer.company') }}</div>
        
        <div class="nav-links">
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

          <a href="https://kodinitools.com/kontaktformular/" class="nav-link">{{ $t('navigation.contact') }}</a>
        </div>
        
        <div class="nav-controls">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </nav>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <!-- Promo Section with Logo -->
      <div class="hero-promo">
        <div class="hero-logo">
          <img src="https://kodinitools.com/images/logo.svg" alt="KodiniTools Logo" />
        </div>
        <h1 class="hero-title">{{ $t('hero.title') }}</h1>
        <p class="hero-subtitle">{{ $t('hero.subtitle') }}</p>
      </div>

      <!-- Features -->
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">✓</div>
          <div class="feature-text">{{ $t('hero.features.free') }}</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <div class="feature-text">{{ $t('hero.features.privacy') }}</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🌐</div>
          <div class="feature-text">{{ $t('hero.features.browserBased') }}</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🖥️</div>
          <div class="feature-text">{{ $t('hero.features.serverBased') }}</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🌍</div>
          <div class="feature-text">{{ $t('hero.features.multiLanguage') }}</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📦</div>
          <div class="feature-text">{{ $t('hero.features.noInstall') }}</div>
        </div>
      </div>

      <!-- Search Box -->
      <div class="search-container">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search.placeholder')"
            class="search-input"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="search-clear"
            :aria-label="$t('search.clear')"
          >✕</button>
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

      <div v-if="!showNoResults" class="tools-grid">
        <a
          v-for="tool in filteredTools"
          :key="tool.key"
          :href="$t(`${tool.key}.link`)"
          class="tool-card-link"
        >
          <div class="tool-card">
            <div class="tool-icon">{{ tool.icon }}</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t(`${tool.key}.badge`) }}</span>
              <span :class="['processing-badge', $t(`${tool.key}.processing`)]">
                {{ $t('tools.processingBadge.' + $t(`${tool.key}.processing`)) }}
              </span>
            </div>
            <h3>{{ $t(`${tool.key}.title`) }}</h3>
            <p>{{ $t(`${tool.key}.description`) }}</p>
          </div>
        </a>
      </div>
    </section>

    <!-- Audio Tools Section -->
    <section class="tools-section">
      <div class="section-header">
        <h2>{{ $t('tools.sectionTitle') }}</h2>
        <p>{{ $t('tools.sectionDescription') }}</p>
      </div>
      
      <div class="tools-grid">
        <!-- Audio Konverter -->
        <a :href="$t('tools.audioConverter.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🎵</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.audioConverter.badge') }}</span>
              <span :class="['processing-badge', $t('tools.audioConverter.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.audioConverter.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.audioConverter.title') }}</h3>
            <p>{{ $t('tools.audioConverter.description') }}</p>
          </div>
        </a>
        
        <!-- 19-Band EQ Pro -->
        <a :href="$t('tools.audioEqualizer.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🎚️</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.audioEqualizer.badge') }}</span>
              <span :class="['processing-badge', $t('tools.audioEqualizer.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.audioEqualizer.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.audioEqualizer.title') }}</h3>
            <p>{{ $t('tools.audioEqualizer.description') }}</p>
          </div>
        </a>
        
        <!-- Musikplayer -->
        <a :href="$t('tools.musicPlayer.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🎧</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.musicPlayer.badge') }}</span>
              <span :class="['processing-badge', $t('tools.musicPlayer.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.musicPlayer.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.musicPlayer.title') }}</h3>
            <p>{{ $t('tools.musicPlayer.description') }}</p>
          </div>
        </a>
        
        <!-- Audio Visualizer -->
        <a :href="$t('tools.audioVisualizer.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🎬</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.audioVisualizer.badge') }}</span>
              <span :class="['processing-badge', $t('tools.audioVisualizer.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.audioVisualizer.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.audioVisualizer.title') }}</h3>
            <p>{{ $t('tools.audioVisualizer.description') }}</p>
          </div>
        </a>

        <!-- MP3 Konverter -->
        <a :href="$t('tools.mp3Converter.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🎼</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.mp3Converter.badge') }}</span>
              <span :class="['processing-badge', $t('tools.mp3Converter.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.mp3Converter.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.mp3Converter.title') }}</h3>
            <p>{{ $t('tools.mp3Converter.description') }}</p>
          </div>
        </a>

        <!-- Interaktiver Audio Equalizer -->
        <a :href="$t('tools.interactiveEqualizer.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🎛️</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.interactiveEqualizer.badge') }}</span>
              <span :class="['processing-badge', $t('tools.interactiveEqualizer.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.interactiveEqualizer.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.interactiveEqualizer.title') }}</h3>
            <p>{{ $t('tools.interactiveEqualizer.description') }}</p>
          </div>
        </a>

        <!-- Moderner Musikplayer -->
        <a :href="$t('tools.modernPlayer.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🎶</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.modernPlayer.badge') }}</span>
              <span :class="['processing-badge', $t('tools.modernPlayer.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.modernPlayer.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.modernPlayer.title') }}</h3>
            <p>{{ $t('tools.modernPlayer.description') }}</p>
          </div>
        </a>

        <!-- Audioplaylist Generator -->
        <a :href="$t('tools.playlistGenerator.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">📃</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.playlistGenerator.badge') }}</span>
              <span :class="['processing-badge', $t('tools.playlistGenerator.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.playlistGenerator.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.playlistGenerator.title') }}</h3>
            <p>{{ $t('tools.playlistGenerator.description') }}</p>
          </div>
        </a>

        <!-- Alarmtool -->
        <a :href="$t('tools.alarmTool.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">⏰</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.alarmTool.badge') }}</span>
              <span :class="['processing-badge', $t('tools.alarmTool.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.alarmTool.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.alarmTool.title') }}</h3>
            <p>{{ $t('tools.alarmTool.description') }}</p>
          </div>
        </a>

        <!-- Audio Normalizer -->
        <a :href="$t('tools.audioNormalizer.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">📊</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.audioNormalizer.badge') }}</span>
              <span :class="['processing-badge', $t('tools.audioNormalizer.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.audioNormalizer.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.audioNormalizer.title') }}</h3>
            <p>{{ $t('tools.audioNormalizer.description') }}</p>
          </div>
        </a>

        <!-- Playlist zu WebM Konverter -->
        <a :href="$t('tools.playlistToWebm.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">📼</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.playlistToWebm.badge') }}</span>
              <span :class="['processing-badge', $t('tools.playlistToWebm.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.playlistToWebm.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.playlistToWebm.title') }}</h3>
            <p>{{ $t('tools.playlistToWebm.description') }}</p>
          </div>
        </a>
      </div>
    </section>

    <!-- Image Tools Section -->
    <section class="tools-section">
      <div class="section-header">
        <h2>{{ $t('imageTools.sectionTitle') }}</h2>
        <p>{{ $t('imageTools.sectionDescription') }}</p>
      </div>
      
      <div class="tools-grid">
        <!-- Bildkonverter -->
        <a :href="$t('imageTools.imageConverter.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🖼️</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('imageTools.imageConverter.badge') }}</span>
              <span :class="['processing-badge', $t('imageTools.imageConverter.processing')]">
                {{ $t('tools.processingBadge.' + $t('imageTools.imageConverter.processing')) }}
              </span>
            </div>
            <h3>{{ $t('imageTools.imageConverter.title') }}</h3>
            <p>{{ $t('imageTools.imageConverter.description') }}</p>
          </div>
        </a>
        
        <!-- Batch Bildbearbeitung -->
        <a :href="$t('imageTools.batchImageEditor.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">📸</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('imageTools.batchImageEditor.badge') }}</span>
              <span :class="['processing-badge', $t('imageTools.batchImageEditor.processing')]">
                {{ $t('tools.processingBadge.' + $t('imageTools.batchImageEditor.processing')) }}
              </span>
            </div>
            <h3>{{ $t('imageTools.batchImageEditor.title') }}</h3>
            <p>{{ $t('imageTools.batchImageEditor.description') }}</p>
          </div>
        </a>

        <!-- Fotocollage -->
        <a :href="$t('imageTools.photoCollage.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🎨</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('imageTools.photoCollage.badge') }}</span>
              <span :class="['processing-badge', $t('imageTools.photoCollage.processing')]">
                {{ $t('tools.processingBadge.' + $t('imageTools.photoCollage.processing')) }}
              </span>
            </div>
            <h3>{{ $t('imageTools.photoCollage.title') }}</h3>
            <p>{{ $t('imageTools.photoCollage.description') }}</p>
          </div>
        </a>
      </div>
    </section>

    <!-- Diverse Tools Section -->
    <section class="tools-section">
      <div class="section-header">
        <h2>{{ $t('diverseTools.sectionTitle') }}</h2>
        <p>{{ $t('diverseTools.sectionDescription') }}</p>
      </div>

      <div class="tools-grid">
        <!-- Kodini Color Extractor -->
        <a :href="$t('diverseTools.colorExtractor.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🎨</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('diverseTools.colorExtractor.badge') }}</span>
              <span :class="['processing-badge', $t('diverseTools.colorExtractor.processing')]">
                {{ $t('tools.processingBadge.' + $t('diverseTools.colorExtractor.processing')) }}
              </span>
            </div>
            <h3>{{ $t('diverseTools.colorExtractor.title') }}</h3>
            <p>{{ $t('diverseTools.colorExtractor.description') }}</p>
          </div>
        </a>

        <!-- Videokonverter -->
        <a :href="$t('diverseTools.videoConverter.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="tool-icon">🎬</div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('diverseTools.videoConverter.badge') }}</span>
              <span :class="['processing-badge', $t('diverseTools.videoConverter.processing')]">
                {{ $t('tools.processingBadge.' + $t('diverseTools.videoConverter.processing')) }}
              </span>
            </div>
            <h3>{{ $t('diverseTools.videoConverter.title') }}</h3>
            <p>{{ $t('diverseTools.videoConverter.description') }}</p>
          </div>
        </a>
      </div>
    </section>

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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import DonateButton from './components/DonateButton.vue'

const { t } = useI18n()

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

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Intersection Observer for scroll animations
const observeElements = () => {
  if (typeof window === 'undefined') return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )

  document.querySelectorAll('.tools-section, .tool-card-link').forEach((el) => {
    el.classList.add('scroll-reveal')
    observer.observe(el)
  })
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll)
    // Delay observer setup to ensure DOM is ready
    setTimeout(observeElements, 100)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* New Color Palette */
  --color-gold: #F2E28E;
  --color-mauve: #A28680;
  --color-slate: #5E5F69;
  --color-silver: #AEAFB7;
  --color-dark: #0C0C10;

  /* Light Theme */
  --bg-color: #fafafa;
  --bg-secondary: #ffffff;
  --text-color: #0C0C10;
  --text-secondary: #5E5F69;
  --text-muted: #AEAFB7;
  --border-color: #AEAFB7;
  --primary-color: #A28680;
  --primary-dark: #8a706b;
  --primary-light: #b89d97;
  --accent-color: #F2E28E;
  --gradient-1: linear-gradient(135deg, #A28680 0%, #5E5F69 100%);
  --gradient-2: linear-gradient(135deg, #F2E28E 0%, #A28680 100%);
  --gradient-3: linear-gradient(135deg, #5E5F69 0%, #0C0C10 100%);
  --gradient-hero: linear-gradient(135deg, #A28680 0%, #5E5F69 50%, #0C0C10 100%);
  --shadow-sm: 0 1px 2px 0 rgba(12, 12, 16, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(12, 12, 16, 0.08);
  --shadow-lg: 0 10px 15px -3px rgba(12, 12, 16, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(12, 12, 16, 0.12);
}

[data-theme="dark"] {
  --bg-color: #0C0C10;
  --bg-secondary: #16161c;
  --text-color: #fafafa;
  --text-secondary: #AEAFB7;
  --text-muted: #5E5F69;
  --border-color: #5E5F69;
  --primary-color: #F2E28E;
  --primary-dark: #d9cb7f;
  --primary-light: #f5e9a8;
  --accent-color: #A28680;
  --gradient-1: linear-gradient(135deg, #F2E28E 0%, #A28680 100%);
  --gradient-2: linear-gradient(135deg, #A28680 0%, #5E5F69 100%);
  --gradient-3: linear-gradient(135deg, #5E5F69 0%, #AEAFB7 100%);
  --gradient-hero: linear-gradient(135deg, #0C0C10 0%, #5E5F69 50%, #A28680 100%);
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
    box-shadow: 0 0 20px rgba(242, 226, 142, 0.15),
                0 0 40px rgba(242, 226, 142, 0.1),
                0 0 60px rgba(242, 226, 142, 0.05);
  }
  50% {
    box-shadow: 0 0 30px rgba(242, 226, 142, 0.25),
                0 0 60px rgba(242, 226, 142, 0.15),
                0 0 90px rgba(242, 226, 142, 0.1);
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
  background: var(--bg-color);
  color: var(--text-color);
  transition: background 0.3s ease, color 0.3s ease;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  animation: fadeIn 0.6s ease-in;
}

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

[data-theme="dark"] .header {
  background: rgba(12, 12, 16, 0.9);
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
  background: rgba(255, 255, 255, 0.95);
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
  background: rgba(22, 22, 28, 0.98);
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
  background: linear-gradient(135deg, rgba(162, 134, 128, 0.15) 0%, rgba(94, 95, 105, 0.15) 100%);
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

/* Hero */
.hero {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 3.5rem 2rem;
  text-align: center;
  background: #ffffff;
  border-radius: 0 0 1.5rem 1.5rem;
  margin-bottom: 2.5rem;
  overflow: hidden;
  border: 1px solid rgba(162, 134, 128, 0.2);
  box-shadow: 0 4px 20px rgba(162, 134, 128, 0.1),
              0 8px 40px rgba(94, 95, 105, 0.05);
  animation: lightGlowPulse 4s ease-in-out infinite;
}

@keyframes lightGlowPulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(162, 134, 128, 0.1),
                0 8px 40px rgba(94, 95, 105, 0.05);
  }
  50% {
    box-shadow: 0 4px 30px rgba(162, 134, 128, 0.2),
                0 8px 50px rgba(94, 95, 105, 0.1);
  }
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 30%, rgba(162, 134, 128, 0.08) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(94, 95, 105, 0.06) 0%, transparent 40%);
  pointer-events: none;
}

.hero::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(162, 134, 128, 0.08),
    transparent
  );
  animation: shimmer 8s ease-in-out infinite;
  pointer-events: none;
}

[data-theme="dark"] .hero {
  background: #201e22;
  animation: glowPulse 4s ease-in-out infinite;
  border: 1px solid rgba(242, 226, 142, 0.2);
}

[data-theme="dark"] .hero::before {
  background: radial-gradient(circle at 20% 30%, rgba(242, 226, 142, 0.08) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(162, 134, 128, 0.08) 0%, transparent 40%);
  animation: none;
}

[data-theme="dark"] .hero::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(242, 226, 142, 0.05),
    transparent
  );
  animation: shimmer 8s ease-in-out infinite;
  pointer-events: none;
}

[data-theme="dark"] .hero-title {
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: #F2E28E;
  background-clip: unset;
  color: #F2E28E;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .hero-subtitle {
  color: #f5e9a8;
}

.hero-title {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #5E5F69 0%, #0C0C10 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fadeInUp 0.8s ease;
  position: relative;
  z-index: 1;
  letter-spacing: 0.01em;
}

.hero-subtitle {
  font-size: 0.95rem;
  color: #5E5F69;
  margin-bottom: 0;
  animation: fadeInUp 1s ease;
  position: relative;
  z-index: 1;
  font-weight: 500;
}

/* Hero Promo Section with Logo */
.hero-promo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
  text-align: center;
}

.hero-logo {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(162, 134, 128, 0.08);
  border-radius: 1rem;
  padding: 0.75rem;
  border: 1px solid rgba(162, 134, 128, 0.15);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease;
  margin-bottom: 0.5rem;
}

.hero-logo:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(162, 134, 128, 0.2);
}

.hero-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

[data-theme="dark"] .hero-logo {
  background: rgba(242, 226, 142, 0.08);
  border-color: rgba(242, 226, 142, 0.2);
}

[data-theme="dark"] .hero-logo:hover {
  box-shadow: 0 8px 25px rgba(242, 226, 142, 0.2);
}

.hero-promo .hero-title {
  margin-bottom: 0.5rem;
}

.hero-promo .hero-subtitle {
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.6rem;
  margin-top: 2rem;
  position: relative;
  z-index: 1;
}

.feature-card {
  background: rgba(162, 134, 128, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(162, 134, 128, 0.15);
  padding: 0.85rem;
  border-radius: 0.65rem;
  text-align: center;
  transition: all 0.3s ease;
  animation: fadeInUp 1.2s ease;
  animation-fill-mode: both;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.2s; }
.feature-card:nth-child(3) { animation-delay: 0.3s; }
.feature-card:nth-child(4) { animation-delay: 0.4s; }
.feature-card:nth-child(5) { animation-delay: 0.5s; }
.feature-card:nth-child(6) { animation-delay: 0.6s; }

.feature-card:hover {
  transform: translateY(-5px) scale(1.02);
  background: rgba(162, 134, 128, 0.15);
  border-color: rgba(162, 134, 128, 0.3);
  box-shadow: 0 8px 25px rgba(162, 134, 128, 0.2);
}

[data-theme="dark"] .feature-card {
  background: rgba(242, 226, 142, 0.05);
  border: 1px solid rgba(242, 226, 142, 0.15);
  transition: all 0.3s ease;
}

[data-theme="dark"] .feature-card:hover {
  background: rgba(242, 226, 142, 0.12);
  border-color: rgba(242, 226, 142, 0.3);
  box-shadow: 0 0 20px rgba(242, 226, 142, 0.15);
  transform: translateY(-5px) scale(1.02);
}

[data-theme="dark"] .feature-text {
  color: #f5e9a8;
}

.feature-icon {
  font-size: 1.5rem;
  margin-bottom: 0.3rem;
  animation: float 3s ease-in-out infinite;
}

.feature-text {
  font-weight: 500;
  color: #5E5F69;
  font-size: 0.7rem;
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

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.tool-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.tool-card {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 1.1rem;
  border-radius: 0.75rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  overflow: hidden;
}

.tool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--gradient-1);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 0;
}

.tool-card-link:hover .tool-card {
  transform: translateY(-4px) scale(1.01);
  box-shadow: var(--shadow-lg);
  border-color: transparent;
}

.tool-card-link:hover .tool-card::before {
  opacity: 0.05;
}

.tool-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: inline-block;
  transition: transform 0.4s ease;
  position: relative;
  z-index: 1;
}

.tool-card-link:hover .tool-icon {
  transform: scale(1.08) rotate(3deg);
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
  background: linear-gradient(135deg, #5E5F69 0%, #0C0C10 100%);
  color: #F2E28E;
}

.processing-badge.server {
  background: linear-gradient(135deg, #F2E28E 0%, #A28680 100%);
  color: #0C0C10;
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

/* Responsive Design */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 0.9rem;
  }

  .section-header h2 {
    font-size: 1.25rem;
  }

  .tools-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.85rem;
  }
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0 1rem;
  }

  .nav-links {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    text-align: center;
  }

  .nav-dropdown {
    width: 100%;
  }

  .dropdown-menu {
    position: relative;
    width: 100%;
    margin-top: 0.25rem;
  }

  .hero {
    padding: 2.5rem 1.25rem;
    border-radius: 0 0 1rem 1rem;
  }

  .hero-logo {
    width: 80px;
    height: 80px;
    padding: 0.6rem;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-subtitle {
    font-size: 0.85rem;
  }

  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 0.5rem;
  }

  .feature-card {
    padding: 0.65rem;
  }

  .feature-icon {
    font-size: 1.25rem;
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

  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .tool-card {
    padding: 0.85rem;
  }

  .tool-icon {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 0.5rem;
  }

  .logo {
    font-size: 0.95rem;
  }

  .hero {
    padding: 2rem 0.85rem;
  }

  .hero-logo {
    width: 70px;
    height: 70px;
    padding: 0.5rem;
    border-radius: 0.75rem;
  }

  .hero-title {
    font-size: 1.15rem;
  }

  .hero-subtitle {
    font-size: 0.7rem;
  }

  .features-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }

  .feature-card {
    padding: 0.5rem;
  }

  .feature-icon {
    font-size: 1rem;
  }

  .feature-text {
    font-size: 0.55rem;
  }

  .tools-section {
    padding: 1.25rem 0.75rem;
  }

  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .tool-card {
    padding: 0.65rem;
  }

  .tool-icon {
    font-size: 1.5rem;
  }

  .tool-card h3 {
    font-size: 0.75rem;
  }

  .tool-card p {
    font-size: 0.65rem;
    line-height: 1.4;
  }

  .tool-badge,
  .processing-badge {
    font-size: 0.5rem;
    padding: 0.15rem 0.35rem;
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
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
  background: rgba(162, 134, 128, 0.08);
  border: 1px solid rgba(162, 134, 128, 0.2);
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
}

.search-box:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(162, 134, 128, 0.15);
  background: rgba(162, 134, 128, 0.12);
}

[data-theme="dark"] .search-box {
  background: rgba(242, 226, 142, 0.05);
  border-color: rgba(242, 226, 142, 0.2);
}

[data-theme="dark"] .search-box:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(242, 226, 142, 0.15);
  background: rgba(242, 226, 142, 0.1);
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
  background: rgba(162, 134, 128, 0.15);
}

[data-theme="dark"] .search-clear:hover {
  background: rgba(242, 226, 142, 0.15);
}

/* Search Results Section */
.search-results-section {
  border: 2px dashed var(--primary-color);
  border-radius: 1rem;
  margin: 1rem auto;
  padding: 1.5rem !important;
  background: rgba(162, 134, 128, 0.03);
}

[data-theme="dark"] .search-results-section {
  background: rgba(242, 226, 142, 0.03);
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
  box-shadow: 0 4px 15px rgba(242, 226, 142, 0.3);
}

[data-theme="dark"] .scroll-to-top:hover {
  box-shadow: 0 6px 20px rgba(242, 226, 142, 0.4);
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

/* Mobile adjustments for new features */
@media (max-width: 768px) {
  .search-box {
    max-width: 100%;
  }

  .scroll-to-top {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1rem;
    bottom: 5rem;
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

  .scroll-to-top {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 0.9rem;
    bottom: 4.5rem;
  }
}

</style>
