<template>
  <header class="header">
    <nav class="nav-container">
      <div class="logo" @click="emit('goHome')" style="cursor: pointer;">
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
        <a @click.prevent="emit('toggleFaq'); closeMobileMenu()" href="#faq" class="nav-link faq-link">FAQ</a>
        <a @click.prevent="emit('toggleBlog'); closeMobileMenu()" href="#blog" class="nav-link blog-link">{{ $t('navigation.blog') }}</a>

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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import ThemeToggle from './ThemeToggle.vue'

const emit = defineEmits<{
  toggleBlog: []
  toggleFaq: []
  goHome: []
}>()

const mobileMenuOpen = ref(false)
const toggleMobileMenu = () => { mobileMenuOpen.value = !mobileMenuOpen.value }
const closeMobileMenu = () => { mobileMenuOpen.value = false }
</script>
