// Speichern (Entwurf), Veröffentlichen (Upload + Commit + Deploy) und die
// Browser-Vorschau (Build ohne Deploy). Enthält den Status-Tab, das Polling und
// die Verdrahtung der Kopf-Buttons (Speichern/Vorschau/Veröffentlichen).

import { $, esc, api, toast, mediaGet } from './core.js';
import {
  state,
  MEDIA_LANGS,
  MEDIA_KEYS,
  LANG_SECTIONS,
  getMediaVal,
  setMediaVal,
  defMediaVal,
  defaultMediaLocale,
  normTickerStyle,
} from './model.js';
import { loadServerFiles, renderFiles, renderMedia } from './media.js';
import { goto } from './admin.js';

// ============ Veröffentlichen (Status + Aktion) ============
export function renderPublish() {
  const pane = $('#content');
  pane.innerHTML = `
    <div class="panel">
      <h2>Veröffentlichen</h2>
      <p class="hint">Speichert die Inhalte, lädt lokale Medien hoch, committet nach <code>main</code>
        und startet den Deploy auf den Server. Dauert typischerweise 1–2 Minuten.</p>
      <label>Notiz (optional)</label>
      <input id="pubMsg" placeholder="z.B. Neue Hero-Texte" />
      <div class="row" style="margin-top:.75rem;align-items:center;gap:.75rem">
        <button class="success" id="pubNow" style="flex:0 0 auto" ${state.publishing ? 'disabled' : ''}>🚀 Jetzt veröffentlichen</button>
        <span>Status: <span class="pill idle" id="pubPill2">bereit</span></span>
      </div>
      <p class="hint" style="margin-top:.5rem">Tipp: Dieselbe Aktion löst auch der grüne Button oben rechts aus. Diese Seite zeigt nur den Fortschritt.</p>
      <div class="status" id="pubLog">—</div>
    </div>`;
  $('#pubNow').addEventListener('click', runPublish);
}

// --- Speichern (Draft) ---
function resolveMediaForSave() {
  // Ersetzt staged:-Referenzen (pro Sprache) durch bereits veröffentlichte URLs
  // oder (falls noch nicht hochgeladen) durch den zuletzt geladenen/Default-Wert.
  const m = JSON.parse(JSON.stringify(state.media));
  for (const lang of MEDIA_LANGS) {
    const lm = m[lang];
    const loaded = state.loadedMedia[lang] || defaultMediaLocale();
    for (const key of ['audio', 'image', 'diverse']) {
      const v = lm.sectionVideos[key];
      if (typeof v === 'string' && v.startsWith('staged:')) {
        const item = state.stagedItems.find((x) => x.id === v.slice(7));
        lm.sectionVideos[key] =
          (item && item.publishedUrl) || loaded.sectionVideos[key] || defMediaVal(key);
      }
    }
    if (typeof lm.heroBanner === 'string' && lm.heroBanner.startsWith('staged:')) {
      const item = state.stagedItems.find((x) => x.id === lm.heroBanner.slice(7));
      lm.heroBanner = (item && item.publishedUrl) || loaded.heroBanner || '';
    }
    if (Array.isArray(lm.heroGrid)) {
      for (let i = 0; i < lm.heroGrid.length; i++) {
        const v = lm.heroGrid[i];
        if (typeof v === 'string' && v.startsWith('staged:')) {
          const item = state.stagedItems.find((x) => x.id === v.slice(7));
          lm.heroGrid[i] =
            (item && item.publishedUrl) || (loaded.heroGrid && loaded.heroGrid[i]) || '';
        }
      }
    }
  }
  return m;
}

function buildPayload(media) {
  return {
    overrides: state.overrides,
    ticker: {
      de: cleanTicker(state.ticker.de),
      en: cleanTicker(state.ticker.en),
    },
    media: media || resolveMediaForSave(),
  };
}
function cleanTicker(t) {
  return {
    enabled: t.enabled === true,
    speed: t.speed,
    items: t.items
      .filter((i) => i.text && i.text.trim())
      .map((i, idx) => {
        const o = { id: String(i.id || idx + 1), text: i.text.trim() };
        if (i.link && i.link.trim()) o.link = i.link.trim();
        return o;
      }),
    // Design pro Sprache.
    style: normTickerStyle(t.style),
  };
}

async function saveDraft() {
  const r = await api('/content', { method: 'PUT', body: buildPayload() });
  if (r.ok) {
    state.loadedMedia = JSON.parse(JSON.stringify(r.data.saved.media));
    return true;
  }
  toast('Speichern fehlgeschlagen: ' + (r.data?.error || r.status));
  return false;
}

