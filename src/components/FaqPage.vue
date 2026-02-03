<template>
  <div class="faq-page">
    <!-- FAQ Header -->
    <header class="faq-header">
      <div class="faq-header-content">
        <h1 class="faq-title">{{ $t('faq.title') }}</h1>
        <p class="faq-subtitle">{{ $t('faq.subtitle') }}</p>
      </div>
    </header>

    <!-- FAQ Content -->
    <section class="faq-content">
      <div class="faq-list">
        <div
          v-for="(item, index) in faqItems"
          :key="index"
          class="faq-item"
          :class="{ 'is-open': openItems.includes(index) }"
        >
          <button
            class="faq-question"
            @click="toggleItem(index)"
            :aria-expanded="openItems.includes(index)"
          >
            <span class="question-text">{{ $t(`faq.questions.q${index + 1}.question`) }}</span>
            <span class="question-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </span>
          </button>
          <div class="faq-answer" v-show="openItems.includes(index)">
            <p>{{ $t(`faq.questions.q${index + 1}.answer`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Back to Home Button -->
    <div class="faq-footer">
      <button @click="$emit('goHome')" class="back-home-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 19-7-7 7-7"/>
          <path d="M19 12H5"/>
        </svg>
        {{ $t('faq.backToHome') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['goHome'])
const { t, locale } = useI18n()

const openItems = ref<number[]>([0]) // First item open by default
const faqItems = ref(Array.from({ length: 10 }, (_, i) => i))

const toggleItem = (index: number) => {
  const idx = openItems.value.indexOf(index)
  if (idx > -1) {
    openItems.value.splice(idx, 1)
  } else {
    openItems.value.push(index)
  }
}

// Generate and inject FAQ Structured Data
const generateStructuredData = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.value.map((_, index) => ({
      "@type": "Question",
      "name": t(`faq.questions.q${index + 1}.question`),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": t(`faq.questions.q${index + 1}.answer`)
      }
    }))
  }

  // Remove existing FAQ schema if present
  const existingScript = document.getElementById('faq-structured-data')
  if (existingScript) {
    existingScript.remove()
  }

  // Add new FAQ schema
  const script = document.createElement('script')
  script.id = 'faq-structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(faqSchema)
  document.head.appendChild(script)
}

onMounted(() => {
  generateStructuredData()
  window.scrollTo(0, 0)
})

// Regenerate structured data when language changes
watch(locale, () => {
  generateStructuredData()
})
</script>

<style scoped>
.faq-page {
  min-height: 100vh;
  padding-top: 100px;
}

/* Header */
.faq-header {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1) 0%, rgba(var(--primary-rgb), 0.05) 100%);
  border-bottom: 1px solid var(--border-color);
}

.faq-header-content {
  max-width: 800px;
  margin: 0 auto;
}

.faq-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.faq-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

/* FAQ Content */
.faq-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.faq-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 20px rgba(var(--primary-rgb), 0.1);
}

.faq-item.is-open {
  border-color: var(--primary-color);
  box-shadow: 0 4px 20px rgba(var(--primary-rgb), 0.15);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  gap: 16px;
  transition: background 0.2s ease;
}

.faq-question:hover {
  background: rgba(var(--primary-rgb), 0.05);
}

.question-text {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.question-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--primary-rgb), 0.1);
  border-radius: 50%;
  color: var(--primary-color);
  transition: transform 0.3s ease, background 0.3s ease;
}

.faq-item.is-open .question-icon {
  transform: rotate(180deg);
  background: var(--primary-color);
  color: white;
}

.faq-answer {
  padding: 0 24px 24px;
  animation: slideDown 0.3s ease;
}

.faq-answer p {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-secondary);
  margin: 0;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Footer */
.faq-footer {
  display: flex;
  justify-content: center;
  padding: 40px 20px 80px;
}

.back-home-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-home-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.3);
}

.back-home-btn svg {
  transition: transform 0.3s ease;
}

.back-home-btn:hover svg {
  transform: translateX(-4px);
}

/* Responsive */
@media (max-width: 768px) {
  .faq-page {
    padding-top: 80px;
  }

  .faq-header {
    padding: 40px 16px;
  }

  .faq-content {
    padding: 24px 16px;
  }

  .faq-question {
    padding: 16px 20px;
  }

  .question-text {
    font-size: 0.95rem;
  }

  .faq-answer {
    padding: 0 20px 20px;
  }

  .faq-answer p {
    font-size: 0.95rem;
  }
}
</style>
