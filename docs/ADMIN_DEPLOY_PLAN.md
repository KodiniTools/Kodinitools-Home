# Plan: Adminbereich + Server-Deploy für kodinitools.com

> Status: **Planung / Vorbereitung** – noch keine Umsetzung.
> Entscheidungen (mit Inhaber abgestimmt):
> 1. **Publish-Flow:** Commit in `main` + Rebuild + Deploy
> 2. **Medien:** Server-Uploads-Ordner (außerhalb Git)
> 3. **Admin-Backend:** Eigener Node-Dienst am Server (systemd) hinter nginx

---

## 1. Ist-Zustand

- **Stack:** Astro 5 + Vue 3 + vue-i18n, statischer Build (`npm run build` → `dist/`).
- **Inhalte** kommen heute aus:
  - `src/locales/de.json` & `src/locales/en.json` (Texte, Tool-Karten, Hero, Footer, `videoShowcase`, FAQ, Blog …) – **Single Source of Truth**, wird beim Build fest eingebacken.
  - `.astro`-Seiten (`src/pages/index.astro`, `faq.astro`, `blog/*`, `en/*`).
  - Bilder/SVGs in `public/image/`.
- **Tool-Apps** (`/audiokonverter/`, `/visualizer/` …) sind **eigenständige Apps**, die *nicht* von Astro gebaut werden. Sie liegen direkt auf dem Server unter `/var/www/kodinitools.com/<tool>/`.
- **Kein Backend, keine CI, kein Deploy-Skript** vorhanden.
- Deploy-Ziel: `/var/www/kodinitools.com` (Inhaber hat Serverzugang).

> ⚠️ **Wichtige Konsequenz:** Der Astro-Build erzeugt nur die "Shell" (Home, Blog, FAQ). Ein naives `rsync --delete dist/ → Webroot` würde **alle Tool-Apps und Uploads löschen**. Das Deploy-Skript muss diese Verzeichnisse zwingend ausschließen (siehe §6).

---

## 2. Zielarchitektur (Überblick)

```mermaid
flowchart TD
    subgraph Browser["Browser (nur Inhaber)"]
        A[Öffentliche Seite<br/>kodinitools.com] -- "Tastenkombi<br/>Strg+Shift+Alt+K" --> B[Verstecktes Login-Modal]
        B -- Passwort --> C[Admin-Overlay:<br/>Inline-Editing Texte/Bilder/Videos]
    end

    subgraph Server["Server (Inhaber-Zugang)"]
        N[nginx] -->|/*| WR[/var/www/kodinitools.com<br/>statische Seite + Tools + uploads/]
        N -->|/admin, /admin/api| SVC[Node-Admin-Dienst<br/>systemd: kodini-admin]
        SVC --> REPO[Git-Clone des Repos<br/>/opt/kodini/repo]
        SVC --> UP[uploads/ Ordner]
        REPO -->|deploy.sh| WR
    end

    C -->|Speichern lokal| SVC
    C -->|"Veröffentlichen"| SVC
    SVC -->|1. content.json schreiben| REPO
    SVC -->|2. commit + push| GH[(GitHub main)]
    SVC -->|3. deploy.sh ausführen| REPO
    GH -.-> REPO
```

**Kurzform des Ablaufs beim „Veröffentlichen":**
1. Admin bearbeitet Inhalte im Browser-Overlay → speichert (Zwischenstand am Server).
2. Klick auf **Veröffentlichen**:
   - Backend schreibt geänderte Inhalte in die Content-JSON(s) im Git-Clone.
   - Backend `git commit` + `git push origin main`.
   - Backend ruft `deploy.sh` auf → `git pull`, `npm ci`, `npm run build`, `rsync` nach Webroot (Tools + uploads bleiben erhalten).
3. Nach ~1–2 Min ist die Seite live aktualisiert.

---

## 3. Content-Modell (was wird editierbar?)

Editierbare Inhalte werden in **strukturierten, klar abgegrenzten Content-Dateien** gehalten, damit der Admin sie gefahrlos überschreiben kann, ohne Code anzufassen.

Vorgeschlagene neue Struktur (`src/content/`):

| Datei | Inhalt |
|---|---|
| `src/content/home.de.json` / `home.en.json` | Hero-Titel/-Text/-CTA, `videoShowcase` (Video-URLs/Poster), Promo-Texte |
| `src/content/tools.de.json` / `.en.json` | Tool-Karten (Titel, Beschreibung, Badge, Link) – migriert aus `locales/*.json` |
| `src/content/ticker.de.json` / `ticker.en.json` | **Lauftext-Einträge** (mehrere) für das Laufband unter der Navigation |
| `src/content/blog/*.md` (optional Phase 2) | Blog-Artikel als Markdown |
| `public/uploads/…` | Vom Admin hochgeladene Bilder/Videos (Server, außerhalb Git) |

