<template>
  <div id="app">
    <!-- Header -->
    <header class="header">
      <nav class="nav-container">
        <div class="logo">{{ $t('footer.company') }}</div>
        
        <div class="nav-links">
          <!-- Tools Dropdown -->
          <div class="nav-dropdown">
            <a href="#" class="nav-link">
              {{ $t('navigation.tools') }} ▾
            </a>
            <div class="dropdown-menu">
              <a href="https://kodinitools.com/mp3konverter/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.mp3Converter') }}
              </a>
              <a href="https://kodinitools.com/audioequalizer/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.audioEqualizer') }}
              </a>
              <a href="https://kodinitools.com/modernermusikplayer/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.modernPlayer') }}
              </a>
              <a href="https://kodinitools.com/ultimativermusikplayer/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.ultimatePlayer') }}
              </a>
              <a href="https://kodinitools.com/playlist_generator/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.playlistGenerator') }}
              </a>
              <a href="https://kodinitools.com/alarmtool/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.alarmTool') }}
              </a>
              <a href="https://kodinitools.com/audionormalisierer/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.audioNormalizer') }}
              </a>
              <a href="https://kodinitools.com/visualizer/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.visualizer') }}
              </a>
              <a href="https://kodinitools.com/equaliser19/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.equalizer19') }}
              </a>
              <a href="https://kodinitools.com/audiokonverter/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.audioConverter') }}
              </a>
              <a href="https://kodinitools.com/bildkonverter/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.imageConverter') }}
              </a>
              <a href="https://kodinitools.com/bilderseriebearbeiten/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.batchImageEditor') }}
              </a>
            </div>
          </div>
          
          <a href="https://kodinitools.com/ueberuns/" class="nav-link">{{ $t('navigation.about') }}</a>
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
      <h1 class="hero-title">{{ $t('hero.title') }}</h1>
      <p class="hero-subtitle">{{ $t('hero.subtitle') }}</p>
      
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
      </div>
    </section>

    <!-- PayPal Donate Button -->
    <DonateButton />
  </div>
</template>

<script setup lang="ts">
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import DonateButton from './components/DonateButton.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-color: #ffffff;
  --text-color: #1f2937;
  --border-color: #e5e7eb;
}

[data-theme="dark"] {
  --bg-color: #1f2937;
  --text-color: #f9fafb;
  --border-color: #374151;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-color);
  color: var(--text-color);
  transition: background 0.3s, color 0.3s;
}

#app {
  min-height: 100vh;
}

/* Header */
.header {
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
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
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--text-color);
  transition: color 0.2s;
  cursor: pointer;
}

.nav-link:hover {
  color: #3b82f6;
}

/* Dropdown Navigation */
.nav-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  min-width: 250px;
  z-index: 1000;
  margin-top: 0;
  padding-top: 0.5rem;
}

.nav-dropdown:hover .dropdown-menu,
.dropdown-menu:hover {
  display: block;
}

.dropdown-item {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.dropdown-item:first-child {
  border-radius: 0.5rem 0.5rem 0 0;
}

.dropdown-item:last-child {
  border-radius: 0 0 0.5rem 0.5rem;
}

.nav-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Hero */
.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 2rem;
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  font-weight: bold;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 4rem;
}

.feature-card {
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  border-radius: 0.5rem;
  text-align: center;
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.feature-text {
  font-weight: 600;
}

/* Tools Section */
.tools-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-header h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.section-header p {
  font-size: 1.25rem;
  color: #6b7280;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.tool-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.tool-card {
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  border-radius: 0.5rem;
  transition: box-shadow 0.2s, transform 0.2s;
  height: 100%;
}

.tool-card-link:hover .tool-card {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.tool-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Badge Container */
.badge-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.tool-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

/* Processing Badge */
.processing-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.processing-badge.browser {
  background: #dcfce7;
  color: #166534;
}

.processing-badge.server {
  background: #fef3c7;
  color: #92400e;
}

.tool-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.tool-card p {
  color: #6b7280;
  line-height: 1.6;
}
</style>
