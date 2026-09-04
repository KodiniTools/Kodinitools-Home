<template>
  <div id="app" @mousemove="handleMouseMove">
    <!-- Global Background Effects -->
    <div class="global-background">
      <div class="global-gradient"></div>
      <div class="global-noise"></div>
      <!-- Mouse-following spotlight -->
      <div class="mouse-spotlight" :style="spotlightStyle"></div>
    </div>

    <TheNavbar @toggle-blog="toggleBlog" @toggle-faq="toggleFaq" @go-home="goHome" />

    <BlogPage v-if="showBlog" @go-home="goHome" />
    <FaqPage v-else-if="showFaq" @go-home="goHome" />
    <template v-else>
      <TheHero v-model:search-query="searchQuery" />
      <ToolsGrid :search-query="searchQuery" />
    </template>

    <!-- Scroll to Top Button -->
    <Transition name="fade-slide">
      <button
        v-if="showScrollTop"
        class="scroll-to-top"
        :aria-label="$t('search.scrollTop')"
        @click="scrollToTop"
      >
        ↑
      </button>
    </Transition>

    <!-- PayPal Donate Button -->
    <DonateButton />

    <!-- Footer with Cookie Settings Link -->
    <AppFooter @open-cookie-settings="openCookieSettings" />

    <!-- Cookie Banner -->
    <CookieBanner ref="cookieBannerRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DonateButton from './components/DonateButton.vue'
import CookieBanner from './components/CookieBanner.vue'
import AppFooter from './components/AppFooter.vue'
import BlogPage from './components/BlogPage.vue'
import FaqPage from './components/FaqPage.vue'
import TheNavbar from './components/TheNavbar.vue'
import TheHero from './components/TheHero.vue'
import ToolsGrid from './components/ToolsGrid.vue'
import { usePageView } from './composables/usePageView'
import { useSpotlight } from './composables/useSpotlight'
import { useScrollTop } from './composables/useScrollTop'

// Seitenansicht: Start / Blog / FAQ (Umschalten inkl. Scroll nach oben)
const { showBlog, showFaq, toggleBlog, toggleFaq, goHome } = usePageView()

// Cookie Banner ref
const cookieBannerRef = ref<InstanceType<typeof CookieBanner> | null>(null)

const openCookieSettings = () => {
  cookieBannerRef.value?.openSettings()
}

// Mouse-following spotlight effect
const { spotlightStyle, handleMouseMove } = useSpotlight()

// Search functionality
const searchQuery = ref('')

// Scroll to top functionality (Scroll-Listener wird im Composable registriert)
const { showScrollTop, scrollToTop } = useScrollTop()
</script>

<!-- Styles: global (nicht scoped) wie bisher, aufgeteilt unter src/styles/app/ -->
<style src="./styles/app/index.css"></style>
