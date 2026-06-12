<template>
  <template>
    <!-- Video Showcase Section -->
    <section class="video-showcase">
      <div class="video-showcase-header">
        <h2>{{ $t('videoShowcase.title') }}</h2>
        <p>{{ $t('videoShowcase.subtitle') }}</p>
      </div>
      <div class="video-wrapper">
        <video
          controls
          preload="metadata"
          :poster="'/images/video-poster.jpg'"
          class="showcase-video"
        >
          <source src="https://kodinitools.com/videos/kodinitools.mp4" type="video/mp4" />
          {{ $t('videoShowcase.fallback') }}
        </video>
      </div>
    </section>

    <!-- Search Results Section -->
    <section v-if="hasSearchResults" class="tools-section search-results-section">
      <div class="section-header">
        <h2>{{ $t('search.resultsTitle') }}</h2>
        <p v-if="!showNoResults">{{ filteredTools!.length }} {{ $t('search.resultsFound') }}</p>
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
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ searchQuery: string }>()
const { t } = useI18n()

const allTools = computed(() => [
  { key: 'tools.audioConverter', section: 'audio' },
  { key: 'tools.audioEqualizer', section: 'audio' },
  { key: 'tools.musicPlayer', section: 'audio' },
  { key: 'tools.audioVisualizer', section: 'audio' },
  { key: 'tools.mp3Converter', section: 'audio' },
  { key: 'tools.interactiveEqualizer', section: 'audio' },
  { key: 'tools.modernPlayer', section: 'audio' },
  { key: 'tools.playlistGenerator', section: 'audio' },
  { key: 'tools.alarmTool', section: 'audio' },
  { key: 'tools.audioNormalizer', section: 'audio' },
  { key: 'tools.playlistToWebm', section: 'audio' },
  { key: 'imageTools.imageConverter', section: 'image' },
  { key: 'imageTools.batchImageEditor', section: 'image' },
  { key: 'imageTools.photoCollage', section: 'image' },
  { key: 'diverseTools.colorExtractor', section: 'diverse' },
  { key: 'diverseTools.videoConverter', section: 'diverse' },
])

const filteredTools = computed(() => {
  if (!props.searchQuery.trim()) return null
  const query = props.searchQuery.toLowerCase()
  return allTools.value.filter(tool =>
    t(`${tool.key}.title`).toLowerCase().includes(query) ||
    t(`${tool.key}.description`).toLowerCase().includes(query)
  )
})

const hasSearchResults = computed(() => filteredTools.value !== null)
const showNoResults = computed(() => filteredTools.value !== null && filteredTools.value.length === 0)

const isTouchDevice = () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

const initTiltEffect = () => {
  if (typeof window === 'undefined' || isTouchDevice()) return
  document.addEventListener('mousemove', (e: MouseEvent) => {
    const card = (e.target as HTMLElement).closest?.('.tool-card, .svg-card') as HTMLElement | null
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    card.style.transform = `perspective(1000px) rotateX(${(y - rect.height / 2) / 15}deg) rotateY(${(rect.width / 2 - x) / 15}deg) translateY(-8px)`
    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`)
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`)
  })
  document.addEventListener('mouseleave', (e: MouseEvent) => {
    const card = (e.target as HTMLElement).closest?.('.tool-card, .svg-card') as HTMLElement | null
    if (!card) return
    card.style.transform = ''
    card.style.setProperty('--mouse-x', '50%')
    card.style.setProperty('--mouse-y', '50%')
  }, true)
  document.addEventListener('mouseout', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const related = e.relatedTarget as HTMLElement
    if ((target.classList.contains('tool-card') || target.classList.contains('svg-card')) &&
        (!related || !target.contains(related))) {
      target.style.transform = ''
    }
  })
}

const observeElements = () => {
  if (typeof window === 'undefined') return
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const parent = entry.target.parentElement
        if (parent) {
          const index = Array.from(parent.children).indexOf(entry.target as Element)
          ;(entry.target as HTMLElement).style.transitionDelay = `${index * 0.08}s`
        }
        entry.target.classList.add('is-visible')
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

  document.querySelectorAll('.tools-section, .tool-card-link, .svg-card-link').forEach(el => {
    el.classList.add('scroll-reveal')
    observer.observe(el)
  })
}

onMounted(() => {
  setTimeout(() => {
    observeElements()
    initTiltEffect()
  }, 100)
})
</script>
