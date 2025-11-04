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
              <a href="https://kodinitools.com/playlistkonverter/" class="dropdown-item">
                {{ $t('navigation.toolsMenu.playlistConverter') }}
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
  --primary-color: #3b82f6;
  --primary-dark: #2563eb;
  --primary-light: #60a5fa;
  --gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --gradient-3: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  --gradient-hero: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --bg-color: #0f172a;
  --text-color: #f1f5f9;
  --border-color: #334155;
  --gradient-hero: linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
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
  background: rgba(15, 23, 42, 0.8);
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
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: transform 0.3s ease;
  cursor: pointer;
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
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  padding: 0.5rem 0;
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
  color: #667eea;
}

.nav-link:hover::after {
  width: 100%;
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-xl);
  min-width: 250px;
  z-index: 1000;
  margin-top: 0.5rem;
  padding: 0.5rem;
  animation: fadeInUp 0.3s ease;
}

[data-theme="dark"] .dropdown-menu {
  background: rgba(15, 23, 42, 0.95);
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
  transition: all 0.3s ease;
  white-space: nowrap;
  border-radius: 0.5rem;
  font-weight: 500;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
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
  padding: 6rem 2rem;
  text-align: center;
  background: var(--gradient-hero);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
  border-radius: 0 0 2rem 2rem;
  margin-bottom: 4rem;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.hero-title {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.8s ease;
  position: relative;
  z-index: 1;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  animation: fadeInUp 1s ease;
  position: relative;
  z-index: 1;
  font-weight: 400;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 4rem;
  position: relative;
  z-index: 1;
}

.feature-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem;
  border-radius: 1rem;
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
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  animation: float 3s ease-in-out infinite;
}

.feature-text {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.95rem;
}

/* Tools Section */
.tools-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 2rem;
  animation: fadeIn 1s ease;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
  animation: fadeInUp 0.8s ease;
}

.section-header h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-header p {
  font-size: 1.25rem;
  color: #6b7280;
}

[data-theme="dark"] .section-header p {
  color: #94a3b8;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.tool-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.tool-card {
  position: relative;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  padding: 2rem;
  border-radius: 1.25rem;
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
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-xl);
  border-color: transparent;
}

.tool-card-link:hover .tool-card::before {
  opacity: 0.05;
}

.tool-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  display: inline-block;
  transition: transform 0.4s ease;
  position: relative;
  z-index: 1;
}

.tool-card-link:hover .tool-icon {
  transform: scale(1.1) rotate(5deg);
  animation: float 2s ease-in-out infinite;
}

/* Badge Container */
.badge-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.tool-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
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
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.processing-badge.browser {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
}

.processing-badge.server {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
}

.tool-card-link:hover .processing-badge {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.tool-card h3 {
  font-size: 1.35rem;
  margin-bottom: 0.75rem;
  font-weight: 700;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

.tool-card-link:hover .tool-card h3 {
  color: #667eea;
}

.tool-card p {
  color: #6b7280;
  line-height: 1.7;
  position: relative;
  z-index: 1;
}

[data-theme="dark"] .tool-card p {
  color: #94a3b8;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }

  .section-header h2 {
    font-size: 2rem;
  }

  .tools-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }

  .nav-links {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    text-align: center;
  }

  .nav-dropdown {
    width: 100%;
  }

  .dropdown-menu {
    position: relative;
    width: 100%;
    margin-top: 0.5rem;
  }

  .hero {
    padding: 4rem 1.5rem;
    border-radius: 0 0 1rem 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .feature-card {
    padding: 1rem;
  }

  .feature-icon {
    font-size: 2rem;
  }

  .tools-section {
    padding: 3rem 1.5rem;
  }

  .section-header h2 {
    font-size: 1.75rem;
  }

  .section-header p {
    font-size: 1rem;
  }

  .tools-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .tool-card {
    padding: 1.5rem;
  }

  .tool-icon {
    font-size: 3rem;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 0.75rem;
  }

  .logo {
    font-size: 1.25rem;
  }

  .hero {
    padding: 3rem 1rem;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .feature-card {
    padding: 0.75rem;
  }

  .feature-text {
    font-size: 0.85rem;
  }

  .tools-section {
    padding: 2rem 1rem;
  }

  .tool-card h3 {
    font-size: 1.15rem;
  }

  .tool-card p {
    font-size: 0.9rem;
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Better focus styles for accessibility */
a:focus,
button:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* Performance optimization */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
