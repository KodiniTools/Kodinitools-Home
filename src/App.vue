<template>
  <div id="app">
    <!-- Global Floating Tool Icons Background -->
    <div class="floating-icons-global">
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
      <!-- Image/Photo -->
      <div class="floating-icon icon-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
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
      <!-- Convert Arrows -->
      <div class="floating-icon icon-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M7 16l-4-4 4-4"/>
          <path d="M17 8l4 4-4 4"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
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
        <div class="logo" @click="goHome" style="cursor: pointer;">{{ $t('footer.company') }}</div>
        
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
          <a @click.prevent="toggleBlog" href="#blog" class="nav-link blog-link">{{ $t('navigation.blog') }}</a>
        </div>
        
        <div class="nav-controls">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </nav>
    </header>

    <!-- Blog Page -->
    <BlogPage v-if="showBlog" @goHome="goHome" />

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
          <h1 class="hero-title">
            <span class="title-word" v-for="(word, index) in $t('hero.title').split(' ')" :key="index" :style="{ animationDelay: `${index * 0.1}s` }">{{ word }}&nbsp;</span>
          </h1>
          <p class="hero-subtitle" v-html="$t('hero.subtitle')"></p>
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

    <!-- Audio Tools Section with Bento Grid -->
    <section class="tools-section">
      <div class="section-header">
        <h2>{{ $t('tools.sectionTitle') }}</h2>
        <p>{{ $t('tools.sectionDescription') }}</p>
      </div>

      <div class="bento-grid">
        <!-- Audio Konverter - Featured (Large) -->
        <a :href="$t('tools.audioConverter.link')" class="tool-card-link bento-featured">
          <div class="tool-card">
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('tools.audioConverter.badge') }}</span>
              <span :class="['processing-badge', $t('tools.audioConverter.processing')]">
                {{ $t('tools.processingBadge.' + $t('tools.audioConverter.processing')) }}
              </span>
            </div>
            <h3>{{ $t('tools.audioConverter.title') }}</h3>
            <p>{{ $t('tools.audioConverter.description') }}</p>
            <div class="card-arrow">→</div>
          </div>
        </a>

        <!-- 19-Band EQ Pro -->
        <a :href="$t('tools.audioEqualizer.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>
            </div>
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
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
            </div>
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

        <!-- Audio Visualizer - Wide -->
        <a :href="$t('tools.audioVisualizer.link')" class="tool-card-link bento-wide">
          <div class="tool-card">
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
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
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>
            </div>
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
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="6" height="14" x="4" y="5" rx="2"/><rect width="6" height="10" x="14" y="7" rx="2"/><path d="M17 22v-5"/><path d="M7 22v-3"/><path d="M17 2v3"/><path d="M7 2v1"/></svg>
            </div>
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

        <!-- Moderner Musikplayer - Wide -->
        <a :href="$t('tools.modernPlayer.link')" class="tool-card-link bento-wide">
          <div class="tool-card">
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            </div>
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
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
            </div>
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
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></svg>
            </div>
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
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
            </div>
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
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
            </div>
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

    <!-- Image Tools Section with Bento Grid -->
    <section class="tools-section">
      <div class="section-header">
        <h2>{{ $t('imageTools.sectionTitle') }}</h2>
        <p>{{ $t('imageTools.sectionDescription') }}</p>
      </div>

      <div class="bento-grid bento-small">
        <!-- Bildkonverter - Featured -->
        <a :href="$t('imageTools.imageConverter.link')" class="tool-card-link bento-featured">
          <div class="tool-card">
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <div class="badge-container">
              <span class="tool-badge">{{ $t('imageTools.imageConverter.badge') }}</span>
              <span :class="['processing-badge', $t('imageTools.imageConverter.processing')]">
                {{ $t('tools.processingBadge.' + $t('imageTools.imageConverter.processing')) }}
              </span>
            </div>
            <h3>{{ $t('imageTools.imageConverter.title') }}</h3>
            <p>{{ $t('imageTools.imageConverter.description') }}</p>
            <div class="card-arrow">→</div>
          </div>
        </a>

        <!-- Batch Bildbearbeitung -->
        <a :href="$t('imageTools.batchImageEditor.link')" class="tool-card-link">
          <div class="tool-card">
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
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
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            </div>
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

    <!-- Diverse Tools Section with Bento Grid -->
    <section class="tools-section">
      <div class="section-header">
        <h2>{{ $t('diverseTools.sectionTitle') }}</h2>
        <p>{{ $t('diverseTools.sectionDescription') }}</p>
      </div>

      <div class="bento-grid bento-small">
        <!-- Kodini Color Extractor -->
        <a :href="$t('diverseTools.colorExtractor.link')" class="tool-card-link bento-wide">
          <div class="tool-card">
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>
            </div>
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
        <a :href="$t('diverseTools.videoConverter.link')" class="tool-card-link bento-wide">
          <div class="tool-card">
            <div class="card-glow"></div>
            <div class="tool-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
            </div>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import DonateButton from './components/DonateButton.vue'
