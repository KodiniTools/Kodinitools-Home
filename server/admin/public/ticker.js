// Laufband-Tab (eine Sprache): Einträge, Design (Farben/Größe/Abstand/Schrift)
// samt Live-Vorschau. Enthält auch die Schrift-Helfer, da diese nur hier
// gebraucht werden.

import { $, esc, api, toast } from './core.js';
import { state, rgbaFromHex, clampSpacing } from './model.js';

// Laufband-Text mit Inline-Links [Wort](url) in sichere HTML-Vorschau wandeln
// (gleiche Regel wie TickerBar.astro; Klicks in der Vorschau navigieren nicht).
const VALID_LINK = /^(\/[^\s]*|https?:\/\/[^\s]+)$/;
function tickerTextToHtml(text) {
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    out += esc(text.slice(last, m.index));
    const [full, label, url] = m;
    if (VALID_LINK.test(url)) {
      out += `<a href="${esc(url)}" style="color:var(--accent);text-decoration:underline" onclick="return false">${esc(label)}</a>`;
    } else {
      out += esc(full);
    }
    last = m.index + full.length;
  }
  out += esc(text.slice(last));
  return out;
}

// Fügt [Wort](url) in den Text eines Eintrags ein (ersetzt das erste Vorkommen
// des Wortes, sonst angehängt). Gibt {ok, msg} zurück.
function insertInlineLink(lang, i, word, url) {
  word = (word || '').trim();
  url = (url || '').trim();
  if (!word || !url) return { ok: false, msg: 'Bitte Wort und Link ausfüllen.' };
  if (!VALID_LINK.test(url))
    return { ok: false, msg: 'Der Link muss mit / (intern) oder http(s):// (extern) beginnen.' };
  const t = state.ticker[lang];
  const text = t.items[i].text || '';
  const md = `[${word}](${url})`;
  const idx = text.indexOf(word);
  t.items[i].text =
    idx >= 0
      ? text.slice(0, idx) + md + text.slice(idx + word.length)
      : text
        ? `${text} ${md}`
        : md;
  return { ok: true };
}

// --- Schriftarten (aus /fonts) ---
// Verfügbare Schriftarten laden (für die Laufband-Schriftauswahl).
export async function loadFonts() {
  const r = await api('/fonts');
  state.fonts = (r.ok && Array.isArray(r.data?.fonts) ? r.data.fonts : []).filter(
    (f) => f && f.name,
  );
}
// Dateiname -> CSS-sicherer Family-Name (identisch zu TickerBar.astro).
function fontFamilyId(file) {
  return (
    'ticker-font-' +
    String(file)
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
  );
}
// @font-face für eine Schriftdatei einmalig in die Admin-Seite einfügen, damit
// die Vorschau die echte Schrift zeigt (Fonts liegen unter /fonts auf der Domain).
function ensureFontFace(file) {
  if (!file) return '';
  const fam = fontFamilyId(file);
  const id = 'ff-' + fam;
  if (!document.getElementById(id)) {
    const ext = (file.split('.').pop() || '').toLowerCase();
    const fmt = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' }[ext] || '';
    const st = document.createElement('style');
    st.id = id;
    st.textContent = `@font-face{font-family:"${fam}";src:url("/fonts/${encodeURIComponent(
      file,
    )}")${fmt ? ` format("${fmt}")` : ''};font-display:swap;}`;
    document.head.appendChild(st);
  }
  return fam;
}

// Options für die Schriftauswahl. Enthält immer "Standard" und die vom Server
// gemeldeten Schriften; eine ausgewählte, aber (noch) nicht gelistete Datei wird
// zusätzlich aufgenommen, damit sie ausgewählt bleibt.
function fontOptionsHtml(current) {
  const list = state.fonts.slice();
  if (current && !list.some((f) => f.name === current)) {
    list.unshift({ name: current, label: current + ' (nicht gefunden)' });
  }
  const opts = [`<option value="" ${!current ? 'selected' : ''}>Standard (System)</option>`];
  for (const f of list) {
    opts.push(
      `<option value="${esc(f.name)}" ${f.name === current ? 'selected' : ''}>${esc(
        f.label || f.name,
      )}</option>`,
    );
  }
  return opts.join('');
}

