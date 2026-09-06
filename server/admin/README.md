# Kodini Admin-Dienst (`server/admin/`)

Node-Dienst (nur Built-ins, **keine externen npm-Abhängigkeiten**) für den
Adminbereich. Läuft lokal auf `127.0.0.1:9020`, hinter nginx unter `/admin`
bzw. `/admin/api` (nginx entfernt das `/admin`-Präfix). Voller Kontext:
[`../../docs/ADMIN_DEPLOY_PLAN.md`](../../docs/ADMIN_DEPLOY_PLAN.md).

## Dateien

| Datei | Zweck |
|---|---|
| `index.mjs` | HTTP-Server, Routing, statische Auslieferung des Admin-Frontends |
| `config.mjs` | Konfiguration aus Umgebungsvariablen (`/opt/kodini/.env`) |
| `auth.mjs` | Passwort (scrypt), Session-Cookies (HMAC), Login-Bruteforce-Schutz |
| `content.mjs` | Lesen/Schreiben + Validierung von `overrides.*.json` / `ticker.*.json` |
| `uploads.mjs` | Datei-Uploads → `UPLOADS_DIR` (Raw-Body + `X-Filename`) |
| `publish.mjs` | Commit → Push → `deploy.sh` (asynchron, Status-Polling; Deploy-Ausgabe live im Log, Abbruch nach 20 min) |
| `util.mjs` | HTTP-Helfer + `runStreaming` (Prozess mit zeilenweiser Live-Ausgabe und Timeout) |
| `hash-password.mjs` | Erzeugt den scrypt-Hash für `ADMIN_PASSWORD_HASH` |
| `codeupdate.mjs` | Vorschau holt vorher den aktuellen `main`-Code (fast-forward, `npm ci` bei geänderten Abhängigkeiten); erkennt geänderten Server-Code und startet den Dienst unter systemd nach Vorschau/Veröffentlichung selbst neu; persistiert den Vorgangs-Status in `.kodini-admin/` |
| `public/` | Admin-Frontend (Phase 4); u. a. `design.js` (Hero-Design; dreispaltig – Mitte mit Sticky-Vorschau beider Modi, Hero-Texten, Typografie, Button-Text/Beschriftungen; Seitenleisten Hell links / Dunkel rechts mit allen Farben des Modus inkl. Hero-Text-Farben; Regler mit Zahlenfeld + „↺“; „Hero-Design nach EN/DE übertragen“ kopiert alle Einstellungen (Hell + Dunkel) und die Feinabstimmung der Hero-Texte in die andere Sprache, Texte und Beschriftungen bleiben je Sprache; Sektion „Hero-Texte“: Titel/Untertitel/Button-Text samt Feinabstimmung je Text – Schrift, Größe, Farbe Hell/Dunkel, Schatten/Umriss/Deckkraft/Animation – in `media.<lang>.textStyles["hero.*"]`), `content.js` (Tab „Texte“: nur noch Abschnitts-Titel; dreispaltig wie Tool-Karten – Mitte mit Text, Schrift, Größe, Effekten und „Standard für alle Slots“, Seitenleisten Hell links / Dunkel rechts mit Vorschau und Textfarbe je Slot und Modus), `textstyle.js` (gemeinsame Effekt-Felder + Slot-Vorschau für beide Tabs), `background.js` (Seiten-Hintergrund: dreispaltig – Seitenleisten Hell links / Dunkel rechts mit Farbe/Verlauf, Muster, Hintergrundbild und Tönung/Bild der abgesetzten Sektionen je Modus; Mitte mit Sticky-Vorschau, Darstellung/Abstand der Sektionen und Effekten), `sectionmedia.js` (Tab „Medien“, dreispaltig: Mitte Sektionswahl Audio/Bild/Diverse mit Sticky-Vorschau (Hell/Dunkel-Umschalter) und Medium-Slot (Video oder Bild, Zwischenspeicher, Standard) plus Hero-Bereich; links „Design & Diashow“ je Hell/Dunkel – eigener Umriss (Farbe/Dicke; aus = Standard-Rahmen), Eckenradius, Deckkraft, Verdunkelung, „→ Dunkel/Hell kopieren“, „↺ Alles“ – und Diashow nur bei Bildern (weitere Bilder, Takt, Übergangsdauer, Übergang, Pause, Punkte); rechts „Text“ – Text, Schrift, Farbe, Größe, Position (Presets + Ziehen in der Vorschau), Deckkraft, Schatten, Umriss; „Sektions-Design nach EN/DE übertragen“ kopiert Design, Diashow-Takt und Text-Design; Speicherort `media.<lang>.sectionMedia[key]`; Seite: `SectionMediaBlock.astro` + `content.ts` → `getSectionMediaCss`), `viewstate.js` (erhält beim Neu-Rendern eines Tabs Scroll-Position der Seite und der Seitenleisten sowie auf-/zugeklappte Bereiche), `toolcards.js` (Tab „Tool-Karten“: dreispaltig – Seitenleiste Hell links, Seitenleiste Dunkel rechts mit Rahmen/Hintergrund/Bild/Hover/Text-Farben je Modus, Mitte mit Sticky-Live-Vorschau beider Modi, Texten, Typografie und „Design übertragen“; Kartentitel dürfen zwei Zeilen haben (Enter im Titel-Feld, auf zwei Zeilen begrenzt; Vorschau und Seite rendern den Umbruch per `white-space: pre-line`, Listen zeigen „Zeile 1 / Zeile 2“); „Tool-Karten-Design nach EN/DE übertragen“ kopiert An-Schalter, Standard + Einzel-Designs (Hell + Dunkel) und Typografie in die andere Sprache, Karten-Texte bleiben; der Tab schaltet `.app-wide`), `slider.js` (gemeinsamer Regler: Slider + Zahlenfeld + „↺“), `color.js` (Farbwähler: Farbfeld + Hex + HSL-Regler; in allen Design-Tabs inkl. Layout), `layout.js` (Tab „Layout“: Hero-Banner/Raster; dreispaltig wie die anderen Design-Tabs – im Raster-Modus Seitenleiste „Kachel-Inhalte“ links (Bild aus Zwischenablage (Strg/Cmd+V bzw. Button) oder Mediathek mit Bildbearbeitung Deckkraft/Abdunkelung/Weichzeichner/Sättigung, Text, Schriftart) und „Kachel-Design“ rechts (Rahmen, Hintergrund, Textfarbe/-größe/-position, „Standard für alle“), Mitte mit Modus, Sticky-Live-Vorschau, Anordnung und Form; Klick auf eine Vorschau-Kachel scrollt beide Seitenleisten zur Kachel, ohne die Seite zu verschieben. „Kachel-Design nach EN/DE übertragen“ kopiert Anordnung, Form, „Standard für alle“ und das Design aller Kacheln (ohne Text und Bilder) in die andere Sprache. Im Banner-Modus in der Mitte unter der Vorschau „Banner (Bild oder Video)“: Zuweisung aus Zwischenablage (Strg/Cmd+V oder Button), Mediathek oder per Pfad/URL, Entfernen, Verlinkung und Prüfung auf fehlende Server-Datei (ehemals im Medien-Tab, der dort nur noch auf Layout verweist); darunter „Diashow – weitere Bilder“: bis zu 12 zusätzliche Bilder (Zwischenablage/Mediathek, Reihenfolge ↑↓, Entfernen) in `media.<lang>.heroBannerSlides` plus `heroBannerSlideshow` (Anzeigedauer 1–30 s, Übergangsdauer 0–5000 ms, Übergang Überblenden/Schieben/Zoom/Schnitt, Pause bei Mauszeiger, Punkte); die Sticky-Vorschau wechselt die Bilder im Takt. Im Raster-Modus je Kachel „Diashow – weitere Bilder“ (links unter der Kachel, `media.<lang>.heroGridSlides[i]`) und in der Mitte „Diashow der Kacheln“ mit denselben Einstellungen plus „Versetzt wechseln“ (`heroGridSlideshow`). Seite: `HeroSlides.astro` (gemeinsamer Container + Script) über `HeroBannerMedia.astro` bzw. `HeroCellMedia.astro` (hero.css: Übergänge mit `--slide-fade`, Punkte, Kachel-Variante, reduced-motion); gestagte Bilder laufen über `heroSlideImageSlots()`/`allImageSlots()` beim Veröffentlichen; links „Banner-Design“ – je Hell/Dunkel Rahmen (Farbe/Dicke), Eckenradius, Schatten (an/aus, Farbe, Versatz, Weichzeichnung, Deckkraft), Deckkraft und Verdunkelung des Banner-Bildes/-Videos in `media.<lang>.heroBannerStyle.light|dark` (Alt-Format flach = beide Modi; Vorschau mit Hell/Dunkel-Umschalter, springt beim Bearbeiten in den passenden Modus; „→ Dunkel/Hell kopieren“, „Banner-Design nach EN/DE übertragen“; Seite: `content.ts` → `getHeroBannerCss`, Regeln auf `.hero-banner-wrapper .hero-banner` und `[data-theme="dark"] …`, nur Abweichungen vom Standard) – und rechts „Banner-Text“ mit Text, Schrift, Farbe, Größe, Position und allen Text-Effekten sowie „Text-Design nach EN/DE übertragen“ (alles außer dem Text selbst)) |