import CookieBanner from './components/CookieBanner.vue'
import AppFooter from './components/AppFooter.vue'
import BlogPage from './components/BlogPage.vue'

const { t } = useI18n()

// Blog page toggle
const showBlog = ref(false)

const toggleBlog = () => {
  showBlog.value = !showBlog.value
  if (showBlog.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const goHome = () => {
  showBlog.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Cookie Banner ref
const cookieBannerRef = ref<InstanceType<typeof CookieBanner> | null>(null)

const openCookieSettings = () => {
  cookieBannerRef.value?.openSettings()
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

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 3D Tilt Effect for Cards - Using Event Delegation for reliability
const initTiltEffect = () => {
  if (typeof window === 'undefined') return

  // Use event delegation on document for better reliability
  document.addEventListener('mousemove', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const card = target.closest('.tool-card') as HTMLElement
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
    const card = target.closest('.tool-card') as HTMLElement
    if (!card) return

    card.style.transform = ''
    card.style.setProperty('--mouse-x', '50%')
    card.style.setProperty('--mouse-y', '50%')
  }, true)

  // Also handle when mouse leaves a card
  document.addEventListener('mouseout', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement

    if (target.classList.contains('tool-card') &&
        (!relatedTarget || !target.contains(relatedTarget))) {
      target.style.transform = ''
      target.style.setProperty('--mouse-x', '50%')
      target.style.setProperty('--mouse-y', '50%')
    }
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

  document.querySelectorAll('.tools-section, .tool-card-link').forEach((el) => {
    el.classList.add('scroll-reveal')
    observer.observe(el)
  })
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll)
    // Delay setup to ensure DOM is ready
    setTimeout(() => {
      observeElements()
      initTiltEffect()
    }, 100)
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
  --bg-color: #ebe8e3;
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
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
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
  border: 1px solid rgba(162, 134, 128, 0.15);
  box-shadow: 0 8px 32px rgba(162, 134, 128, 0.1),
              0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

[data-theme="dark"] .hero {
  background: rgba(22, 22, 28, 0.8);
  border: 1px solid rgba(242, 226, 142, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(242, 226, 142, 0.1) inset;
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
  background: linear-gradient(135deg, #A28680 0%, #d4b8b3 100%);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.mesh-blob-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #F2E28E 0%, #f7ebb8 100%);
  top: -50px;
  right: -80px;
  animation-delay: -5s;
  animation-duration: 25s;
}

.mesh-blob-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #5E5F69 0%, #8a8b94 100%);
  bottom: -100px;
  left: 30%;
  animation-delay: -10s;
  animation-duration: 22s;
}

.mesh-blob-4 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #AEAFB7 0%, #d1d2d8 100%);
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
  background: linear-gradient(135deg, #F2E28E 0%, #d9cb7f 100%);
  opacity: 0.4;
}

[data-theme="dark"] .mesh-blob-2 {
  background: linear-gradient(135deg, #A28680 0%, #c4a9a3 100%);
  opacity: 0.35;
}

[data-theme="dark"] .mesh-blob-3 {
  background: linear-gradient(135deg, #F2E28E 0%, #b8a96a 100%);
  opacity: 0.3;
}

[data-theme="dark"] .mesh-blob-4 {
  background: linear-gradient(135deg, #5E5F69 0%, #3d3e45 100%);
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
  color: var(--color-mauve);
  opacity: 0.12;
  animation: float 20s ease-in-out infinite;
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

.icon-3 {
  width: 60px;
  height: 60px;
  top: 35%;
  left: 5%;
  animation-delay: -7s;
  animation-duration: 28s;
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

.icon-6 {
  width: 65px;
  height: 65px;
  top: 28%;
  left: 20%;
  animation-delay: -2s;
  animation-duration: 26s;
  filter: blur(1px);
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
  background: linear-gradient(135deg, #5E5F69 0%, #0C0C10 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: wordReveal 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes wordReveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

[data-theme="dark"] .title-word {
  background: linear-gradient(135deg, #F2E28E 0%, #f5e9a8 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #5E5F69;
  margin-bottom: 0;
  animation: fadeInUp 1s ease 0.3s forwards;
  opacity: 0;
  font-weight: 500;
  max-width: 600px;
  margin: 0 auto;
}

[data-theme="dark"] .hero-subtitle {
  color: #AEAFB7;
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
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1.5rem;
  padding: 1rem;
  border: 1px solid rgba(162, 134, 128, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: logoFloat 3s ease-in-out infinite;
  box-shadow: 0 10px 40px rgba(162, 134, 128, 0.15),
              0 0 0 1px rgba(255, 255, 255, 0.5) inset;
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
  box-shadow: 0 20px 60px rgba(162, 134, 128, 0.25);
}

.hero-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

[data-theme="dark"] .hero-logo {
  background: rgba(22, 22, 28, 0.9);
  border-color: rgba(242, 226, 142, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(242, 226, 142, 0.1) inset;
}

[data-theme="dark"] .hero-logo:hover {
  box-shadow: 0 20px 60px rgba(242, 226, 142, 0.15);
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.6rem;
  margin-top: 2rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(162, 134, 128, 0.15);
  padding: 0.85rem 0.5rem;
  border-radius: 0.75rem;
  text-align: center;
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease forwards;
  animation-fill-mode: both;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.15s; }
.feature-card:nth-child(3) { animation-delay: 0.2s; }
.feature-card:nth-child(4) { animation-delay: 0.25s; }
.feature-card:nth-child(5) { animation-delay: 0.3s; }
.feature-card:nth-child(6) { animation-delay: 0.35s; }

.feature-card:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(162, 134, 128, 0.3);
  box-shadow: 0 8px 20px rgba(162, 134, 128, 0.12);
}

[data-theme="dark"] .feature-card {
  background: rgba(22, 22, 28, 0.8);
  border: 1px solid rgba(242, 226, 142, 0.1);
}

[data-theme="dark"] .feature-card:hover {
  background: rgba(30, 30, 38, 0.95);
  border-color: rgba(242, 226, 142, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .feature-text {
  color: #f5e9a8;
}

.feature-text {
  font-weight: 600;
  color: #5E5F69;
  font-size: 0.7rem;
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
  border: 1px solid rgba(162, 134, 128, 0.2);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(162, 134, 128, 0.1),
              0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.spotlight-search:focus-within {
  border-color: rgba(162, 134, 128, 0.4);
  box-shadow: 0 8px 30px rgba(162, 134, 128, 0.15),
              0 0 0 3px rgba(162, 134, 128, 0.1);
  transform: scale(1.02);
}

[data-theme="dark"] .spotlight-search {
  background: rgba(22, 22, 28, 0.95);
  border-color: rgba(242, 226, 142, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .spotlight-search:focus-within {
  border-color: rgba(242, 226, 142, 0.4);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4),
              0 0 0 3px rgba(242, 226, 142, 0.1);
}

.search-icon-svg {
  color: #A28680;
  flex-shrink: 0;
}

[data-theme="dark"] .search-icon-svg {
  color: #F2E28E;
}

.spotlight-search .search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: var(--text-color);
  outline: none;
}

.spotlight-search .search-input::placeholder {
  color: #AEAFB7;
}

.search-kbd {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  background: rgba(162, 134, 128, 0.1);
  border: 1px solid rgba(162, 134, 128, 0.2);
  border-radius: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #5E5F69;
  font-family: inherit;
}

[data-theme="dark"] .search-kbd {
  background: rgba(242, 226, 142, 0.1);
  border-color: rgba(242, 226, 142, 0.2);
  color: #F2E28E;
}

.spotlight-search .search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: rgba(162, 134, 128, 0.1);
  border: none;
  border-radius: 0.4rem;
  color: #5E5F69;
  cursor: pointer;
  transition: all 0.2s ease;
}

.spotlight-search .search-clear:hover {
  background: rgba(162, 134, 128, 0.2);
  color: #A28680;
}

[data-theme="dark"] .spotlight-search .search-clear {
  background: rgba(242, 226, 142, 0.1);
  color: #F2E28E;
}

[data-theme="dark"] .spotlight-search .search-clear:hover {
  background: rgba(242, 226, 142, 0.2);
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
    rgba(162, 134, 128, 0.15) 0%,
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
    rgba(242, 226, 142, 0.15) 0%,
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
    0 25px 50px rgba(162, 134, 128, 0.2),
    0 0 0 1px rgba(162, 134, 128, 0.15);
  border-color: rgba(162, 134, 128, 0.25);
}

[data-theme="dark"] .tool-card-link:hover .tool-card {
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(242, 226, 142, 0.12);
  border-color: rgba(242, 226, 142, 0.25);
}

/* Card inner content lift effect */
.tool-card-link:hover .tool-icon,
.tool-card-link:hover h3,
.tool-card-link:hover .badge-container {
  transform: translateZ(20px);
}

/* Featured Card Styles */
.bento-featured .tool-card {
  background: linear-gradient(135deg, rgba(162, 134, 128, 0.05) 0%, rgba(242, 226, 142, 0.03) 100%);
  padding: 1.5rem;
}

[data-theme="dark"] .bento-featured .tool-card {
  background: linear-gradient(135deg, rgba(242, 226, 142, 0.05) 0%, rgba(162, 134, 128, 0.03) 100%);
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
    padding: 3rem 1.25rem;
    border-radius: 1.5rem;
    margin: 1rem;
    margin-bottom: 2rem;
  }

  .hero-logo {
    width: 90px;
    height: 90px;
    padding: 0.75rem;
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

  .hero {
    padding: 2rem 1rem;
    margin: 0.75rem;
    border-radius: 1.25rem;
  }

  .hero-logo {
    width: 80px;
    height: 80px;
    padding: 0.6rem;
    border-radius: 1rem;
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
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }

  .feature-card {
    padding: 0.5rem 0.3rem;
  }

  .feature-text {
    font-size: 0.5rem;
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