// --- Laufband (eine Sprache) ---
export function renderTicker() {
  const pane = $('#content');
  pane.innerHTML = tickerPanel(state.nav.section);
  pane.querySelectorAll('[data-tk]').forEach(bindTickerControl);
  bindInlineLinkHelper(pane);
  bindTickerStyle(pane);
}

// „Wort verlinken"-Helfer je Eintrag: fügt [Wort](url) in den Text ein.
function bindInlineLinkHelper(pane) {
  pane.querySelectorAll('[data-tkins="go"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      const i = parseInt(btn.dataset.i, 10);
      const word = pane.querySelector(`[data-tkins="word"][data-i="${i}"]`)?.value;
      const url = pane.querySelector(`[data-tkins="url"][data-i="${i}"]`)?.value;
      const r = insertInlineLink(lang, i, word, url);
      if (!r.ok) {
        toast(r.msg);
        return;
      }
      renderTicker();
      toast('Wort verlinkt ✓ – zum Übernehmen veröffentlichen');
    });
  });
}

// Vorschau-Style des Laufbands. Zeigt IMMER die aktuell eingestellten Werte
// (reagiert also live auf jede Änderung), unabhängig vom „Eigenes Design"-Schalter.
// Der Schalter entscheidet nur, ob dieses Design auf der Seite angewandt wird
// (siehe tickerPreviewNote); die Vorschau ist das Design-Werkzeug dafür.
function tickerPreviewStyle(s) {
  const bg = rgbaFromHex(s.bgColor, s.bgOpacity);
  const fg = s.textColor;
  const fs = `${s.fontSize}px`;
  let ff = '';
  if (s.fontFamily) {
    const fam = ensureFontFace(s.fontFamily); // @font-face in die Seite laden
    ff = `font-family:"${fam}", system-ui, sans-serif;`;
  }
  const ls = `letter-spacing:${Number(s.letterSpacing) || 0}px;`;
  return `background:${bg};color:${fg};font-size:${fs};${ff}${ls}font-weight:500;padding:8px 14px;border-radius:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`;
}

// Hinweis unter der Vorschau: macht klar, ob das Design tatsächlich live geht.
function tickerPreviewNote(s) {
  return s.enabled
    ? '✅ Dieses Design wird auf der Seite angewandt.'
    : '⚠️ „Eigenes Design verwenden" ist aus – auf der Seite erscheint das Standard-Design (Blau). Die Vorschau zeigt dein eingestelltes Design.';
}

