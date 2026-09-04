import { computed, ref } from 'vue';

/**
 * Maus-Spotlight (App.vue): Position in Prozent des Viewports, per
 * requestAnimationFrame gedrosselt; Farbe je nach aktivem Theme.
 * `handleMouseMove` an das Wurzelelement binden, `spotlightStyle` an die Ebene.
 */
export function useSpotlight() {
  const mouseX = ref(50);
  const mouseY = ref(50);

  const spotlightStyle = computed(() => {
    // Check current theme for appropriate spotlight color
    const isDark =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark';
    const spotlightColor = isDark ? 'rgba(201, 152, 77, 0.15)' : 'rgba(1, 79, 153, 0.20)';
    return {
      background: `radial-gradient(1200px circle at ${mouseX.value}% ${mouseY.value}%, ${spotlightColor}, transparent 45%)`,
    };
  });

  let mouseMoveRaf: number | null = null;

  const handleMouseMove = (e: MouseEvent) => {
    if (typeof window === 'undefined') return;
    if (mouseMoveRaf !== null) return;

    mouseMoveRaf = requestAnimationFrame(() => {
      mouseMoveRaf = null;
      // Update spotlight position (percentage of viewport)
      mouseX.value = (e.clientX / window.innerWidth) * 100;
      mouseY.value = (e.clientY / window.innerHeight) * 100;
    });
  };

  return { mouseX, mouseY, spotlightStyle, handleMouseMove };
}
