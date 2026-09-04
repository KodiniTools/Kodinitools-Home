# KodiniTools – Startseite (kodinitools.com)

Statische Website mit **Astro 5**: Startseite (DE/EN), Blog, FAQ, Tool-Übersicht.
Die Tool-Apps selbst liegen als eigenständige Anwendungen in Unterverzeichnissen
(z. B. `/audiokonverter/`) und sind nicht Teil dieses Builds. Im Browser läuft nur
schlankes Vanilla-JavaScript (kein Framework-Runtime).

## Start

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # statischer Build nach dist/
npm run preview    # gebauten Stand ansehen
npm run lint       # ESLint (Astro, TS, Admin-Server)
npm run format     # Prettier
```

## Projekt-Struktur

```
src/
├── pages/            # Astro-Seiten: index (DE), en/, blog/, faq, 404
├── layouts/          # BaseLayout, EnLayout, BlogArticleLayout
├── components/       # Astro-Komponenten (GlobalNav, SiteFooter, TickerBar, SectionMedia, SiteFont)
├── content/          # content.ts: Locale-Texte + Admin-Overrides zusammenführen, CSS für
│                     # Seitenhintergrund/Tool-Karten erzeugen; media.json, overrides
├── locales/          # de.json / en.json – Texte, Tool-Karten, Hero, FAQ, Blog (Single Source of Truth)
└── styles/           # global.css (Aggregator) + parts/*.css
server/admin/         # Admin-Dienst (Node, ohne Abhängigkeiten): Inhalte, Medien, Design,
                      # Hintergrund, Tool-Karten, Vorschau, Veröffentlichen (siehe server/admin/README.md)
deploy/, deploy.sh    # Server-Deployment (nginx, systemd)
docs/                 # ADMIN_DEPLOY_PLAN.md – Architektur und Betriebsablauf des Admin-Bereichs
```

## Inhalte und Übersetzungen

Texte kommen aus `src/locales/de.json` und `en.json`. Der Admin-Bereich legt Änderungen
als Overrides ab; `src/content/content.ts` mischt beides beim Build zusammen. Auf den
Seiten werden Texte serverseitig eingesetzt, kleine sprachabhängige Stellen im Browser
über `data-i18n`-Attribute befüllt.

## Deployment

Siehe `deploy/README.md` und `docs/ADMIN_DEPLOY_PLAN.md`. Kurzfassung auf dem Server:

```bash
sudo -u www-data /opt/kodini/repo/deploy.sh
sudo systemctl restart kodini-admin
```