## Konfiguration

Pflicht (sonst startet der Dienst nicht):
- `ADMIN_PASSWORD_HASH` — via `node server/admin/hash-password.mjs 'PASSWORT'`
- `SESSION_SECRET` — z. B. `openssl rand -hex 32`

Weitere (Defaults siehe `config.mjs` / [`../../deploy/.env.example`](../../deploy/.env.example)):
`PORT`, `REPO_DIR`, `WEBROOT`, `UPLOADS_DIR`, `GIT_BRANCH`, `GIT_REMOTE`,
`MAX_UPLOAD_MB`, `SESSION_TTL_HOURS`.

## API

| Methode | Pfad | Auth | Zweck |
|---|---|---|---|
| POST | `/api/login` | – | Passwort prüfen, Session-Cookie setzen |
| POST | `/api/logout` | – | Session beenden |
| GET  | `/api/session` | – | `{ authenticated: bool, serverCodeChanged: bool }` (letzteres: Prozess läuft mit veraltetem Server-Code) |
| GET  | `/api/content` | ✓ | Overrides + Ticker + Standard-Locales laden |
| PUT  | `/api/content` | ✓ +CSRF | Draft speichern (schreibt Dateien, kein Commit) |
| POST | `/api/upload` | ✓ +CSRF | Datei hochladen (`X-Filename`, Raw-Body) |
| POST | `/api/publish` | ✓ +CSRF | Veröffentlichen: commit → push → deploy.sh |
| GET  | `/api/publish/status` | ✓ | Status der laufenden Veröffentlichung |

