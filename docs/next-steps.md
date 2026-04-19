# Next Steps

_Stand: April 2026_

Diese Datei ist bewusst praktisch gehalten: erst das Setup von Tailwind im bestehenden Vite-Frontend, dann ein kleines, manuell aufgebautes Design-System auf Basis der Entwürfe in `/design`.

## Ziel für die nächste UI-Phase

Nicht sofort eine "fertige" App bauen, sondern in dieser Reihenfolge:

1. Tailwind sauber im Web-Paket installieren
2. Design-Tokens aus `/design` ableiten
3. Eine kleine App-Shell bauen
4. 4-5 primitive UI-Bausteine anlegen
5. Erst dann die Feed-UI produktartiger machen

Das passt besser zum aktuellen MVP als direkt eine große Component Library oder ein komplettes Design-System einzuführen.

---

## Teil 1: Tailwind in `apps/web` installieren

Diese Schritte beziehen sich auf Tailwind v4 mit der offiziellen Vite-Integration.

Offizielle Doku:

- https://tailwindcss.com/docs/installation/using-vite
- https://vite.dev/guide/

### 1. Pakete installieren

Im Repo-Root:

```bash
pnpm --dir apps/web add -D tailwindcss @tailwindcss/vite
```

Warum genau diese Pakete: In Tailwind v4 läuft die Vite-Integration über das Vite-Plugin, nicht über die ältere PostCSS- oder Config-Datei als Pflicht-Setup.

### 2. Vite-Config erweitern

Datei: `apps/web/vite.config.ts`

Tailwind-Plugin importieren und zu `plugins` hinzufügen.

Minimal sieht das konzeptionell so aus:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### 3. Globale CSS-Datei anlegen

Datei neu anlegen: `apps/web/src/styles.css`

Erstmal nur:

```css
@import "tailwindcss";
```

Später kommen dort dann eure Tokens und globale Basestyles rein.

### 4. CSS-Datei im Einstieg importieren

Datei: `apps/web/src/main.tsx`

Dort zusätzlich importieren:

```ts
import "./styles.css";
```

Wichtig: Das ist die Stelle, an der die globalen Styles in die App kommen.

### 5. Dev-Server starten und Smoke-Test machen

```bash
pnpm --dir apps/web dev
```

Dann zum Test irgendeine bestehende Stelle kurz mit 2-3 Tailwind-Utilities versehen, zum Beispiel in `App.tsx` oder `ViewToggle.tsx`:

```tsx
<div className="min-h-screen bg-neutral-100 text-neutral-900">...</div>
```

Wenn du die Änderung direkt im Browser siehst, ist Tailwind korrekt verdrahtet.

### 6. Nicht direkt als Nächstes tun

Am Anfang bewusst weglassen:

- keine Component Library
- kein `shadcn/ui`
- keine große Theme-Abstraktion
- keine 50 Utility-Klassen ohne Struktur

Erst ein kleines Fundament, dann Screens.

---

## Teil 2: Wie du das Design-System per Hand aufziehst

Wenn du noch keine Erfahrung damit hast, hilft dieses mentale Modell:

### Ein Design-System ist nicht zuerst eine Komponentenbibliothek

Es ist eher diese Kette:

1. **Design-Tokens** — Farben, Typografie, Spacing, Radius, Schatten
2. **Primitives** — Button, Input, Card, Tag, SectionHeader
3. **Patterns** — Feed list, source row, empty state, loading state
4. **Screens** — Feed, Sources, Bookmarked

Der häufige Fehler ist, direkt bei Schritt 4 anzufangen und unterwegs zufällige Styles anzuhäufen.

---

## Teil 3: Tokens aus `/design` ableiten

Schau zuerst in:

- `/design/industrial.html`
- `/design/style-tiles.html`

Daraus nicht "alles" übernehmen, sondern nur die kleinste brauchbare Token-Menge.

### 1. Farben festlegen

Starte mit ungefähr diesen Rollen:

- `--color-bg`
- `--color-surface`
- `--color-surface-muted`
- `--color-border`
- `--color-text`
- `--color-text-muted`
- `--color-primary`
- `--color-primary-hover`
- `--color-accent`

Wichtig ist die **Rolle**, nicht der Hex-Wert. Dann kannst du später Farben ändern, ohne überall Komponenten anfassen zu müssen.

### 2. Typografie festlegen

Nicht 6 Fonts. Für den MVP reichen 2 Rollen:

- `--font-sans` oder `--font-mono` für UI, Labels, Buttons, Navigation
- `--font-serif` für längeren Lesetext oder Beschreibungen

Dann noch 4-5 Größenrollen:

- `--text-display`
- `--text-heading`
- `--text-body`
- `--text-small`
- `--text-label`

### 3. Spacing festlegen

Nimm eine kleine Skala, zum Beispiel:

- 4
- 8
- 12
- 16
- 24
- 32
- 48

Nicht 20 Werte definieren. Weniger Entscheidungen = konsistentere UI.

### 4. Radius und Shadow festlegen

Wenn euer Look eher industrial/editorial ist, wahrscheinlich sehr sparsam:

- 0 oder 2px Radius
- 1 dezenter Shadow oder gar keiner

Das ist eine Design-Entscheidung, keine technische.

---

## Teil 4: Tokens technisch in `styles.css` abbilden

Wenn Tailwind läuft, kannst du die Tokens in `apps/web/src/styles.css` als CSS-Variablen definieren.

Das ist für den Anfang einfacher als sofort tief in Tailwind-Theming einzusteigen.

Beispielstruktur:

```css
@import "tailwindcss";

:root {
  --color-bg: #f5f3ef;
  --color-surface: #eceae4;
  --color-border: #d9d5cc;
  --color-text: #1c1c1c;
  --color-text-muted: #888888;
  --color-primary: #ff5a1f;
  --color-primary-hover: #e84e15;
  --color-accent: #ffb800;

  --font-ui: "Space Grotesk", sans-serif;
  --font-reading: "Lora", serif;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-ui);
}
```

Warum so: Du nutzt Tailwind für Layout und schnelle Utilities, aber behältst eure visuelle Sprache in eigenen Tokens.

---

## Teil 5: Welche UI-Bausteine du zuerst bauen solltest

Nicht mit speziellen Feed-Komponenten anfangen. Erst diese 5 kleinen Primitives:

### 1. `Button`

Varianten reichen erstmal:

- `primary`
- `secondary`
- `ghost`

Lernziel: Varianten sauber modellieren, ohne schon ein riesiges API zu bauen.

### 2. `Card`

Für Feed-Items, Source-Abschnitte, Empty-States.

Lernziel: Surface, Border, Padding, Spacing einmal definieren statt überall neu.

### 3. `Input`

Für Source-Form.

Lernziel: Form-Controls visuell angleichen.

### 4. `SectionHeader`

Kleiner wiederverwendbarer Header für Feed, Sources, Bookmarked.

Lernziel: gleiche Hierarchie über mehrere Screens.

### 5. `EmptyState`

Für leeren Feed, keine Bookmarks, Fehlerfälle.

Lernziel: States bewusst gestalten statt als nackten Text zu rendern.

---

## Teil 6: Empfohlene Reihenfolge für die ersten UI-Umbauten

### Phase 1: App-Shell

Dateien, die du dir zuerst anschauen solltest:

- `apps/web/src/App.tsx`
- `apps/web/src/components/ViewToggle.tsx`
- `apps/web/src/main.tsx`

Ziel:

- Seitenhintergrund
- zentrierter Content-Container
- Top-Navigation / View-Switch
- konsistente Seitenabstände

Noch keine Detail-Politur.

### Phase 2: Feed zuerst

Dateien:

- `apps/web/src/components/Feed.tsx`
- `apps/web/src/components/FeedItem/FeedCard.tsx`

Ziel:

- Debug-Charakter reduzieren
- klare primäre Aktion definieren
- gute loading / empty / error states
- FeedCards lesbarer und wertiger machen

Wichtig: `Feed.tsx` ist aktuell noch stark debug-orientiert mit Poll/Rebuild/Repoll-Buttons. Für eine produktartige UI solltest du entscheiden, welche Aktion wirklich im normalen User-Flow sichtbar sein soll und was eher Dev- oder Admin-Action ist.

### Phase 3: Source Management danach

Dateien:

- `apps/web/src/components/Sources.tsx`
- `apps/web/src/components/SourceForm.tsx`
- `apps/web/src/components/SourceActiveToggle.tsx`
- `apps/web/src/components/DeleteSourceButton.tsx`

Ziel:

- bessere Lesbarkeit der Source-Liste
- klare Trennung von Metadaten und Actions
- Formular nicht mehr wie Debug-UI wirken lassen

### Phase 4: Bookmarks angleichen

Wenn Feed und Sources stehen, kann `Bookmarked` dieselben Patterns wiederverwenden.

Das ist ein gutes Zeichen, dass die Primitives funktionieren.

---

## Teil 7: Wie du beim Bauen Entscheidungen triffst

Bei jeder neuen Komponente erst diese 3 Fragen beantworten:

1. Ist das ein einmaliger Screen-spezifischer Block oder ein wiederkehrendes Primitive?
2. Welche Styles sind wirklich Teil der visuellen Sprache und welche nur lokales Layout?
3. Wird die Komponente wahrscheinlich auf mindestens 2 Screens wiederverwendet?

Wenn nein, nicht sofort abstrahieren.

Beispiel:

- `max-w-4xl mx-auto px-4` ist eher lokales Layout
- Button-Farben, Border, Typo, Padding sind eher Design-System-relevant

---

## Teil 8: Ein guter erster Arbeitsschnitt für die nächste Session

Wenn du wieder weitermachst, nimm nur diesen kleinen Scope:

1. Tailwind installieren
2. `src/styles.css` anlegen
3. 8-10 Tokens aus `/design` übernehmen
4. `App.tsx` als einfache Shell stylen
5. `ViewToggle.tsx` in eine brauchbare Navigation verwandeln

Wenn das steht, erst `Feed.tsx` anfassen.

So hältst du die Session klein und lernst trotzdem die wichtigsten Grundlagen: Setup, Tokens, globale Styles, Layout und erste Primitives.

---

## Teil 9: Woran du merkst, dass du gerade zu viel baust

Warnsignale:

- du definierst schon Dark Mode, bevor Light Mode sauber ist
- du baust eine generische `cn()`- oder Variant-Abstraktion, bevor du 3 echte Komponenten hast
- du erstellst 15 Tokens, die noch nirgends verwendet werden
- du versuchst Feed, Sources und Bookmarks gleichzeitig zu redesignen

Dann wieder verkleinern.

---

## Teil 10: Definition of Done für den ersten UI-Schritt

Der erste Schritt ist fertig, wenn:

- Tailwind in `apps/web` läuft
- globale Tokens in `src/styles.css` existieren
- `App.tsx` eine einfache App-Shell hat
- `ViewToggle.tsx` nicht mehr wie rohe Debug-Buttons aussieht
- du 1 primitive Komponente bewusst gebaut hast, idealerweise `Button`

Mehr muss die erste Session nicht leisten.