$('#saveBtn').addEventListener('click', async () => {
  $('#saveBtn').disabled = true;
  if (await saveDraft()) toast('Als Entwurf gespeichert ✓');
  $('#saveBtn').disabled = false;
});

// --- Veröffentlichen ---
async function uploadStagedReferenced() {
  // Lädt jedes in einem Slot referenzierte staged Medium in den Ordner SEINER
  // Sprache (/uploads/<lang>/) hoch und ersetzt die staged:-Referenz durch die
  // endgültige URL. Ein Medium, das in DE und EN genutzt wird, kommt in beide
  // Ordner (getrennte Galerien). Pro (Sprache, Datei) wird nur einmal geladen.
  const cache = new Map(); // "lang:id" -> url
  for (const lang of MEDIA_LANGS) {
    for (const key of MEDIA_KEYS) {
      const v = getMediaVal(lang, key);
      if (typeof v !== 'string' || !v.startsWith('staged:')) continue;
      const id = v.slice(7);
      const cacheKey = lang + ':' + id;
      let url = cache.get(cacheKey);
      if (!url) {
        const item = await mediaGet(id);
        if (!item) continue;
        const r = await api('/upload', {
          method: 'POST',
          raw: item.blob,
          headers: {
            'X-Filename': item.name,
            'X-Lang': lang,
            'Content-Type': item.type || 'application/octet-stream',
          },
        });
        if (!r.ok) throw new Error(`Upload ${item.name}: ${r.data?.error || r.status}`);
        url = r.data.url;
        cache.set(cacheKey, url);
      }
      setMediaVal(lang, key, url);
    }
  }
  await loadServerFiles();
}

let pollTimer;
// Der eigentliche Veröffentlichen-Ablauf. Wird vom grünen Kopf-Button UND vom
// Button auf der Status-Seite genutzt (beide lösen dasselbe aus).
async function runPublish() {
  if (state.publishing) return;
  state.publishing = true;
  $('#publishBtn').disabled = true;
  const pn = $('#pubNow');
  if (pn) pn.disabled = true;
  setPill('running', 'lädt Medien…');
  try {
    await uploadStagedReferenced();
    const media = resolveMediaForSave();
    // Save mit finalen URLs
    const put = await api('/content', { method: 'PUT', body: buildPayload(media) });
    if (!put.ok) throw new Error(put.data?.error || 'Speichern fehlgeschlagen');
    state.loadedMedia = JSON.parse(JSON.stringify(media));
    // Publish starten
    const msg = ($('#pubMsg')?.value || '').slice(0, 100);
    const pub = await api('/publish', { method: 'POST', body: { message: msg } });
    if (!pub.ok) throw new Error(pub.data?.error || 'Publish fehlgeschlagen');
    // In den Status-Bereich wechseln und pollen
    goto('publish');
    startPolling();
  } catch (e) {
    state.publishing = false;
    setPill('error', 'Fehler');
    const log = $('#pubLog');
    if (log) log.textContent = String(e.message || e);
    $('#publishBtn').disabled = false;
  }
}
$('#publishBtn').addEventListener('click', runPublish);

// --- Vorschau (Build ohne Deploy, öffnet die gerenderte Seite in neuem Tab) ---
let previewPollTimer;
$('#previewBtn').addEventListener('click', async () => {
  // Neuen Tab SOFORT (synchron zum Klick) öffnen, sonst blockt der Popup-Blocker
  // das spätere Navigieren nach dem asynchronen Build.
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(
      '<!doctype html><meta charset="utf-8"><title>Vorschau wird erstellt…</title>' +
        '<body style="font-family:system-ui;background:#0f172a;color:#e2e8f0;padding:2rem;line-height:1.6">' +
        '<p>🛠️ <strong>Vorschau wird gebaut …</strong></p>' +
        '<p>Das dauert typischerweise 15–40 Sekunden. Dieses Fenster lädt die ' +
        'Vorschau automatisch, sobald sie fertig ist.</p></body>',
    );
  }
  $('#previewBtn').disabled = true;
  $('#publishBtn').disabled = true;
  setPill('running', 'Vorschau…');
  try {
    await uploadStagedReferenced();
    const media = resolveMediaForSave();
    const put = await api('/content', { method: 'PUT', body: buildPayload(media) });
    if (!put.ok) throw new Error(put.data?.error || 'Speichern fehlgeschlagen');
    state.loadedMedia = JSON.parse(JSON.stringify(media));
    const pv = await api('/preview', { method: 'POST' });
    if (!pv.ok) throw new Error(pv.data?.error || 'Vorschau-Build fehlgeschlagen');
    pollPreview(win);
  } catch (e) {
    setPill('error', 'Fehler');
    if (win)
      win.document.body.innerHTML =
        '<p style="font-family:system-ui;color:#fecaca;padding:2rem">Fehler: ' +
        esc(String(e.message || e)) +
        '</p>';
    toast('Vorschau: ' + (e.message || e));
    $('#previewBtn').disabled = false;
    $('#publishBtn').disabled = false;
  }
});

