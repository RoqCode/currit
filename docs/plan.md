# Curated Feed – MVP-Plan & Architektur

_Stand: März 2026_

---

## 1. Produktvision

Ein persönlicher, täglicher Feed mit 3–7 kuratierten Inhalten. Statt endlosem Doomscrolling bekommt man eine bewusst begrenzte Auswahl aus selbst gewählten Quellen – gefiltert, gescored und auf Qualität reduziert.

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
| Cold Start   | User konfiguriert eigene Quellen (URLs, Subreddits)                |
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

## 4. Architektur – Datenfluss

### Phase 1: Ingest

Ein täglicher Job fragt alle konfigurierten Quellen ab. Jede Quelle bekommt einen eigenen Fetcher, weil die Formate unterschiedlich sind (RSS-XML, Reddit JSON API, HN API). Alle liefern am Ende ein normalisiertes Objekt.

### Phase 2: Normalize + Store

Jeder Rohinhalt wird auf ein einheitliches Format gebracht: Titel, URL, Quelle, Datum, Metadaten. Duplikate (gleiche URL) werden hier rausgefiltert. Alles landet in PostgreSQL.

### Phase 3: Score + Rank

Die Scoring Engine zieht alle heutigen Kandidaten aus der DB und bewertet sie anhand vier konfigurierbarer Gewichte:

- **Relevanz** – passt der Inhalt zu den Interessen des Users?
- **Frische** – wie aktuell ist der Inhalt?
- **Inhaltsdichte** – hat der Inhalt Substanz oder ist er dünn?
- **Diversität** – nicht 5x das gleiche Thema im Feed

Wichtig: Gewichte als Konfiguration bauen, nicht als Hardcode. So kann nach der ersten Testwoche gezielt an einzelnen Stellschrauben gedreht werden.

Optional: KI-Scoring für Summary-Generierung und Relevanz-Einschätzung.

### Phase 4: Serve

Eine REST API mit einem Kern-Endpoint: `GET /feed/today` liefert die Top 3–7 Items als JSON. Kein GraphQL, kein WebSocket.

### Phase 5: Display

React-Frontend zeigt die Items an. Jedes Item enthält: Titel, Quelle, kurzen Summary, Link zum Original. Like- und Bookmark-Button schicken Feedback zurück in die DB. Zusätzlich gibt es eine Ansicht, in der alle gespeicherten Bookmarks gesammelt sichtbar sind.

---

## 5. High-Level Todos

### Phase 1: Projektsetup

- [x] Monorepo aufsetzen (z.B. Turborepo oder einfache Ordnerstruktur) · _Projektstruktur_
- [x] TypeScript Backend-Projekt initialisieren (Hono oder Express) · _Backend-Framework_
- [x] React-Projekt initialisieren (Vite) · _Frontend-Tooling_
- [x] PostgreSQL aufsetzen (lokal via Docker) · _Docker, PostgreSQL_
- [ ] Drizzle ORM einrichten + erstes Schema · _ORM, DB-Migrationen_
- [ ] VPS einrichten + Deployment-Pipeline (z.B. SSH + PM2 oder Docker) · _DevOps, Linux_

### Phase 2: Ingest-Pipeline

- [ ] RSS-Fetcher bauen (rss-parser oder eigener XML-Parser) · _RSS, XML-Parsing_
- [ ] Reddit-Fetcher bauen (JSON API, kein OAuth nötig für public Subreddits) · _REST APIs_
- [ ] Hacker News-Fetcher bauen (Firebase API) · _API-Integration_
- [ ] Content-Normalizer: einheitliches Datenformat für alle Quellen · _Datenmodellierung_
- [ ] Duplikat-Erkennung (URL-basiert) · _Algorithmen_
- [ ] Cron-Job oder manueller Trigger einrichten · _Scheduling, Cron_

### Phase 3: Scoring Engine

- [ ] Scoring-Funktion mit vier Kriterien implementieren · _Algorithmen-Design_
- [ ] Gewichte als Konfiguration (JSON/DB) statt Hardcode · _Konfigurationsmanagement_
- [ ] Top-N-Selektion mit Diversitätscheck · _Ranking-Logik_
- [ ] Optional: KI-Summary über Anthropic/OpenAI API · _LLM-APIs_
- [ ] Optional: KI-Relevanzscore · _Prompt Engineering_

### Phase 4: API

- [ ] `GET /feed/today` – Tages-Feed abrufen · _REST-API-Design_
- [ ] `POST /feed/:id/like` – Like-Feedback speichern · _API-Endpunkte_
- [ ] `POST /feed/:id/bookmark` – Bookmark speichern oder entfernen · _API-Endpunkte_
- [ ] `GET /bookmarks` – gespeicherte Bookmarks auflisten · _REST-API-Design_
- [ ] `GET /sources` – konfigurierte Quellen auflisten · _CRUD_
- [ ] `POST /sources` – neue Quelle hinzufügen · _Input-Validierung_
- [ ] `DELETE /sources/:id` – Quelle entfernen · _CRUD_

### Phase 5: Frontend

- [ ] Feed-Ansicht: Tages-Items als Karten/Liste darstellen · _React, Komponenten_
- [ ] Like-Button pro Item · _State Management_
- [ ] Bookmark-Button pro Item · _State Management_
- [ ] Bookmark-Ansicht: alle gespeicherten Items gesammelt anzeigen · _Listen-UI, Navigation_
- [ ] Leerer Zustand: "Du bist fertig für heute" · _UX-Design_
- [ ] Quellen-Verwaltung: Hinzufügen/Entfernen von Quellen · _Formulare, CRUD-UI_
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

**RSS-Reader-Abgrenzung:** Wenn das Scoring nicht spürbar besser filtert als manuelles Durchscrollen, fehlt der Grund für das Tool. Die Scoring Engine ist das Differenzierungsmerkmal.

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