**CSRF:** Mutationen erfordern den Header `X-Kodini-Admin: 1` (Cross-Site-
Formulare können keine Custom-Header setzen; zusammen mit `SameSite=Strict`
genügt das für dieses Ein-Konto-Setup).

## Ablauf Speichern vs. Veröffentlichen

- **Speichern** (`PUT /api/content`) schreibt die Draft-Dateien ins
  Arbeitsverzeichnis des Repos — **noch nicht committet**.
- **Veröffentlichen** (`POST /api/publish`) committet die Content-Dateien nach
  `main`, pusht und ruft `deploy.sh`. Der Status ist über
  `/api/publish/status` abrufbar (`idle`/`running`/`success`/`error` + Log).

> Hinweis: `deploy.sh` macht `git reset --hard origin/main`. Ungespeicherte bzw.
> nur-gespeicherte (uncommittete) Drafts würden dadurch verworfen — der
> Publish-Pfad committet aber **vor** dem Deploy, daher ist das im normalen
> Ablauf kein Problem.

## Lokaler Test

```bash
export ADMIN_PASSWORD_HASH="$(node server/admin/hash-password.mjs 'geheim123')"
export SESSION_SECRET="$(openssl rand -hex 16)"
export PORT=9099 NODE_ENV=development
node server/admin/index.mjs
```
