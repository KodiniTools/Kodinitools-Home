<template>
  <div v-if="isClient">
    <!-- Cookie Banner -->
    <Transition name="cookie-banner">
      <div v-if="showBanner" class="cookie-banner" role="dialog" aria-modal="true" :aria-label="$t('cookies.bannerTitle')">
        <div class="cookie-content">
          <div class="cookie-text">
            <h3>{{ $t('cookies.bannerTitle') }}</h3>
            <p>{{ $t('cookies.bannerText') }}</p>
            <button class="cookie-link" @click="showDetails = true">
              {{ $t('cookies.moreInfo') }}
            </button>
          </div>

          <div class="cookie-actions">
            <button class="cookie-btn cookie-btn-reject" @click="rejectAll">
              {{ $t('cookies.rejectAll') }}
            </button>
            <button class="cookie-btn cookie-btn-settings" @click="showDetails = true">
              {{ $t('cookies.settings') }}
            </button>
            <button class="cookie-btn cookie-btn-accept" @click="acceptAll">
              {{ $t('cookies.acceptAll') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Cookie Settings Modal -->
    <Transition name="cookie-modal">
      <div v-if="showDetails" class="cookie-modal-overlay" @click.self="showDetails = false">
        <div class="cookie-modal" role="dialog" aria-modal="true" :aria-label="$t('cookies.settingsTitle')">
          <div class="cookie-modal-header">
            <h2>{{ $t('cookies.settingsTitle') }}</h2>
            <button class="cookie-modal-close" :aria-label="$t('cookies.close')" @click="showDetails = false">
              &times;
            </button>
          </div>

          <div class="cookie-modal-body">
            <p class="cookie-modal-intro">{{ $t('cookies.settingsIntro') }}</p>

            <!-- Essential Cookies -->
            <div class="cookie-category">
              <div class="cookie-category-header">
                <div class="cookie-category-info">
                  <h4>{{ $t('cookies.essential.title') }}</h4>
                  <p>{{ $t('cookies.essential.description') }}</p>
                </div>
                <div class="cookie-toggle cookie-toggle-disabled">
                  <input id="essential-cookies" type="checkbox" checked disabled>
                  <label for="essential-cookies">{{ $t('cookies.alwaysActive') }}</label>
                </div>
              </div>
            </div>

            <!-- Analytics Cookies -->
            <div class="cookie-category">
              <div class="cookie-category-header">
                <div class="cookie-category-info">
                  <h4>{{ $t('cookies.analytics.title') }}</h4>
                  <p>{{ $t('cookies.analytics.description') }}</p>
                </div>
                <div class="cookie-toggle">
                  <input
                    id="analytics-cookies"
                    v-model="consent.analytics"
                    type="checkbox"
                  >
                  <label for="analytics-cookies" class="toggle-switch"></label>
                </div>
              </div>
            </div>

            <!-- Marketing Cookies -->
            <div class="cookie-category">
              <div class="cookie-category-header">
                <div class="cookie-category-info">
                  <h4>{{ $t('cookies.marketing.title') }}</h4>
                  <p>{{ $t('cookies.marketing.description') }}</p>
                </div>
                <div class="cookie-toggle">
                  <input
                    id="marketing-cookies"
                    v-model="consent.marketing"
                    type="checkbox"
                  >
                  <label for="marketing-cookies" class="toggle-switch"></label>
                </div>
              </div>
            </div>
          </div>

          <div class="cookie-modal-footer">
            <button class="cookie-btn cookie-btn-reject" @click="rejectAll">
              {{ $t('cookies.rejectAll') }}
            </button>
            <button class="cookie-btn cookie-btn-save" @click="saveSettings">
              {{ $t('cookies.saveSettings') }}
            </button>
            <button class="cookie-btn cookie-btn-accept" @click="acceptAll">
              {{ $t('cookies.acceptAll') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

interface ConsentState {
  analytics: boolean
  marketing: boolean
  timestamp?: string
}

// Start with false to avoid SSR hydration mismatch, then check on client
const isClient = ref(false)
const showBanner = ref(false)
const showDetails = ref(false)

const consent = reactive<ConsentState>({
  analytics: false,
  marketing: false
})

// Check for existing consent on mount (client-side only)
onMounted(() => {
  isClient.value = true

  const savedConsent = localStorage.getItem('cookieConsent')
  if (savedConsent) {
    try {
      const parsed = JSON.parse(savedConsent) as ConsentState
      consent.analytics = parsed.analytics
      consent.marketing = parsed.marketing
      showBanner.value = false
    } catch {
      showBanner.value = true
    }
  } else {
    // No saved consent - show banner
    showBanner.value = true
  }
})

// Update Google Consent Mode
const updateGoogleConsent = () => {
  const w = window as Window & { gtag?: (...args: unknown[]) => void }
  if (typeof window !== 'undefined' && typeof w.gtag === 'function') {
    const gtag = w.gtag

    // Update analytics consent
    gtag('consent', 'update', {
      'analytics_storage': consent.analytics ? 'granted' : 'denied',
      'functionality_storage': consent.analytics ? 'granted' : 'denied',
      'personalization_storage': consent.analytics ? 'granted' : 'denied'
    })

    // Update marketing consent
    gtag('consent', 'update', {
      'ad_storage': consent.marketing ? 'granted' : 'denied',
      'ad_user_data': consent.marketing ? 'granted' : 'denied',
      'ad_personalization': consent.marketing ? 'granted' : 'denied'
    })
  }
}

// Save consent to localStorage
const saveConsent = () => {
  if (typeof window !== 'undefined') {
    const consentData: ConsentState = {
      analytics: consent.analytics,
      marketing: consent.marketing,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookieConsent', JSON.stringify(consentData))
    updateGoogleConsent()
  }
}

// Accept all cookies
const acceptAll = () => {
  consent.analytics = true
  consent.marketing = true
  saveConsent()
  showBanner.value = false
  showDetails.value = false
}

// Reject all optional cookies
const rejectAll = () => {
  consent.analytics = false
  consent.marketing = false
  saveConsent()
  showBanner.value = false
  showDetails.value = false
}

// Save current settings
const saveSettings = () => {
  saveConsent()
  showBanner.value = false
  showDetails.value = false
}

// Expose method to open settings from outside
const openSettings = () => {
  showDetails.value = true
}

defineExpose({ openSettings })
</script>

<style scoped>
/* Cookie Banner Styles */
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 1.25rem;
  z-index: 10000;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .cookie-banner {
  background: #0E1C32;
  border-top-color: rgba(201, 152, 77, 0.2);
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
}

.cookie-text {
  flex: 1;
  min-width: 280px;
}

.cookie-text h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.cookie-text p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.cookie-link {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  text-decoration: underline;
  transition: opacity 0.2s;
}

.cookie-link:hover {
  opacity: 0.8;
}

.cookie-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Cookie Buttons - Equal prominence for accept and reject */
.cookie-btn {
  padding: 0.65rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  white-space: nowrap;
}

.cookie-btn-accept {
  background: var(--gradient-1);
  color: #ffffff;
}

.cookie-btn-accept:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(1, 79, 153, 0.3);
}

/* Reject button - equally prominent as accept */
.cookie-btn-reject {
  background: transparent;
  border: 2px solid var(--text-color);
  color: var(--text-color);
}

.cookie-btn-reject:hover {
  background: var(--text-color);
  color: var(--bg-secondary);
  transform: translateY(-2px);
}

.cookie-btn-settings {
  background: transparent;
  border: 2px solid var(--border-color);
  color: var(--text-secondary);
}

.cookie-btn-settings:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.cookie-btn-save {
  background: var(--gradient-2);
  color: #f9f2d5;
}

.cookie-btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(201, 152, 77, 0.3);
}

/* Modal Styles */
.cookie-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 1rem;
}

.cookie-modal {
  background: var(--bg-secondary);
  border-radius: 1rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .cookie-modal {
  background: #0E1C32;
  border: 1px solid rgba(201, 152, 77, 0.2);
}

.cookie-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.cookie-modal-header h2 {
  font-size: 1.15rem;
  color: var(--text-color);
  margin: 0;
}

.cookie-modal-close {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.cookie-modal-close:hover {
  color: var(--text-color);
}

.cookie-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.cookie-modal-intro {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.cookie-category {
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  overflow: hidden;
}

.cookie-category-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  gap: 1rem;
}

.cookie-category-info h4 {
  font-size: 0.95rem;
  color: var(--text-color);
  margin-bottom: 0.35rem;
}

.cookie-category-info p {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* Toggle Switch */
.cookie-toggle {
  flex-shrink: 0;
}

.cookie-toggle-disabled {
  opacity: 0.7;
}

.cookie-toggle-disabled label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-style: italic;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  cursor: pointer;
}

.cookie-toggle input[type="checkbox"] {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-switch::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--border-color);
  border-radius: 26px;
  transition: background 0.3s;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.cookie-toggle input[type="checkbox"]:checked + .toggle-switch::before {
  background: var(--primary-color);
}

.cookie-toggle input[type="checkbox"]:checked + .toggle-switch::after {
  transform: translateX(22px);
}

.cookie-toggle input[type="checkbox"]:focus + .toggle-switch::before {
  box-shadow: 0 0 0 3px rgba(1, 79, 153, 0.3);
}

[data-theme="dark"] .cookie-toggle input[type="checkbox"]:focus + .toggle-switch::before {
  box-shadow: 0 0 0 3px rgba(201, 152, 77, 0.3);
}

.cookie-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

/* Transitions */
.cookie-banner-enter-active,
.cookie-banner-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.cookie-banner-enter-from,
.cookie-banner-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.cookie-modal-enter-active,
.cookie-modal-leave-active {
  transition: opacity 0.3s ease;
}

.cookie-modal-enter-from,
.cookie-modal-leave-to {
  opacity: 0;
}

.cookie-modal-enter-active .cookie-modal,
.cookie-modal-leave-active .cookie-modal {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.cookie-modal-enter-from .cookie-modal,
.cookie-modal-leave-to .cookie-modal {
  transform: scale(0.95);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .cookie-banner {
    padding: 1rem;
  }

  .cookie-content {
    flex-direction: column;
    align-items: stretch;
  }

  .cookie-actions {
    justify-content: stretch;
  }

  .cookie-btn {
    flex: 1;
    text-align: center;
    padding: 0.75rem 1rem;
  }

  .cookie-modal-header h2 {
    font-size: 1rem;
  }

  .cookie-modal-footer {
    flex-direction: column;
  }

  .cookie-modal-footer .cookie-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .cookie-text h3 {
    font-size: 0.9rem;
  }

  .cookie-text p {
    font-size: 0.8rem;
  }

  .cookie-btn {
    font-size: 0.8rem;
    padding: 0.6rem 0.8rem;
  }

  .cookie-category-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .cookie-toggle {
    align-self: flex-start;
  }
}
</style>
