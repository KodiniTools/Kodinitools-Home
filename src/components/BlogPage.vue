<template>
  <div class="blog-page">
    <!-- Blog Header -->
    <header class="blog-header">
      <div class="blog-header-content">
        <span class="blog-badge">{{ $t('blog.badge') }}</span>
        <h1 class="blog-title">{{ $t('blog.title') }}</h1>
        <p class="blog-subtitle">{{ $t('blog.subtitle') }}</p>
        <div class="blog-meta">
          <span class="blog-author">{{ $t('blog.author') }}</span>
          <span class="blog-separator">|</span>
          <span class="blog-date">{{ $t('blog.date') }}</span>
          <span class="blog-separator">|</span>
          <span class="blog-reading-time">{{ $t('blog.readingTime') }}</span>
        </div>
      </div>
    </header>

    <!-- Table of Contents -->
    <nav class="blog-toc">
      <h2 class="toc-title">{{ $t('blog.toc.title') }}</h2>
      <ul class="toc-list">
        <li><a href="#intro">{{ $t('blog.toc.intro') }}</a></li>
        <li><a href="#philosophy">{{ $t('blog.toc.philosophy') }}</a></li>
        <li><a href="#audio-tools">{{ $t('blog.toc.audioTools') }}</a></li>
        <li><a href="#image-tools">{{ $t('blog.toc.imageTools') }}</a></li>
        <li><a href="#diverse-tools">{{ $t('blog.toc.diverseTools') }}</a></li>
        <li><a href="#processing">{{ $t('blog.toc.processing') }}</a></li>
        <li><a href="#privacy">{{ $t('blog.toc.privacy') }}</a></li>
        <li><a href="#premium">{{ $t('blog.toc.premium') }}</a></li>
        <li><a href="#conclusion">{{ $t('blog.toc.conclusion') }}</a></li>
      </ul>
    </nav>

    <!-- Blog Content -->
    <article class="blog-content">

      <!-- Introduction -->
      <section id="intro" class="blog-section">
        <h2 class="section-title">{{ $t('blog.sections.intro.title') }}</h2>
        <p class="section-text">{{ $t('blog.sections.intro.p1') }}</p>
        <p class="section-text">{{ $t('blog.sections.intro.p2') }}</p>
        <p class="section-text">{{ $t('blog.sections.intro.p3') }}</p>

        <div class="highlight-box">
          <h3>{{ $t('blog.sections.intro.highlightTitle') }}</h3>
          <ul class="feature-list">
            <li>{{ $t('blog.sections.intro.feature1') }}</li>
            <li>{{ $t('blog.sections.intro.feature2') }}</li>
            <li>{{ $t('blog.sections.intro.feature3') }}</li>
            <li>{{ $t('blog.sections.intro.feature4') }}</li>
            <li>{{ $t('blog.sections.intro.feature5') }}</li>
            <li>{{ $t('blog.sections.intro.feature6') }}</li>
          </ul>
        </div>
      </section>

      <!-- Philosophy -->
      <section id="philosophy" class="blog-section">
        <h2 class="section-title">{{ $t('blog.sections.philosophy.title') }}</h2>
        <p class="section-text">{{ $t('blog.sections.philosophy.p1') }}</p>
        <p class="section-text">{{ $t('blog.sections.philosophy.p2') }}</p>
        <p class="section-text">{{ $t('blog.sections.philosophy.p3') }}</p>

        <blockquote class="blog-quote">
          {{ $t('blog.sections.philosophy.quote') }}
        </blockquote>
      </section>

      <!-- Audio Tools Section -->
      <section id="audio-tools" class="blog-section">
        <h2 class="section-title">{{ $t('blog.sections.audioTools.title') }}</h2>
        <p class="section-intro">{{ $t('blog.sections.audioTools.intro') }}</p>

        <!-- Audio Converter -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🔄</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.audioConverter.title') }}</h3>
            <span class="tool-badge server">Server</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.audioConverter.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.audioConverter.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.audioConverter.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.audioConverter.feature3') }}</li>
              <li>{{ $t('blog.sections.audioTools.audioConverter.feature4') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.audioConverter.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/audiokonverter/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- 19-Band EQ Pro -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🎛️</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.eq19.title') }}</h3>
            <span class="tool-badge browser">Browser</span>
            <span class="tool-badge pro">PRO</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.eq19.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.eq19.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.eq19.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.eq19.feature3') }}</li>
              <li>{{ $t('blog.sections.audioTools.eq19.feature4') }}</li>
              <li>{{ $t('blog.sections.audioTools.eq19.feature5') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.eq19.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/equaliser19/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Music Player -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🎵</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.musicPlayer.title') }}</h3>
            <span class="tool-badge browser">Browser</span>
            <span class="tool-badge new">{{ $t('blog.new') }}</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.musicPlayer.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.musicPlayer.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.musicPlayer.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.musicPlayer.feature3') }}</li>
              <li>{{ $t('blog.sections.audioTools.musicPlayer.feature4') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.musicPlayer.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/ultimativermusikplayer/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Audio Visualizer -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">📊</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.visualizer.title') }}</h3>
            <span class="tool-badge browser">Browser</span>
            <span class="tool-badge video">Video</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.visualizer.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.visualizer.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.visualizer.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.visualizer.feature3') }}</li>
              <li>{{ $t('blog.sections.audioTools.visualizer.feature4') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.visualizer.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/visualizer/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- MP3 Converter -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🎧</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.mp3Converter.title') }}</h3>
            <span class="tool-badge server">Server</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.mp3Converter.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.mp3Converter.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.mp3Converter.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.mp3Converter.feature3') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.mp3Converter.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/mp3konverter/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Interactive Equalizer -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🎚️</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.interactiveEq.title') }}</h3>
            <span class="tool-badge browser">Browser</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.interactiveEq.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.interactiveEq.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.interactiveEq.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.interactiveEq.feature3') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.interactiveEq.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/audioequalizer/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Modern Music Player -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🎶</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.modernPlayer.title') }}</h3>
            <span class="tool-badge browser">Browser</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.modernPlayer.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.modernPlayer.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.modernPlayer.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.modernPlayer.feature3') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.modernPlayer.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/modernermusikplayer/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Playlist Generator -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">📋</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.playlistGenerator.title') }}</h3>
            <span class="tool-badge browser">Browser</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.playlistGenerator.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.playlistGenerator.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.playlistGenerator.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.playlistGenerator.feature3') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.playlistGenerator.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/playlist_generator/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Alarm Tool -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">⏰</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.alarmTool.title') }}</h3>
            <span class="tool-badge browser">Browser</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.alarmTool.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.alarmTool.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.alarmTool.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.alarmTool.feature3') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.alarmTool.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/alarmtool/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Audio Normalizer -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">📢</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.audioNormalizer.title') }}</h3>
            <span class="tool-badge server">Server</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.audioNormalizer.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.audioNormalizer.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.audioNormalizer.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.audioNormalizer.feature3') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.audioNormalizer.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/audionormalisierer/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Playlist to WebM -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🎬</span>
            <h3 class="tool-name">{{ $t('blog.sections.audioTools.playlistWebm.title') }}</h3>
            <span class="tool-badge server">Server</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.audioTools.playlistWebm.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.audioTools.playlistWebm.feature1') }}</li>
              <li>{{ $t('blog.sections.audioTools.playlistWebm.feature2') }}</li>
              <li>{{ $t('blog.sections.audioTools.playlistWebm.feature3') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.audioTools.playlistWebm.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/playlistkonverter/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>
      </section>

      <!-- Image Tools Section -->
      <section id="image-tools" class="blog-section">
        <h2 class="section-title">{{ $t('blog.sections.imageTools.title') }}</h2>
        <p class="section-intro">{{ $t('blog.sections.imageTools.intro') }}</p>

        <!-- Image Converter -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🖼️</span>
            <h3 class="tool-name">{{ $t('blog.sections.imageTools.imageConverter.title') }}</h3>
            <span class="tool-badge server">Server</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.imageTools.imageConverter.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.imageTools.imageConverter.feature1') }}</li>
              <li>{{ $t('blog.sections.imageTools.imageConverter.feature2') }}</li>
              <li>{{ $t('blog.sections.imageTools.imageConverter.feature3') }}</li>
              <li>{{ $t('blog.sections.imageTools.imageConverter.feature4') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.imageTools.imageConverter.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/bildkonverter/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Batch Image Editor -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">📸</span>
            <h3 class="tool-name">{{ $t('blog.sections.imageTools.batchEditor.title') }}</h3>
            <span class="tool-badge browser">Browser</span>
            <span class="tool-badge batch">Batch</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.imageTools.batchEditor.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.imageTools.batchEditor.feature1') }}</li>
              <li>{{ $t('blog.sections.imageTools.batchEditor.feature2') }}</li>
              <li>{{ $t('blog.sections.imageTools.batchEditor.feature3') }}</li>
              <li>{{ $t('blog.sections.imageTools.batchEditor.feature4') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.imageTools.batchEditor.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/bilderseriebearbeiten/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Photo Collage -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🎨</span>
            <h3 class="tool-name">{{ $t('blog.sections.imageTools.photoCollage.title') }}</h3>
            <span class="tool-badge browser">Browser</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.imageTools.photoCollage.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.imageTools.photoCollage.feature1') }}</li>
              <li>{{ $t('blog.sections.imageTools.photoCollage.feature2') }}</li>
              <li>{{ $t('blog.sections.imageTools.photoCollage.feature3') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.imageTools.photoCollage.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/collagemaker" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>
      </section>

      <!-- Diverse Tools Section -->
      <section id="diverse-tools" class="blog-section">
        <h2 class="section-title">{{ $t('blog.sections.diverseTools.title') }}</h2>
        <p class="section-intro">{{ $t('blog.sections.diverseTools.intro') }}</p>

        <!-- Color Extractor -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🎨</span>
            <h3 class="tool-name">{{ $t('blog.sections.diverseTools.colorExtractor.title') }}</h3>
            <span class="tool-badge browser">Browser</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.diverseTools.colorExtractor.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.diverseTools.colorExtractor.feature1') }}</li>
              <li>{{ $t('blog.sections.diverseTools.colorExtractor.feature2') }}</li>
              <li>{{ $t('blog.sections.diverseTools.colorExtractor.feature3') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.diverseTools.colorExtractor.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/kodini-color-extractor/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>

        <!-- Video Converter -->
        <div class="tool-card">
          <div class="tool-header">
            <span class="tool-icon">🎥</span>
            <h3 class="tool-name">{{ $t('blog.sections.diverseTools.videoConverter.title') }}</h3>
            <span class="tool-badge server">Server</span>
          </div>
          <p class="tool-description">{{ $t('blog.sections.diverseTools.videoConverter.description') }}</p>
          <div class="tool-features">
            <h4>{{ $t('blog.toolFeatures') }}</h4>
            <ul>
              <li>{{ $t('blog.sections.diverseTools.videoConverter.feature1') }}</li>
              <li>{{ $t('blog.sections.diverseTools.videoConverter.feature2') }}</li>
              <li>{{ $t('blog.sections.diverseTools.videoConverter.feature3') }}</li>
            </ul>
          </div>
          <div class="tool-usecase">
            <h4>{{ $t('blog.useCases') }}</h4>
            <p>{{ $t('blog.sections.diverseTools.videoConverter.usecase') }}</p>
          </div>
          <a href="https://kodinitools.com/videokonverter/" target="_blank" class="tool-link">
            {{ $t('blog.tryTool') }} →
          </a>
        </div>
      </section>

      <!-- Processing Types -->
      <section id="processing" class="blog-section">
        <h2 class="section-title">{{ $t('blog.sections.processing.title') }}</h2>
        <p class="section-text">{{ $t('blog.sections.processing.intro') }}</p>

        <div class="processing-comparison">
          <div class="processing-card browser-card">
            <h3>{{ $t('blog.sections.processing.browser.title') }}</h3>
            <p class="processing-description">{{ $t('blog.sections.processing.browser.description') }}</p>
            <ul>
              <li>{{ $t('blog.sections.processing.browser.pro1') }}</li>
              <li>{{ $t('blog.sections.processing.browser.pro2') }}</li>
              <li>{{ $t('blog.sections.processing.browser.pro3') }}</li>
            </ul>
            <p class="processing-tools"><strong>{{ $t('blog.sections.processing.examples') }}</strong> {{ $t('blog.sections.processing.browser.examples') }}</p>
          </div>

          <div class="processing-card server-card">
            <h3>{{ $t('blog.sections.processing.server.title') }}</h3>
            <p class="processing-description">{{ $t('blog.sections.processing.server.description') }}</p>
            <ul>
              <li>{{ $t('blog.sections.processing.server.pro1') }}</li>
              <li>{{ $t('blog.sections.processing.server.pro2') }}</li>
              <li>{{ $t('blog.sections.processing.server.pro3') }}</li>
            </ul>
            <p class="processing-tools"><strong>{{ $t('blog.sections.processing.examples') }}</strong> {{ $t('blog.sections.processing.server.examples') }}</p>
          </div>
        </div>
      </section>

      <!-- Privacy -->
      <section id="privacy" class="blog-section">
        <h2 class="section-title">{{ $t('blog.sections.privacy.title') }}</h2>
        <p class="section-text">{{ $t('blog.sections.privacy.p1') }}</p>
        <p class="section-text">{{ $t('blog.sections.privacy.p2') }}</p>

        <div class="privacy-features">
          <div class="privacy-item">
            <span class="privacy-icon">🔒</span>
            <h4>{{ $t('blog.sections.privacy.gdpr.title') }}</h4>
            <p>{{ $t('blog.sections.privacy.gdpr.description') }}</p>
          </div>
          <div class="privacy-item">
            <span class="privacy-icon">🍪</span>
            <h4>{{ $t('blog.sections.privacy.cookies.title') }}</h4>
            <p>{{ $t('blog.sections.privacy.cookies.description') }}</p>
          </div>
          <div class="privacy-item">
            <span class="privacy-icon">🗑️</span>
            <h4>{{ $t('blog.sections.privacy.deletion.title') }}</h4>
            <p>{{ $t('blog.sections.privacy.deletion.description') }}</p>
          </div>
        </div>
      </section>

      <!-- Premium -->
      <section id="premium" class="blog-section">
        <h2 class="section-title">{{ $t('blog.sections.premium.title') }}</h2>
        <p class="section-text">{{ $t('blog.sections.premium.p1') }}</p>
        <p class="section-text">{{ $t('blog.sections.premium.p2') }}</p>

        <div class="premium-features">
          <div class="premium-item">
            <span class="premium-icon">⭐</span>
            <span>{{ $t('blog.sections.premium.feature1') }}</span>
          </div>
          <div class="premium-item">
            <span class="premium-icon">🚀</span>
            <span>{{ $t('blog.sections.premium.feature2') }}</span>
          </div>
          <div class="premium-item">
            <span class="premium-icon">🚫</span>
            <span>{{ $t('blog.sections.premium.feature3') }}</span>
          </div>
          <div class="premium-item">
            <span class="premium-icon">💬</span>
            <span>{{ $t('blog.sections.premium.feature4') }}</span>
          </div>
        </div>
      </section>

      <!-- Conclusion -->
      <section id="conclusion" class="blog-section">
        <h2 class="section-title">{{ $t('blog.sections.conclusion.title') }}</h2>
        <p class="section-text">{{ $t('blog.sections.conclusion.p1') }}</p>
        <p class="section-text">{{ $t('blog.sections.conclusion.p2') }}</p>
        <p class="section-text">{{ $t('blog.sections.conclusion.p3') }}</p>

        <div class="cta-box">
          <h3>{{ $t('blog.sections.conclusion.ctaTitle') }}</h3>
          <p>{{ $t('blog.sections.conclusion.ctaText') }}</p>
          <a href="https://kodinitools.com" class="cta-button">{{ $t('blog.sections.conclusion.ctaButton') }}</a>
        </div>
      </section>

    </article>

    <!-- Back to Home -->
    <div class="blog-footer">
      <a @click.prevent="handleGoHome" href="#" class="back-link">← {{ $t('blog.backToHome') }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'goHome'): void
}>()

const handleGoHome = () => {
  emit('goHome')
}
</script>

<style scoped>
.blog-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  color: var(--text-color, #333);
  background: var(--bg-color, #fff);
  min-height: 100vh;
}

/* Blog Header */
.blog-header {
  text-align: center;
  padding: 3rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  margin-bottom: 2rem;
  color: white;
}

.blog-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.blog-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.blog-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin: 0 0 1.5rem 0;
}

.blog-meta {
  font-size: 0.875rem;
  opacity: 0.8;
}

.blog-separator {
  margin: 0 0.5rem;
}

/* Table of Contents */
.blog-toc {
  background: var(--card-bg, #f8f9fa);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color, #e9ecef);
}

.toc-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.toc-list a {
  color: var(--primary-color, #667eea);
  text-decoration: none;
  padding: 0.5rem;
  display: block;
  border-radius: 6px;
  transition: background 0.2s;
}

.toc-list a:hover {
  background: var(--hover-bg, rgba(102, 126, 234, 0.1));
}

/* Blog Content */
.blog-content {
  line-height: 1.8;
}

.blog-section {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, #e9ecef);
}

.blog-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  color: var(--heading-color, #1a1a2e);
}

.section-intro {
  font-size: 1.125rem;
  color: var(--text-muted, #6c757d);
  margin-bottom: 2rem;
}

.section-text {
  margin-bottom: 1rem;
}

/* Highlight Box */
.highlight-box {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-left: 4px solid #667eea;
}

.highlight-box h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
}

.feature-list {
  margin: 0;
  padding-left: 1.5rem;
}

.feature-list li {
  margin-bottom: 0.5rem;
}

/* Quote */
.blog-quote {
  font-style: italic;
  font-size: 1.25rem;
  border-left: 4px solid #667eea;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  background: var(--card-bg, #f8f9fa);
  border-radius: 0 8px 8px 0;
}

/* Tool Cards */
.tool-card {
  background: var(--card-bg, #f8f9fa);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color, #e9ecef);
  transition: transform 0.2s, box-shadow 0.2s;
}

.tool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.tool-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tool-icon {
  font-size: 2rem;
}

.tool-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
}

.tool-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.tool-badge.server {
  background: #dc3545;
  color: white;
}

.tool-badge.browser {
  background: #28a745;
  color: white;
}

.tool-badge.pro {
  background: #ffc107;
  color: #1a1a2e;
}

.tool-badge.new {
  background: #17a2b8;
  color: white;
}

.tool-badge.video {
  background: #6f42c1;
  color: white;
}

.tool-badge.batch {
  background: #fd7e14;
  color: white;
}

.tool-description {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: var(--text-color, #333);
}

.tool-features h4,
.tool-usecase h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--heading-color, #1a1a2e);
}

.tool-features ul {
  margin: 0 0 1rem 0;
  padding-left: 1.5rem;
}

.tool-features li {
  margin-bottom: 0.25rem;
}

.tool-usecase {
  background: rgba(102, 126, 234, 0.05);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.tool-usecase p {
  margin: 0;
  font-style: italic;
}

.tool-link {
  display: inline-block;
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.tool-link:hover {
  color: #764ba2;
}

/* Processing Comparison */
.processing-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.processing-card {
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid;
}

.browser-card {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.05);
}

.server-card {
  border-color: #dc3545;
  background: rgba(220, 53, 69, 0.05);
}

.processing-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
}

.processing-description {
  margin-bottom: 1rem;
}

.processing-card ul {
  margin: 0 0 1rem 0;
  padding-left: 1.5rem;
}

.processing-tools {
  font-size: 0.875rem;
  color: var(--text-muted, #6c757d);
}

/* Privacy Features */
.privacy-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.privacy-item {
  text-align: center;
  padding: 1.5rem;
  background: var(--card-bg, #f8f9fa);
  border-radius: 12px;
}

.privacy-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
}

.privacy-item h4 {
  margin: 0 0 0.5rem 0;
}

.privacy-item p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted, #6c757d);
}

/* Premium Features */
.premium-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.premium-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--card-bg, #f8f9fa);
  border-radius: 8px;
}

.premium-icon {
  font-size: 1.5rem;
}

/* CTA Box */
.cta-box {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  margin-top: 2rem;
}

.cta-box h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.cta-box p {
  margin: 0 0 1.5rem 0;
  opacity: 0.9;
}

.cta-button {
  display: inline-block;
  background: white;
  color: #667eea;
  padding: 0.75rem 2rem;
  border-radius: 30px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Blog Footer */
.blog-footer {
  text-align: center;
  padding: 2rem;
  margin-top: 2rem;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

/* Dark Mode Support */
:root.dark .blog-page,
.dark .blog-page {
  --text-color: #e0e0e0;
  --heading-color: #fff;
  --card-bg: #2d2d44;
  --border-color: #3d3d5c;
  --text-muted: #a0a0a0;
  --bg-color: #1a1a2e;
  --hover-bg: rgba(102, 126, 234, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .blog-title {
    font-size: 1.75rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .tool-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .tool-name {
    font-size: 1.25rem;
  }

  .toc-list {
    grid-template-columns: 1fr;
  }
}
</style>
