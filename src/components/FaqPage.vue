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
            :aria-expanded="String(openItems.includes(index))"
            @click="toggleItem(index)"
          >
            <span class="question-text">{{ $t(`faq.questions.q${index + 1}.question`) }}</span>
            <span class="question-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </span>
          </button>
          <div v-show="openItems.includes(index)" class="faq-answer">
            <p>{{ $t(`faq.questions.q${index + 1}.answer`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Back to Home Button -->
    <div class="faq-footer">
      <button class="back-home-btn" @click="$emit('goHome')">
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
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

defineEmits(['goHome'])
const { t, locale } = useI18n()

const openItems = ref<number[]>([0])
const faqItems = ref(Array.from({ length: 18 }, (_, i) => i))

const toggleItem = (index: number) => {
  const idx = openItems.value.indexOf(index)
  if (idx > -1) {
    openItems.value.splice(idx, 1)
  } else {
    openItems.value.push(index)
  }
}

const injectSchema = () => {
  const existing = document.getElementById('faq-structured-data')
  if (existing) existing.remove()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.value.map((_, i) => ({
      '@type': 'Question',
      name: t(`faq.questions.q${i + 1}.question`),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t(`faq.questions.q${i + 1}.answer`),
      },
    })),
  }

  const script = document.createElement('script')
  script.id = 'faq-structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(schema)
  document.head.appendChild(script)
}

const removeSchema = () => {
  document.getElementById('faq-structured-data')?.remove()
}

onMounted(() => {
  injectSchema()
  window.scrollTo(0, 0)
})

onUnmounted(() => {
  removeSchema()
})

watch(locale, () => {
  injectSchema()
})
</script>

<style scoped>
.faq-page {
  max-width: 820px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  color: var(--text-color);
  min-height: 100vh;
}

/* Header */
.faq-header {
  text-align: center;
  padding: 2rem 1.5rem;
  background: var(--gradient-1);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  color: white;
}

.faq-header-content {
  max-width: 800px;
  margin: 0 auto;
}

.faq-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.6rem 0;
  line-height: 1.25;
  color: white;
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: unset;
  background-clip: unset;
}

.faq-subtitle {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
  line-height: 1.5;
}

/* FAQ Content */
.faq-content {
  max-width: 820px;
  margin: 0 auto;
  padding: 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.faq-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.faq-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 15px rgba(0, 57, 113, 0.1);
}

.faq-item.is-open {
  border-color: var(--primary-color);
  box-shadow: 0 4px 15px rgba(0, 57, 113, 0.12);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.15rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  gap: 0.75rem;
  transition: background 0.2s ease;
}

.faq-question:hover {
  background: rgba(1, 79, 153, 0.05);
}

.question-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.4;
}

.question-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(1, 79, 153, 0.1);
  border-radius: 50%;
  color: var(--primary-color);
  transition: transform 0.3s ease, background 0.3s ease;
}

.question-icon svg {
  width: 16px;
  height: 16px;
}

.faq-item.is-open .question-icon {
  transform: rotate(180deg);
  background: var(--primary-color);
  color: white;
}

.faq-answer {
  padding: 0 1.15rem 1.15rem;
  animation: slideDown 0.3s ease;
}

.faq-answer p {
  font-size: 0.83rem;
  line-height: 1.65;
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
  text-align: center;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.back-home-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--primary-color);
  background: rgba(1, 79, 153, 0.08);
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0.85rem;
  transition: all 0.2s;
}

.back-home-btn:hover {
  color: #fff;
  background: var(--primary-color);
  transform: translateY(-2px);
}

.back-home-btn svg {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
}

.back-home-btn:hover svg {
  transform: translateX(-4px);
}

/* Dark Mode Support */
[data-theme="dark"] .faq-item:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .faq-item.is-open {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .back-home-btn {
  background: rgba(201, 152, 77, 0.08);
}

[data-theme="dark"] .back-home-btn:hover {
  color: #091428;
}

/* Responsive */
@media (max-width: 768px) {
  .faq-page {
    padding: 1rem 0.75rem;
  }

  .faq-title {
    font-size: 1.35rem;
  }

  .faq-subtitle {
    font-size: 0.8rem;
  }

  .faq-question {
    padding: 0.85rem 1rem;
  }

  .question-text {
    font-size: 0.83rem;
  }

  .faq-answer {
    padding: 0 1rem 1rem;
  }

  .faq-answer p {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .faq-page {
    padding: 0.75rem 0.5rem;
  }

  .faq-header {
    padding: 1.25rem 1rem;
    border-radius: 10px;
  }

  .faq-title {
    font-size: 1.15rem;
  }

  .faq-subtitle {
    font-size: 0.75rem;
  }

  .faq-question {
    padding: 0.75rem 0.85rem;
    min-height: 44px;
  }

  .question-text {
    font-size: 0.78rem;
  }

  .question-icon {
    width: 22px;
    height: 22px;
  }

  .question-icon svg {
    width: 14px;
    height: 14px;
  }

  .faq-answer {
    padding: 0 0.85rem 0.85rem;
  }

  .faq-answer p {
    font-size: 0.75rem;
  }

  .faq-footer {
    padding: 1rem;
  }

  .back-home-btn {
    font-size: 0.75rem;
    min-height: 44px;
  }
}
</style>
