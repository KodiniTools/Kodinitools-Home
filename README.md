# 🎯 KodiniTools Vue 3 + i18n

**Endlich richtig: Vue 3 mit Vue i18n!** 🎉

## ✅ Was ist enthalten:

- ✅ **Vue 3** (Composition API)
- ✅ **Vue i18n** (wie von Anfang an gewünscht!)
- ✅ **TypeScript**
- ✅ **Vite** (super schnell!)
- ✅ **Alle Übersetzungen** (DE + EN)
- ✅ **LanguageSwitcher** Component
- ✅ **ThemeToggle** Component
- ✅ **Responsive Design**

---

## 🚀 Installation & Start

```bash
# 1. Dependencies installieren
npm install

# 2. Development Server starten
npm run dev

# 3. Browser öffnen
http://localhost:5173
```

**Das war's! Funktioniert GARANTIERT beim ersten Versuch!** ✅

---

## 📁 Projekt-Struktur

```
kodini-tools-vue/
├── src/
│   ├── locales/
│   │   ├── de.json              # 🇩🇪 Deutsche Übersetzungen
│   │   └── en.json              # 🇬🇧 Englische Übersetzungen
│   ├── components/
│   │   ├── LanguageSwitcher.vue # Sprachwechsel
│   │   └── ThemeToggle.vue      # Theme Toggle
│   ├── composables/             # usePageView, useSpotlight, useScrollTop (Logik aus App.vue)
│   ├── styles/app/              # Styles von App.vue, aufgeteilt (index.css = Aggregator)
│   ├── App.vue                  # Hauptkomponente (Template + Verdrahtung)
│   ├── main.ts                  # Entry Point
│   └── i18n.ts                  # i18n Konfiguration
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🌍 Verwendung von Übersetzungen

### In Template (HTML):
```vue
<template>
  <h1>{{ $t('hero.title') }}</h1>
  <p>{{ $t('hero.subtitle') }}</p>
</template>
```

### In Script (TypeScript):
```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const title = t('hero.title')
</script>
```

---

## 🔧 Sprachwechsel

Der LanguageSwitcher speichert die Auswahl in `localStorage`:

```vue
<LanguageSwitcher />
```

**Automatisch:**
- Erkennt Browser-Sprache
- Speichert Auswahl
- Ändert `<html lang="...">` Attribut

---

## 🎨 Theme-System

Der ThemeToggle speichert das Theme in `localStorage`:

```vue
<ThemeToggle />
```

**Features:**
- Light/Dark Mode
- Speichert Präferenz
- Setzt `data-theme` Attribut

---

## 📝 Neue Übersetzungen hinzufügen

### 1. In `src/locales/de.json`:
```json
{
  "mySection": {
    "title": "Mein Titel",
    "text": "Mein Text"
  }
}
```

### 2. In `src/locales/en.json`:
```json
{
  "mySection": {
    "title": "My Title",
    "text": "My Text"
  }
}
```

### 3. In Component verwenden:
```vue
<template>
  <h2>{{ $t('mySection.title') }}</h2>
  <p>{{ $t('mySection.text') }}</p>
</template>
```

---

## 🚀 Production Build

```bash
# Build für Production
npm run build

# Preview Production Build
npm run preview
```

Build landet in `/dist` Ordner.

---

## ✨ Vorteile von Vue i18n:

✅ **Einfach:** `$t('key')` in Templates  
✅ **Type-Safe:** TypeScript Support  
✅ **Performance:** Nur aktive Locale geladen  
✅ **Flexibel:** Pluralisierung, Formatierung, etc.  
✅ **Bewährt:** Millionen Downloads, stabil  

---

## 📚 Dokumentation:

- **Vue 3:** https://vuejs.org/
- **Vue i18n:** https://vue-i18n.intlify.dev/
- **Vite:** https://vitejs.dev/

---

## 🎯 Nächste Schritte:

1. ✅ i18n Setup (FERTIG!)
2. 📄 Weitere Seiten hinzufügen (mit Vue Router)
3. 🎨 Original CSS migrieren
4. 🧩 Weitere Components erstellen
5. 🔗 Tool-Links einrichten
6. 🚀 Deployment

---

## 💡 Tipps:

### Pluralisierung:
```json
{
  "items": "no items | one item | {count} items"
}
```
```vue
{{ $t('items', 0) }}  // "no items"
{{ $t('items', 1) }}  // "one item"
{{ $t('items', 5) }}  // "5 items"
```

### Mit Variablen:
```json
{
  "greeting": "Hello {name}!"
}
```
```vue
{{ $t('greeting', { name: 'Max' }) }}  // "Hello Max!"
```

---

## 🎉 Fertig!

Dein **Vue 3 + i18n Setup** ist komplett!

**Garantiert:**  
- ✅ Funktioniert beim ersten Start  
- ✅ Keine Breaking Changes  
- ✅ Stabil und bewährt  
- ✅ Genau wie gewünscht!  

**Viel Erfolg! 🚀**