// Design-Abschnitt für EINE Sprache (in tickerPanel eingebettet).
function tickerStyleSection(lang) {
  const s = state.ticker[lang].style;
  return `
      <details style="margin-top:1rem;border-top:1px solid var(--border);padding-top:.75rem">
        <summary style="cursor:pointer;font-weight:600">🎨 Design (${lang.toUpperCase()})</summary>
        <p class="hint" style="margin-top:.4rem">Nur für ${lang === 'de' ? 'Deutsch' : 'Englisch'}. Ausgeschaltet = Standard-Design (Blau, passt sich Dark Mode an).</p>
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin-top:.4rem">
          <input type="checkbox" data-tks="enabled" data-lang="${lang}" ${s.enabled ? 'checked' : ''} style="width:auto" /> Eigenes Design verwenden
        </label>
        <div class="row" style="margin-top:.6rem;align-items:flex-end">
          <div style="flex:0 0 auto">
            <label>Schriftgröße (px)</label>
            <input type="number" data-tks="fontSize" data-lang="${lang}" min="8" max="48" value="${s.fontSize}" style="width:90px" />
          </div>
          <div style="flex:0 0 auto">
            <label>Buchstabenabstand (px)</label>
            <input type="number" data-tks="letterSpacing" data-lang="${lang}" min="-5" max="20" step="0.5" value="${s.letterSpacing}" style="width:90px" />
          </div>
          <div style="flex:0 0 auto">
            <label>Schriftfarbe</label>
            <input type="color" data-tks="textColor" data-lang="${lang}" value="${esc(s.textColor)}" style="width:56px;height:38px;padding:2px" />
          </div>
          <div style="flex:0 0 auto">
            <label>Hintergrundfarbe</label>
            <input type="color" data-tks="bgColor" data-lang="${lang}" value="${esc(s.bgColor)}" style="width:56px;height:38px;padding:2px" />
          </div>
          <div style="flex:1 1 180px">
            <label>Transparenz Hintergrund: <span data-tks-oval data-lang="${lang}">${s.bgOpacity}</span>% <span class="hint">(0 = ganz durchsichtig)</span></label>
            <input type="range" data-tks="bgOpacity" data-lang="${lang}" min="0" max="100" value="${s.bgOpacity}" style="width:100%" />
          </div>
        </div>
        <div class="row" style="margin-top:.6rem">
          <div style="flex:1 1 240px">
            <label>Schriftart</label>
            <select data-tks="fontFamily" data-lang="${lang}">${fontOptionsHtml(s.fontFamily)}</select>
            <p class="hint">Aus dem Ordner <code>/fonts</code> auf dem Server. Eigene Schriften einfach dorthin legen.</p>
          </div>
        </div>
        <p class="hint" style="margin-top:.8rem">Vorschau:</p>
        <div data-tks-preview data-lang="${lang}" style="${tickerPreviewStyle(s)}">Immer die besten Tools für deine Aufgaben – Beispieltext</div>
        <p class="hint" data-tks-note data-lang="${lang}" style="margin-top:.4rem">${tickerPreviewNote(s)}</p>
      </details>`;
}

function bindTickerStyle(pane) {
  pane.querySelectorAll('[data-tks]').forEach((el) => {
    const field = el.dataset.tks;
    const lang = el.dataset.lang;
    const evt = el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const s = state.ticker[lang].style;
      if (field === 'enabled') s.enabled = el.checked;
      else if (field === 'fontSize')
        s.fontSize = Math.max(8, Math.min(48, parseInt(el.value, 10) || 14));
      else if (field === 'letterSpacing') s.letterSpacing = clampSpacing(el.value, 0);
      else if (field === 'bgOpacity') {
        s.bgOpacity = Math.max(0, Math.min(100, parseInt(el.value, 10) || 0));
        const oval = pane.querySelector(`[data-tks-oval][data-lang="${lang}"]`);
        if (oval) oval.textContent = s.bgOpacity;
      } else s[field] = el.value; // Farben
      const preview = pane.querySelector(`[data-tks-preview][data-lang="${lang}"]`);
      if (preview) preview.setAttribute('style', tickerPreviewStyle(s));
      const note = pane.querySelector(`[data-tks-note][data-lang="${lang}"]`);
      if (note) note.textContent = tickerPreviewNote(s);
    });
  });
}

