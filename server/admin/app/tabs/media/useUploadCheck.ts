import { ref, watch, type Ref } from 'vue';

/**
 * Prüft per HEAD, ob eine referenzierte `/uploads/…`-Datei auf dem Server liegt
 * (wie `verifyPublishedSlots` in `public/media.js`). `missing` = true nur, wenn
 * die Prüfung lief und fehlschlug; andere URLs werden nicht geprüft.
 */
export function useUploadCheck(url: Ref<string>) {
  const missing = ref(false);
  let seq = 0;
  watch(
    url,
    async (u) => {
      const my = ++seq;
      missing.value = false;
      if (!/^\/uploads\//.test(u)) return;
      let ok: boolean;
      try {
        const r = await fetch(u, { method: 'HEAD', cache: 'no-store' });
        ok = r.ok;
      } catch {
        ok = false;
      }
      if (my === seq) missing.value = !ok;
    },
    { immediate: true },
  );
  return { missing };
}