function pollPreview(win) {
  clearInterval(previewPollTimer);
  previewPollTimer = setInterval(async () => {
    const r = await api('/preview/status');
    if (!r.ok) return;
    const s = r.data;
    setPill(s.status, s.status === 'running' ? 'Vorschau… (' + (s.step || '') + ')' : s.status);
    if (s.status !== 'success' && s.status !== 'error') return;
    clearInterval(previewPollTimer);
    $('#previewBtn').disabled = false;
    $('#publishBtn').disabled = false;
    if (s.status === 'success') {
      setPill('idle', 'bereit');
      showPreviewChooser(win);
      toast('Vorschau bereit ✓');
    } else {
      if (win)
        win.document.body.innerHTML =
          '<pre style="font-family:ui-monospace;color:#fecaca;padding:1rem;white-space:pre-wrap">' +
          esc((s.log || []).join('\n') || s.error || 'Build-Fehler') +
          '</pre>';
      toast('Vorschau fehlgeschlagen');
    }
  }, 2000);
}

// Nach erfolgreichem Vorschau-Build: Auswahl beider Sprachen anbieten
// (die DE- und die EN-Startseite haben getrennte Medien/Inhalte).
function showPreviewChooser(win) {
  const base = '/admin/preview/';
  if (!win) {
    // Popup wurde blockiert -> beide Seiten direkt öffnen.
    window.open(base, '_blank');
    window.open(base + 'en/', '_blank');
    return;
  }
  const btn =
    'display:inline-block;padding:.85rem 1.5rem;margin:.35rem;border-radius:10px;' +
    'background:#38bdf8;color:#062a3a;font-weight:700;text-decoration:none';
  win.document.open();
  win.document.write(
    '<!doctype html><meta charset="utf-8"><title>Vorschau</title>' +
      '<body style="font-family:system-ui;background:#0f172a;color:#e2e8f0;padding:3rem 1rem;text-align:center;line-height:1.6">' +
      '<h2>Vorschau bereit ✓</h2>' +
      '<p>Welche Startseite möchtest du prüfen?</p>' +
      `<p><a href="${base}" style="${btn}">🇩🇪 Deutsche Startseite</a>` +
      `<a href="${base}en/" style="${btn}">🇬🇧 English homepage</a></p>` +
      '<p style="color:#94a3b8;font-size:.85rem;margin-top:1.5rem">' +
      'Dies ist dein aktueller Entwurf – noch nicht veröffentlicht.</p></body>',
  );
  win.document.close();
}

function setPill(cls, text) {
  for (const id of ['#pubPill', '#pubPill2']) {
    const el = $(id);
    if (el) {
      el.className = 'pill ' + cls;
      el.textContent = text;
    }
  }
}

function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(refreshPublishStatus, 1500);
  refreshPublishStatus();
}

export async function refreshPublishStatus() {
  const r = await api('/publish/status');
  if (!r.ok) return;
  const s = r.data;
  setPill(s.status, statusLabel(s));
  const log = $('#pubLog');
  if (log) log.textContent = (s.log || []).join('\n') || '—';
  if (s.status === 'success' || s.status === 'error') {
    clearInterval(pollTimer);
    state.publishing = false;
    $('#publishBtn').disabled = false;
    const pn = $('#pubNow');
    if (pn) pn.disabled = false;
    if (s.status === 'success') {
      toast('Veröffentlicht ✓');
      // Server-Dateiliste aktualisieren (neue Uploads sind jetzt live).
      loadServerFiles().then(() => {
        if (!LANG_SECTIONS.includes(state.nav.section)) return;
        if (state.nav.sub === 'files') renderFiles();
        else if (state.nav.sub === 'media') renderMedia();
      });
    }
  }
}
function statusLabel(s) {
  if (s.status === 'running') return 'läuft… (' + (s.step || '') + ')';
  if (s.status === 'success') return 'veröffentlicht';
  if (s.status === 'error') return 'Fehler';
  return 'bereit';
}