function tickerPanel(lang) {
  const t = state.ticker[lang];
  const items = t.items
    .map(
      (it, i) => `
      <div class="tick-item">
        <div class="idx">${i + 1}</div>
        <div class="grow">
          <input data-tk="text" data-lang="${lang}" data-i="${i}" placeholder="Text" value="${esc(it.text)}" />
          <div class="hint" style="margin:.35rem 0 0">So sieht der Eintrag aus: <span data-tkprev data-lang="${lang}" data-i="${i}" style="color:var(--text)">${tickerTextToHtml(it.text) || '—'}</span></div>
          <div style="border:1px dashed var(--border);border-radius:8px;padding:.5rem;margin-top:.4rem">
            <div class="hint" style="margin:0 0 .3rem">🔗 Ein Wort im Text verlinken:</div>
            <div class="row" style="gap:.3rem;align-items:flex-end">
              <input data-tkins="word" data-lang="${lang}" data-i="${i}" placeholder="Wort im Text (z.B. aktuell)" style="flex:1 1 130px" />
              <input data-tkins="url" data-lang="${lang}" data-i="${i}" placeholder="Ziel: /faq/ oder https://…" style="flex:1 1 150px" />
              <button data-tkins="go" data-lang="${lang}" data-i="${i}" style="flex:0 0 auto">Wort verlinken</button>
            </div>
          </div>
          <input data-tk="link" data-lang="${lang}" data-i="${i}" placeholder="Optional: GANZEN Eintrag verlinken (z.B. /faq/)" value="${esc(it.link || '')}" style="margin-top:.4rem" />
        </div>
        <div class="btns">
          <button data-tk="up" data-lang="${lang}" data-i="${i}" title="nach oben">▲</button>
          <button data-tk="down" data-lang="${lang}" data-i="${i}" title="nach unten">▼</button>
          <button class="danger" data-tk="del" data-lang="${lang}" data-i="${i}" title="löschen">✕</button>
        </div>
      </div>`,
    )
    .join('');
  return `
    <div class="panel">
      <h2>Laufband <span class="lang-badge">${lang.toUpperCase()}</span></h2>
      <div class="row">
        <div style="flex:0 0 auto">
          <label>Aktiv</label>
          <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)">
            <input type="checkbox" data-tk="enabled" data-lang="${lang}" ${t.enabled ? 'checked' : ''} style="width:auto" /> anzeigen
          </label>
        </div>
        <div style="flex:0 0 auto">
          <label>Tempo</label>
          <select data-tk="speed" data-lang="${lang}" style="width:auto">
            <option value="slow" ${t.speed === 'slow' ? 'selected' : ''}>langsam</option>
            <option value="normal" ${t.speed === 'normal' ? 'selected' : ''}>normal</option>
            <option value="fast" ${t.speed === 'fast' ? 'selected' : ''}>schnell</option>
          </select>
        </div>
      </div>
      <label>Einträge</label>
      <p class="hint" style="margin-top:0">
        Schreibe oben den Text. Um <strong>ein Wort</strong> anklickbar zu machen: das Wort und das Ziel im
        Kasten „🔗 Ein Wort im Text verlinken" eintragen und auf <strong>Wort verlinken</strong> klicken –
        die Vorschau zeigt sofort das Ergebnis. Das unterste Feld macht dagegen den <strong>ganzen</strong> Eintrag klickbar.
      </p>
      ${items || '<p class="hint">Noch keine Einträge.</p>'}
      <button data-tk="add" data-lang="${lang}" style="margin-top:.5rem">+ Eintrag hinzufügen</button>
      ${tickerStyleSection(lang)}
    </div>`;
}

function bindTickerControl(el) {
  const kind = el.dataset.tk;
  const lang = el.dataset.lang;
  const i = el.dataset.i != null ? parseInt(el.dataset.i, 10) : null;
  const t = state.ticker[lang];
  if (kind === 'enabled') el.addEventListener('change', () => (t.enabled = el.checked));
  else if (kind === 'speed') el.addEventListener('change', () => (t.speed = el.value));
  else if (kind === 'text')
    el.addEventListener('input', () => {
      t.items[i].text = el.value;
      const prev = document.querySelector(`[data-tkprev][data-lang="${lang}"][data-i="${i}"]`);
      if (prev) prev.innerHTML = tickerTextToHtml(el.value) || '—';
    });
  else if (kind === 'link') el.addEventListener('input', () => (t.items[i].link = el.value));
  else if (kind === 'add')
    el.addEventListener('click', () => {
      t.items.push({ id: String(Date.now()), text: '', link: '' });
      renderTicker();
    });
  else if (kind === 'del')
    el.addEventListener('click', () => {
      t.items.splice(i, 1);
      renderTicker();
    });
  else if (kind === 'up')
    el.addEventListener('click', () => {
      if (i > 0) {
        [t.items[i - 1], t.items[i]] = [t.items[i], t.items[i - 1]];
        renderTicker();
      }
    });
  else if (kind === 'down')
    el.addEventListener('click', () => {
      if (i < t.items.length - 1) {
        [t.items[i + 1], t.items[i]] = [t.items[i], t.items[i + 1]];
        renderTicker();
      }
    });
}
