# Curated Feed – MVP-Plan & Architektur

_Stand: April 2026_

---

## 1. Produktvision

Ein persönlicher, täglicher Feed mit 5–10 kuratierten Inhalten. Statt endlosem Doomscrolling bekommt man eine bewusst begrenzte Auswahl aus selbst gewählten Quellen – gefiltert, gescored und auf Qualität reduziert.

### Kernprinzipien

- **Endlich statt unendlich** – der Feed hat ein tägliches Limit
- **Kuratiert statt maximiert** – weniger Items, höhere Qualität
- **Eigene Quellen** – der User bringt RSS-Feeds, Subreddits, HN mit
- **Lernprojekt** – Entwicklerfortschritt ist gleichwertiges Ziel neben Produktnutzen

---

## 2. MVP-Entscheidungen

| Entscheidung | Festlegung                                                         |
| ------------ | ------------------------------------------------------------------ |
| Ziel         | Reddit-Doomscrolling durch bessere Alternative reduzieren          |
| Feed-Größe   | Minimum 3, Maximum 7 Items pro Tag                                 |
| Quellen      | RSS-Feeds, ausgewählte Subreddits, Hacker News                     |
| Interessen   | User pflegt eigene Themen als Keywords, KI-Vorschläge optional     |
| Cold Start   | User konfiguriert eigene Quellen; Hacker News ist standardmäßig da |
| Scoring      | Heuristiken als Basis, KI optional obendrauf                       |
| Feedback     | Like- und Bookmark-Feedback pro Item                               |
| Leerer Feed  | "Du bist fertig für heute" (später: Mini-Reflexion)                |
| Dünne Tage   | Weniger zeigen statt mit schwachen Items auffüllen                 |
| Auth         | Keine – Single-User-MVP                                            |
| Serendipity  | Ein Teil der Items darf leicht außerhalb der Kerninteressen liegen |

---

## 3. Tech Stack

| Komponente    | Technologie                    |
| ------------- | ------------------------------ |
| Frontend      | React + TypeScript             |
| Backend       | TypeScript (Hono oder Express) |
| Datenbank     | PostgreSQL + Drizzle ORM       |
| KI (optional) | Anthropic API oder OpenAI API  |
| Hosting       | Self-hosted (VPS)              |
| Scheduling    | Cron-Job oder manueller Button |

Späterer Lernschritt: Backend nach Go portieren, um die Sprache an einem bekannten System zu lernen.

---

## 3.1 Design Direction: Industrial

Richtung: Industrial / Teenage Engineering – utilitaristisch, technisch, klar.

### Design Tokens

| Token      | Wert      |
| ---------- | --------- |
| Primary    | `#FF5A1F` |
| Accent     | `#FFB800` |
| Dark       | `#1C1C1C` |
| Background | `#F9F9F9` |
| Surface    | `#F2F2F2` |
| Border     | `#D9D9D9` |
| Muted      | `#999999` |

| Rolle     | Font          |
| --------- | ------------- |
| UI/Labels | Space Grotesk |
| Body/Text | Lora (Serif)  |

### Stilregeln

