import { onMounted, onUnmounted, ref } from 'vue';

/**
 * „Nach oben"-Button (App.vue): sichtbar ab 400 px Scrollweg. Registriert den
 * (passiven) Scroll-Listener beim Mounten und entfernt ihn beim Unmounten –
 * muss daher innerhalb von setup() aufgerufen werden.
 */
export function useScrollTop(threshold = 400) {
  const showScrollTop = ref(false);

  const handleScroll = () => {
    showScrollTop.value = window.scrollY > threshold;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
  });

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', handleScroll);
    }
  });

  return { showScrollTop, scrollToTop };
}