**Migrationsprinzip:** Bestehende `de.json`/`en.json` bleiben zunächst bestehen; nur die tatsächlich editierbaren Felder werden herausgezogen bzw. als „von Admin überschreibbar" markiert. So bleibt die Seite jederzeit lauffähig.

**Editierbare Feldtypen im Admin:**
- **Texte:** Hero, Sektionsüberschriften, Tool-Beschreibungen, Footer, FAQ, Blog.
- **Lauftext (Laufband):** siehe §3a.
- **Bilder:** Upload → siehe §3b (erst Browser-Storage, beim Veröffentlichen nach `public/uploads/…`); Feld speichert Pfad `/uploads/<datei>`.
- **Videos:** Upload (wie Bilder, Browser-Staging → Server-Uploads, ideal für große Dateien) **oder** externe URL (YouTube/Vimeo). Referenz in `videoShowcase`.
- Jedes Feld ist an einen stabilen Schlüssel gebunden (z. B. `hero.title`), damit DE/EN synchron gepflegt werden.

### 3a. Lauftext / Laufband (neu)

- **Position:** eine horizontale Zeile **direkt unter der Navigation**, über die volle Breite, kontinuierlich laufend (Marquee-Effekt).
- **Mehrere Einträge:** Der Admin pflegt eine **Liste von Text-Einträgen** (plural). Sie laufen nacheinander/aneinandergereiht in einer Zeile durch.
- **Datenmodell** (`src/content/ticker.de.json`):
  ```json
  {
    "enabled": true,
    "speed": "normal",
    "items": [
      { "id": "1", "text": "🎉 Neues Tool: Audio-Normalisierer ist da!", "link": "/audionormalisierer/" },
      { "id": "2", "text": "Alle Tools laufen zu 100 % im Browser – keine Uploads nötig." }
    ]
  }
  ```
- **Editor im Admin:** kleiner Listen-Editor – Einträge hinzufügen/entfernen/sortieren, Text bearbeiten, optionalen Link setzen, DE/EN getrennt, Laufband an-/ausschalten, Geschwindigkeit wählen. Live-Vorschau im Overlay.
- **Rendering:** neue Astro/Vue-Komponente `TickerBar`, eingebunden in `BaseLayout` unter `GlobalNav`; reine CSS-Animation (kein externes Marquee-Plugin), pausiert bei Hover, respektiert `prefers-reduced-motion`.

### 3b. Medien-Upload über Browser-Storage (neu)

Gewünschter Ablauf: **erst lokal im Browser, dann beim Veröffentlichen auf den Server.**

1. **Ablegen im Admin:** Der Admin zieht Bild/Video ins Overlay. Die Datei wird **im Browser-Storage** gehalten:
   - **IndexedDB** (nicht `localStorage`) als Speicher – `localStorage` ist ~5 MB und nur Strings; IndexedDB speichert Blobs und trägt problemlos Videos.
   - Sofortige **Vorschau** über eine `blob:`-URL, **ohne** Server-Round-Trip.
   - Der Draft (inkl. Medien) **übersteht Reload** und kann später weiterbearbeitet werden.
2. **Veröffentlichen:** Beim Klick auf **Veröffentlichen** werden die im Browser-Storage liegenden Medien an das Backend hochgeladen (`POST /admin/api/upload`), landen in `public/uploads/…` (Server, außerhalb Git), und die Content-Referenz `/uploads/<datei>` wird in `main` committet und deployt. Danach werden die lokalen Blobs aus dem Browser-Storage geräumt.

> **Wichtig / zu bestätigen:** Reiner Browser-Storage ist **geräte-/browserlokal** und für andere Besucher unsichtbar. Damit hochgeladene Medien **öffentlich auf der Live-Seite** erscheinen, müssen sie beim Veröffentlichen auf den Server übertragen werden (Schritt 2). Der Browser-Storage dient als **Staging/Vorschau**, nicht als finaler Speicher. Diese Kombination erfüllt beides: lokales Hochladen/Vorschau **und** öffentliche Sichtbarkeit nach dem Veröffentlichen.

---

## 4. Adminbereich – Frontend