- Kein `border-radius` (0px überall)
- Labels/Buttons: Uppercase + Letter-Spacing
- Light Mode
- Source-Tags farbcodiert: Reddit (#FF4500), HN (#FF6600), RSS (#0A84FF)
- Mobile: Nav im Footer (Tab Bar), Read-Count + Progress Bar im Header

### Referenz

Component Sheet mit allen Tokens und Komponenten: [`design/industrial.html`](../design/industrial.html)

---

## 4. Architektur – Datenfluss

### Phase 0: Profile Setup

Vor dem ersten Feed pflegt der User seine Interessengebiete als Keywords, z.B. `typescript`, `indie web`, `self-hosting`, `design systems`. Diese Keywords sind bewusst leichtgewichtig, damit der Einstieg schnell bleibt und das Relevanzsignal früh nutzbar ist.

Optional kann eine KI aus wenigen Seed-Keywords verwandte Vorschläge generieren, die der User übernehmen oder verwerfen kann. Wichtig für das MVP: KI macht nur Vorschläge, sie entscheidet nichts automatisch.

### Phase 1: Ingest

Ein täglicher Job fragt alle konfigurierten Quellen ab. Jede Quelle bekommt einen eigenen Fetcher, weil die Formate unterschiedlich sind (RSS-XML, Reddit JSON API, HN API). Alle liefern am Ende ein normalisiertes Objekt.

Für die UX sollte Hacker News dabei nicht wie eine normale manuell anzulegende Quelle behandelt werden, sondern als eingebaute Standardquelle vorhanden sein. RSS-Feeds und Subreddits bleiben user-konfigurierbar.

Für die aktuelle Umsetzungsreihenfolge gilt bewusst: erst jede Quellart einmal end-to-end zum Laufen bringen, dann die ingest pipeline konsolidieren. Das heißt konkret: RSS zuerst als MVP-Slice, danach Reddit und Hacker News, und erst anschließend gezielt Robustheit, Validierung, Dedupe und Cross-Source-Vereinheitlichung nachziehen.

### Phase 2: Normalize + Store

Jeder Rohinhalt wird auf ein einheitliches Format gebracht: Titel, URL, Quelle, Datum, Metadaten. Duplikate werden hier rausgefiltert. Alles landet in PostgreSQL.

Für die aktuelle MVP-Realität darf die Dedupe-Strategie noch quellspezifisch sein: HN kann stabil über die externe HN-ID dedupliziert werden, während RSS und Reddit vorerst eher URL-basiert betrachtet werden.

Zusätzlich brauchen Quellen einen einfachen Aktiv-Status (`active: true/false`), damit Polling und Feed-Building Quellen gezielt ein- oder ausschließen können, ohne sie löschen zu müssen.

Wichtig für den aktuellen MVP: Diese Phase darf anfangs zwischen den Quellen noch etwas uneinheitlich sein. Perfekte Normalisierung ist nicht Voraussetzung für die ersten funktionierenden ingest slices, sondern ein bewusster Konsolidierungsschritt danach.

### Phase 3: Score + Rank

Die Scoring Engine zieht alle heutigen Kandidaten aus der DB und bewertet sie anhand vier konfigurierbarer Gewichte. Die User-Keywords sind dabei das erste Relevanzsignal und werden gegen Titel, Summary und verfügbare Metadaten gematcht:

- **Relevanz** – passt der Inhalt zu den Interessen des Users?
- **Frische** – wie aktuell ist der Inhalt?
- **Inhaltsdichte** – hat der Inhalt Substanz oder ist er dünn?
- **Diversität** – nicht 5x das gleiche Thema im Feed

Wichtig: Gewichte als Konfiguration bauen, nicht als Hardcode. So kann nach der ersten Testwoche gezielt an einzelnen Stellschrauben gedreht werden.

Optional: KI-Scoring für Summary-Generierung, Relevanz-Einschätzung und Keyword-Vorschläge.

### Phase 4: Serve

Eine REST API mit einem Kern-Endpoint: `GET /feed/today` liefert die Top 3–7 Items als JSON. Kein GraphQL, kein WebSocket.

Zusätzlich braucht das MVP einfache Endpunkte für Interessenverwaltung, damit Keywords nicht in einer versteckten Config leben, sondern Teil des Produkts sind.

### Phase 5: Display

React-Frontend zeigt die Items an. Jedes Item enthält: Titel, Quelle, kurzen Summary und die passenden Links. Für RSS reicht ein Link zum Original. Für Hacker News und Subreddit-Items sollen zwei Links vorhanden sein: einer zum Thread auf HN bzw. Reddit und einer zum verlinkten Original-Item. Like- und Bookmark-Button schicken Feedback zurück in die DB. Zusätzlich gibt es eine Ansicht, in der alle gespeicherten Bookmarks gesammelt sichtbar sind.

---

## 5. High-Level Todos

### Phase 1: Projektsetup

- [x] Monorepo aufsetzen (z.B. Turborepo oder einfache Ordnerstruktur) · _Projektstruktur_
- [x] TypeScript Backend-Projekt initialisieren (Hono oder Express) · _Backend-Framework_
- [x] React-Projekt initialisieren (Vite) · _Frontend-Tooling_
- [x] PostgreSQL aufsetzen (lokal via Docker) · _Docker, PostgreSQL_
- [x] Drizzle ORM einrichten + erstes Schema · _ORM, DB-Migrationen_
- [ ] VPS einrichten + Deployment-Pipeline (z.B. SSH + PM2 oder Docker) · _DevOps, Linux_

### Phase 2: Ingest-Pipeline

- [x] RSS polling MVP begonnen: Feed laden, parsen und erste Items persistieren · _RSS, XML-Parsing_
- [ ] RSS polling härten: Validierung, Dedupe, Cursor-Logik, Edge Cases · _Robustheit, Datenkonsistenz_
- [ ] Reddit-Fetcher bauen (JSON API, kein OAuth nötig für public Subreddits) · _REST APIs_
- [x] Hacker News-Fetcher bauen (Firebase API) · _API-Integration_
- [ ] Hacker News als eingebaute Default-Source behandeln statt als manuell anzulegende User-Source · _Produktmodell, UX_
- [ ] Content-Normalizer: einheitliches Datenformat für alle Quellen · _Datenmodellierung_
- [ ] Duplikat-Erkennung (URL-basiert) · _Algorithmen_
- [x] HN-Dedupe über externe HN-ID im Polling/Store-Slice · _Datenkonsistenz_
- [ ] Cron-Job oder manueller Trigger einrichten · _Scheduling, Cron_

### Phase 3: Scoring Engine

- [ ] Scoring-Funktion mit vier Kriterien implementieren · _Algorithmen-Design_
- [ ] Relevanz-Basis über Keyword-Matching auf Titel, Summary und Metadaten bauen · _Information Retrieval_
- [ ] Gewichte als Konfiguration (JSON/DB) statt Hardcode · _Konfigurationsmanagement_
- [ ] Top-N-Selektion mit Diversitätscheck · _Ranking-Logik_
- [ ] Optional: KI-Summary über Anthropic/OpenAI API · _LLM-APIs_
- [ ] Optional: KI-Relevanzscore · _Prompt Engineering_
- [ ] Optional: KI-Vorschläge für verwandte Interessen-Keywords · _LLM-APIs_

### Phase 4: API

- [x] `GET /feed/today`-ähnlichen Feed-Read-Slice als MVP gebaut (`GET /api/feed`) · _REST-API-Design_
- [x] Dev-Endpoints zum Polling und Feed-Rebuild gebaut (`/api/poll`, `/api/poll/repoll`, `/api/feed/rebuild`) · _MVP-Workflow_
- [ ] `POST /feed/:id/like` – Like-Feedback speichern · _API-Endpunkte_
- [ ] `POST /feed/:id/bookmark` – Bookmark speichern oder entfernen · _API-Endpunkte_
- [ ] `GET /bookmarks` – gespeicherte Bookmarks auflisten · _REST-API-Design_
- [ ] `GET /interests` – gespeicherte Interessen-Keywords auflisten · _CRUD_
- [ ] `POST /interests` – neue Interessen-Keywords hinzufügen · _Input-Validierung_
- [ ] `DELETE /interests/:id` – Interesse entfernen · _CRUD_
- [ ] `POST /interests/suggest` – optionale KI-Vorschläge erzeugen · _LLM-Integration_
- [ ] `GET /sources` – konfigurierte Quellen auflisten · _CRUD_
- [ ] `POST /sources` – neue Quelle hinzufügen · _Input-Validierung_
- [ ] `DELETE /sources/:id` – Quelle entfernen · _CRUD_
- [ ] `PATCH /sources/:id/active` – Quelle aktivieren/deaktivieren · _CRUD, Produktverhalten_

### Phase 5: Frontend

- [x] Einfache Feed-Ansicht zum Anzeigen der Tages-Items als MVP gebaut · _React, Komponenten_
- [ ] Like-Button pro Item · _State Management_
- [ ] Bookmark-Button pro Item · _State Management_
- [ ] Bookmark-Ansicht: alle gespeicherten Items gesammelt anzeigen · _Listen-UI, Navigation_
- [ ] Leerer Zustand: "Du bist fertig für heute" · _UX-Design_
- [ ] Interessen-Verwaltung: Keywords hinzufügen/entfernen · _Formulare, Tag-UI_
- [ ] Optional: KI-Vorschläge für Interessen anzeigen und übernehmbar machen · _UX + LLM_
- [x] Quellen-Verwaltung: Hinzufügen/Entfernen von Quellen als MVP gebaut · _Formulare, CRUD-UI_
- [ ] Quellen-Verwaltung: Active-Toggle pro Source (`true/false`) · _Formulare, CRUD-UI_
- [ ] HN- und Subreddit-Items im UI mit zwei Links darstellen: Thread + verlinktes Original · _Informationsarchitektur, UI_
- [ ] Responsive Design (Mobile-first – du wirst es am Handy nutzen) · _CSS, Responsive_

### Phase 6: Test & Iterate

- [ ] Eine Woche lang täglich benutzen statt Reddit · _Produktvalidierung_
- [ ] Scoring-Gewichte nach Gefühl anpassen · _Iteration_
- [ ] Auswertung: Greife ich öfter zum Feed als zu Reddit? · _Verhaltensanalyse_
- [ ] Showstopper-Analyse: Warum hat Reddit gewonnen (falls ja)? · _Produktdenken_

---

## 6. Bekannte Risiken & Blindspots

**Attraktivitätslücke:** Der Feed optimiert auf das Gegenteil von dem, was Reddit attraktiv macht (Masse, Überraschung, Dopamin). Die UX muss eine andere Art von Attraktivität liefern – welche genau, ist noch offen.

**Zwei Hypothesen gleichzeitig:** Der MVP testet "intelligentes Filtern" und "endlicher Feed" gleichzeitig. Wenn der Test scheitert, ist nicht klar, welche Hypothese schuld war.

**Scoring-Opazität:** Vier Scoring-Signale gleichzeitig machen es schwer zu erkennen, welches Signal den Unterschied macht. Gewichte einzeln einstellbar halten.

**Dünne Tage:** Je nach Interessenprofil kann die Schnittmenge "frisch + relevant + gehaltvoll" an manchen Tagen zu klein sein.

**Keyword-Pflegeaufwand:** Wenn Interessen-Keywords zu grob, zu fein oder veraltet sind, leidet die Relevanz schnell. Deshalb sollten Bearbeitung und KI-Vorschläge möglichst leichtgewichtig sein.

**RSS-Reader-Abgrenzung:** Wenn das Scoring nicht spürbar besser filtert als manuelles Durchscrollen, fehlt der Grund für das Tool. Die Scoring Engine ist das Differenzierungsmerkmal.

**Vertical-Slice-Bias:** Wenn erst alle Quellarten funktional gemacht werden, bevor Robustheit und Vereinheitlichung folgen, entstehen vorübergehend inkonsistente Validierung, Fehlerbehandlung und Dedupe-Strategien. Das ist für das MVP okay, sollte aber bewusst bleiben.

---

## 7. Erfolgsbenchmark

### Verhaltensbenchmark (nach 1 Woche)

In Momenten, in denen ich sonst Reddit öffnen würde, greife ich häufiger zum Curated Feed.

### Lernbenchmark (fortlaufend)

Unabhängig vom Produkterfolg: Habe ich mich als Entwickler weiterentwickelt? Neue Technologien, Patterns und Denkweisen gelernt? Das Projekt ist auch dann ein Erfolg, wenn die App danach nicht täglich genutzt wird.

### Wenn Reddit gewinnt

Nicht als Scheitern werten, sondern analysieren:

- War der Feed zu langweilig?
- Zu wenig Serendipity?
- War der Einstieg zu aufwendig?
- Waren die Quellen nicht gut genug?
- Hat es sich nicht wie ein attraktiver Ersatz angefühlt?

---

## 8. Bewusst offen gelassen

Diese Punkte dürfen im MVP heuristisch und iterativ gelöst werden:

- Exakte Definition von "hochqualitativ"
- Exakte Definition von "gehaltarm"
- Ausgefeilte Rankinglogik
- Komplexes Feedbacksystem (nur Like reicht erstmal)
- Perfekte Balance zwischen Relevanz und Serendipity
- Wie stark das Produkt technisch vor Reddit-Rückfall schützt
- Strenge Input-Validierung für Ingest-Quellen
- Vollständige Edge-Case-Behandlung beim Polling
- Robuste Retry- und Fehlerstrategie pro Quelle
