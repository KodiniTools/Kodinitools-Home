import { ref } from 'vue';

/**
 * Umschalten zwischen Startseite, Blog und FAQ (App.vue). Genau eine Ansicht
 * ist aktiv; beim Öffnen einer Unterseite und bei „Home" wird nach oben gescrollt.
 */
export function usePageView() {
  const showBlog = ref(false);
  const showFaq = ref(false);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBlog = () => {
    showBlog.value = !showBlog.value;
    showFaq.value = false;
    if (showBlog.value) scrollTop();
  };

  const toggleFaq = () => {
    showFaq.value = !showFaq.value;
    showBlog.value = false;
    if (showFaq.value) scrollTop();
  };

  const goHome = () => {
    showBlog.value = false;
    showFaq.value = false;
    scrollTop();
  };

  return { showBlog, showFaq, toggleBlog, toggleFaq, goHome };
}
