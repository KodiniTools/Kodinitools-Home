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
npm run typecheck  # astro check (TypeScript in .astro/.ts)
npm run test:smoke # Build + Smoke-Tests gegen dist/ (Vitest)
```

Die Smoke-Tests (`tests/smoke/`) prüfen die Build-Ausgabe: dieselben Seiten/URLs wie
in `tests/fixtures/build-files.json`, `lang`, Canonical, wechselseitige hreflang-Paare,
Sitemap und Blog-Suchindex. Kommt eine Seite gewollt hinzu oder fällt weg, die Fixture
anpassen.

## Projekt-Struktur

```
src/
├── pages/            # Routen: index, faq, spenden + en/… (nur Hüllen: <HomePage lang="de" /> usw.),
│                     # blog/ ([slug] + Übersicht), 404
├── layouts/          # HomeLayout (Kopf der Startseite, DE/EN), BlogArticleLayout
├── components/       # Astro-Komponenten (GlobalNav, SiteFooter, TickerBar, SectionMedia, SiteFont)
│   └── pages/        # Seiten-Vorlagen je Sprache: HomePage, FaqPage, DonatePage, BlogIndexPage (Prop `lang`)
├── i18n/             # Sprachen (lang.ts) und feste, nicht admin-editierbare Seitentexte je Sprache
│                     # (home-seo.ts, home-ui.ts, faq.ts, donate.ts, blog-index.ts) – typisiert, fehlt eine
│                     # Übersetzung, schlägt `npm run typecheck` fehl
├── content/          # content.ts: Locale-Texte + Admin-Overrides zusammenführen, CSS für
│                     # Seitenhintergrund/Tool-Karten erzeugen; media.json, overrides
│   └── blog/         # Blog-Artikel als Content Collection: de/<slug>.html, en/<slug>.html
│                     # (Frontmatter + HTML, siehe src/content/README.md)
├── locales/          # de.json / en.json – Texte, Tool-Karten, Hero, FAQ, Blog (Single Source of Truth)
└── styles/           # global.css (Aggregator) + parts/*.css; tokens.json = Design-Tokens
                      # (Farben, Verläufe, Schatten, Abstände, Radien) -> parts/tokens.css
server/admin/         # Admin-Dienst (Node, ohne Abhängigkeiten): Inhalte, Medien, Design,
                      # Hintergrund, Tool-Karten, Vorschau, Veröffentlichen (siehe server/admin/README.md)
deploy/, deploy.sh    # Server-Deployment (nginx, systemd)
docs/                 # ADMIN_DEPLOY_PLAN.md – Architektur und Betriebsablauf des Admin-Bereichs
```

## Design-Tokens und barrierearme Variante

- Farben, Verläufe, Schatten, Abstände und Radien stehen in `src/styles/tokens.json`
  (je Token Wert für hell/dunkel und ein Verwendungshinweis). `npm run tokens` erzeugt
  daraus `src/styles/parts/tokens.css` – diese Datei nicht von Hand ändern. Ein Test
  schlägt fehl, wenn sie veraltet ist.
- `tokens.json` › `contrast` listet Farbpaare mit Mindestkontrast (WCAG); die Unit-Tests
  rechnen sie bei jeder Änderung nach.
- `<html class="kt-a11y">` (in allen Layouts gesetzt) aktiviert `parts/a11y.css`: lesbare
  Standardwerte für den CTA im Dunkelmodus, das Server-Badge und Kartenbeschreibungen.
  Admin-Farben haben Vorrang. Zum Abschalten die Klasse entfernen.

## Inhalte und Übersetzungen

Admin-editierbare Texte kommen aus `src/locales/de.json` und `en.json`; feste Seitentexte
(SEO-Meta, Spenden-Seite, Buttons) aus `src/i18n/`. Jede Seite existiert nur einmal als Vorlage
in `src/components/pages/` und wird je Sprache über eine kleine Route gerendert. Der Admin-Bereich legt Änderungen
als Overrides ab; `src/content/content.ts` mischt beides beim Build zusammen. Auf den
Seiten werden Texte serverseitig eingesetzt, kleine sprachabhängige Stellen im Browser
über `data-i18n`-Attribute befüllt.

## Deployment

Siehe `deploy/README.md` und `docs/ADMIN_DEPLOY_PLAN.md`. Kurzfassung auf dem Server:

```bash
sudo -u www-data /opt/kodini/repo/deploy.sh
sudo systemctl restart kodini-admin
```
