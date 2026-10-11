# Content-Schicht (`src/content/`)

Diese Schicht trennt **admin-editierbare Inhalte** von den festen Standard-Werten
und ist die Grundlage für den Adminbereich (Phase 3/4). Voller Plan:
[`../../docs/ADMIN_DEPLOY_PLAN.md`](../../docs/ADMIN_DEPLOY_PLAN.md).

## Zwei Ebenen

1. **Standard-Werte** — `src/locales/de.json` / `en.json` (Entwickler-Hoheit,
   großer Bestand, bleibt unangetastet).
2. **Admin-Overrides** — `src/content/overrides.de.json` / `overrides.en.json`
   (vom Adminbereich beschrieben; überschreiben einzelne Felder gezielt).

`content.ts` merged beim Build (2) tief über (1). Solange die Overrides `{}`
sind, ist die Ausgabe **identisch** zu vorher (in Phase 2 bewiesen: alle
HTML-Seiten byte-identisch).

## Dateien

| Datei | Inhalt | Wer schreibt |
|---|---|---|
| `content.ts` | Loader: Merge + `getContent()` / `messages` / `getTicker()` | Entwickler |
| `overrides.de.json` / `overrides.en.json` | Feld-Overrides (Hero, Videos, Texte …) | **Admin** |
| `ticker.de.json` / `ticker.en.json` | Laufband-Konfiguration + Einträge | **Admin** |

## Verwendung in Seiten

```ts
import { getContent } from '../content/content'
const de = getContent('de')   // = deepMerge(de.json, overrides.de.json)
```

`getContent()` liefert dieselbe Struktur wie die Locale-Datei — bestehender Code
funktioniert unverändert.

## Override-Format

Nur die zu ändernden Felder angeben; verschachtelte Pfade werden tief gemergt,
Arrays vollständig ersetzt. Beispiel `overrides.de.json`:

```json
{
  "hero": { "title": "Neuer Hero-Titel" },
  "videoShowcase": { "audio": { "src": "/uploads/mein-video.mp4" } }
}
```

## Ticker-Format (`ticker.de.json`)

```json
{
  "enabled": true,
  "speed": "normal",
  "items": [
    { "id": "1", "text": "🎉 Neues Tool ist da!", "link": "/audionormalisierer/" },
    { "id": "2", "text": "Alle Tools laufen im Browser." }
  ]
}
```
`enabled: false` oder leere `items` → das Laufband rendert nichts (aktueller
Auslieferungszustand). Das Rendering (`TickerBar`) kommt in Phase 3b.

## Grenzen (aktuell)

- Overrides greifen überall dort, wo Inhalte über `getContent()` laufen
  (Home DE/EN, FAQ DE/EN, Blog). Direkt in `.astro` hartkodierte
  Texte sind (noch) nicht editierbar — sie werden bei Bedarf schrittweise an die
  Content-Schicht angebunden.

## Blog (`blog/`)

Jeder Artikel ist **eine Datei**: `blog/de/<slug>.html` bzw. `blog/en/<slug>.html`.
Der Dateiname ist der Slug, die URL ergibt sich daraus (`/blog/<slug>/`,
`/en/blog/<slug>/`). Seiten, Blog-Übersicht, Suchindex und Sitemap entstehen
automatisch – es gibt keine Liste mehr, die man zusätzlich pflegen muss.

```html
---
title: "Audio normalisieren: … | KodiniTools"   # <title>, og:title
description: "…"                                # Meta-Description
published: "2026-06-08"                         # JJJJ-MM-TT, in Anführungszeichen
modified: "2026-07-01"                          # optional
alternate: normalize-audio-online               # Slug der Übersetzung (Pflicht)
ogImage: /image/foo-og.jpg                      # optional, 1200×630
card:                                           # Karte in der Blog-Übersicht
  title: "Audio normalisieren: …"
  description: "…"
  tag: Audio
  minutes: 5
  image: /image/normalieser-blog-de.png
  newTab: true                                  # optional
  order: 1                                      # optional, nur bei gleichem Datum
---
<h1>…</h1>
…Artikel-HTML…
```

- Das Schema steht in `src/content.config.ts`; falsche oder fehlende Felder
  brechen den Build mit Dateiname und Feld ab.
- `alternate` muss in beide Richtungen stimmen, sonst bricht der Build ab
  (hreflang-Paare).
- Der Rumpf ist HTML (Tabellen, Figuren, Klassen wie `blog-meta`, `blog-demo`,
  `blog-related`) und wird unverändert ausgegeben. Prettier lässt den Ordner aus.
- Loader: `blogLoader.ts`, Hilfsfunktionen: `blog.ts`, Suchindex: `blogSearchIndex.ts`.
