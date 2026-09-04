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
| `public/` | Admin-Frontend (Phase 4); u. a. `design.js` (Hero-Design; Regler mit Zahlenfeld + „↺“), `background.js` (Seiten-Hintergrund: Farbe/Verlauf, Muster, Hintergrundbild, abgesetzte Sektionen, Effekte), `toolcards.js` (Tab „Tool-Karten“: Rahmen/Hintergrund der Tool-Karten je Karte, Hell/Dunkel, Sticky-Live-Vorschau), `slider.js` (gemeinsamer Regler: Slider + Zahlenfeld + „↺“) |

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