- **Kein sichtbarer Login-Button.** Aktivierung per **Tastenkombination** (Vorschlag: `Strg + Shift + Alt + K`, konfigurierbar). Ein globaler Key-Listener öffnet ein Login-Modal.
- **Login-Modal:** Passwortabfrage → an Backend (`POST /admin/api/login`) → httpOnly-Session-Cookie.
- **Admin-Overlay nach Login:**
  - **Inline-Editing:** editierbare Felder werden markiert (Rahmen/Stift-Icon); Klick → Bearbeiten direkt an Ort und Stelle („Inhalte fixiert auf der Seite").
  - **Lauftext-Editor:** Listen-Editor für die Laufband-Einträge unter der Navigation (hinzufügen/sortieren/löschen, Link optional, an/aus, Tempo) mit Live-Vorschau (§3a).
  - **Medien-Upload:** Drag & Drop für Bilder/Videos → zunächst **Browser-Storage (IndexedDB)** als Draft/Vorschau, Upload auf den Server erst beim Veröffentlichen (§3b).
  - **Sprachumschalter DE/EN** zum parallelen Pflegen.
  - **Zwei Buttons:**
    - *Speichern* → Zwischenstand am Server (noch nicht live).
    - **Veröffentlichen** → Commit in `main` + Rebuild + Deploy (siehe §2).
  - **Status-Anzeige** des Deploys (läuft / fertig / Fehler).
- Umsetzung als kleines Vue-Overlay, das **nur nach erfolgreichem Login** geladen wird (kein Admin-Code im öffentlichen Bundle, das Overlay-Bundle wird lazy über `/admin/api` geladen).

> Hinweis: Die Tastenkombi ist **Bedien-Komfort/Verschleierung**, keine Sicherheit. Die eigentliche Absicherung ist Passwort + Session + Rate-Limiting (§7).

---

## 5. Adminbereich – Backend (Node-Dienst)

- **Laufzeit:** Node (Express oder Fastify), als `systemd`-Dienst `kodini-admin`, lauscht nur lokal (`127.0.0.1:4000`); nginx reverse-proxyt `/admin` und `/admin/api`.
- **Speicherort:** Git-Clone des Repos unter `/opt/kodini/repo` (getrennt vom Webroot). Der Dienst hat Schreibrechte dort + auf `public/uploads` bzw. `/var/www/kodinitools.com/uploads`.
- **API-Endpunkte (Entwurf):**
  | Methode | Pfad | Zweck |
  |---|---|---|
  | `POST` | `/admin/api/login` | Passwort prüfen, Session setzen |
  | `POST` | `/admin/api/logout` | Session beenden |
  | `GET`  | `/admin/api/content` | Aktuelle editierbare Inhalte laden |
  | `PUT`  | `/admin/api/content` | Zwischenstand speichern (Draft) |
  | `POST` | `/admin/api/upload` | Bild/Video hochladen → `/uploads/…` |
  | `POST` | `/admin/api/publish` | Commit → push → `deploy.sh` |
  | `GET`  | `/admin/api/publish/status` | Deploy-Status (Polling/SSE) |
- **Auth:** ein Inhaber-Konto; Passwort als **bcrypt/argon2-Hash** in `.env` (Server, nicht im Git). Session als signiertes httpOnly-Cookie (`Secure`, `SameSite=Strict`), kurze Laufzeit + Verlängerung.
- **Git-Zugriff:** Deploy-Key oder Fine-grained-Token (nur dieses Repo, `contents:write`) im Server-`.env`, damit der Dienst nach `main` pushen kann.
- **Validierung:** Uploads auf Dateityp/Größe prüfen; Content-Writes gegen ein Schema validieren, bevor committet wird.

---

## 6. `deploy.sh` (neu, im Repo-Root)

Wird **auf dem Server** ausgeführt (vom Admin-Dienst *oder* manuell per SSH). Kernlogik:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/opt/kodini/repo"
WEBROOT="/var/www/kodinitools.com"
BRANCH="main"

cd "$REPO_DIR"

# 1. Neuesten Stand aus main holen
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

# 2. Bauen
npm ci
npm run build   # -> dist/

# 3. Nach Webroot spiegeln – ABER Tool-Apps & Uploads NIE löschen
rsync -a --delete \
  --exclude 'uploads/' \
  --exclude '<tool-verzeichnisse…>' \
  dist/ "$WEBROOT/"
```

**Kritische Punkte, die im Skript sauber gelöst werden müssen:**
- **Tool-Apps schützen:** Alle eigenständigen Tool-Ordner (`audiokonverter/`, `visualizer/`, `mp3konverter/`, … – Liste wird aus `de.json`-`link`-Feldern abgeleitet) müssen von `--delete` ausgenommen werden, sonst sind sie nach dem ersten Deploy weg. → Deploy-Skript generiert die Exclude-Liste automatisch aus den `link`-Einträgen.
- **`uploads/` schützen:** Vom `--delete` ausschließen, damit hochgeladene Medien erhalten bleiben.
- **Atomar/rückrollbar (empfohlen):** In ein Release-Verzeichnis bauen und per Symlink umschalten, damit ein fehlgeschlagener Build die Live-Seite nicht beschädigt (optional, Phase 2).
- **Rechte:** korrekte Owner/Permissions für nginx.

Ein manueller Deploy bleibt jederzeit möglich:
```bash
cd /opt/kodini/repo && ./deploy.sh
```

---

## 7. Sicherheit

- Passwort nur als Hash am Server; niemals im Git.
- Session-Cookie `httpOnly` + `Secure` + `SameSite=Strict`.
- **Rate-Limiting** + kurze Sperre nach Fehlversuchen am `/login`.
- `/admin`-Pfade nur über HTTPS; optional zusätzliche nginx-Basisabsicherung (z. B. Zugriff nur nach gesetztem Session-Cookie / IP-Allowlist).
- **Optional (empfohlen) 2FA (TOTP)** für das Inhaber-Konto – deutlich stärker als „versteckte Tastenkombi".
- Upload-Härtung: Whitelist der Dateitypen, Größenlimit, keine Ausführung im Upload-Ordner (nginx `location /uploads` ohne Script-Execution).
- Git-Token minimal scopen (nur dieses Repo).

---

## 8. Umsetzung in Phasen

**Phase 0 – Vorbereitung (dieser Plan).** ✅ Kein Code geändert.

**Phase 1 – Deploy-Grundlage**
- `deploy.sh` schreiben (inkl. Schutz von Tools + uploads).
- Server: nginx-Konfig für `/admin`-Proxy + `/uploads`-Location dokumentieren, systemd-Unit-Vorlage.
- Trockenlauf des Deploys (ohne Admin) verifizieren, dass Tools/Uploads erhalten bleiben.

**Phase 2 – Content-Modell**
- Editierbare Felder in `src/content/*` herausziehen, Seiten darauf umstellen (verhaltensneutral, gleiche Ausgabe).

**Phase 3 – Admin-Backend**
- Node-Dienst mit Auth, Content-API, Upload, Publish + `deploy.sh`-Anbindung.

**Phase 3b – Laufband (Ticker)**
- `TickerBar`-Komponente unter der Navigation, `src/content/ticker.*.json`, CSS-Animation, `prefers-reduced-motion`.

**Phase 4 – Admin-Frontend**
- Versteckter Combo-Login, Inline-Editing-Overlay, **Lauftext-Editor**, **Medien-Staging in IndexedDB → Upload beim Veröffentlichen**, Speichern/Veröffentlichen, Statusanzeige.

**Phase 5 – Härtung & Test**
- Rate-Limit, optional 2FA, End-to-End-Test des Publish-Flows, Rollback testen.

---

## 9. Vom Inhaber benötigt (bevor Umsetzung startet)

- **Server-Infos:** Betriebssystem, Webserver (vermutlich nginx?), Node vorhanden?, wie wird HTTPS bereitgestellt (Let's Encrypt?).
- **Domain für Admin:** unter `kodinitools.com/admin` (empfohlen) oder Subdomain `admin.kodinitools.com`?
- **Git-Zugang am Server:** Deploy-Key/Token zum Pushen nach `main` einrichten.
- **Passwort** für das Inhaber-Konto (wird nur als Hash gespeichert).
- Bestätigung der **Tastenkombination** (Default `Strg+Shift+Alt+K`).
- Freigabe, dass der Server einen **Git-Clone unter `/opt/kodini/repo`** und den **systemd-Dienst** bekommt.

---

## 10. Offene Design-Entscheidungen (später zu klären)

- Atomare Releases mit Symlink-Switch + Rollback ja/nein (Phase 2 optional).
- 2FA (TOTP) aktivieren ja/nein.
- Blog/FAQ ebenfalls voll über Admin editierbar oder vorerst nur Home/Hero/Videos/Tools.
- Automatischer Deploy per GitHub-Webhook bei Push nach `main` zusätzlich zum Admin-Publish?
