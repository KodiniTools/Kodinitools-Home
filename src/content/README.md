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
funktioniert unverändert. `messages` (gemergt) speist die vue-i18n-Instanz in
`src/pages/_app.ts`.

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

- Overrides greifen überall dort, wo Inhalte über `getContent()` / `messages`
  laufen (Home DE/EN, FAQ DE/EN, vue-i18n). Direkt in `.astro` hartkodierte
  Texte sind (noch) nicht editierbar — sie werden bei Bedarf schrittweise an die
  Content-Schicht angebunden.
