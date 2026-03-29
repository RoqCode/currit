# Currit – Recommendation Engine: Synthetisierter Research-Bericht

## Das Gesamtbild: Wie ein Feed-Algorithmus denkt

Bevor wir in Formeln eintauchen: Das mentale Modell, das sich durch _alle_ erfolgreichen Feed-Systeme zieht – von YouTube über X bis Lobste.rs – ist ein **Trichter mit Stufen**. Stell dir das vor wie eine Kaffeerösterei: Erst kaufst du säckeweise Rohkaffee ein (Candidate Generation), dann sortierst du Bohnen nach Größe und Qualität (Scoring/Ranking), dann stellst du eine Mischung zusammen, die gut schmeckt (Re-Ranking für Diversität), und am Ende lernst du aus dem Kundenfeedback, welche Mischung du nächste Woche röstest (Feedback Loop).

```
200+ Kandidaten/Tag          3-7 Items im Feed
       │                            ▲
       ▼                            │
┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐
│  Candidate   │→│   Scoring    │→│   Re-Ranking     │→│   Feedback   │
│  Generation  │  │   & Ranking  │  │   (Diversität)   │  │   Loop       │
└─────────────┘  └──────────────┘  └─────────────────┘  └──────────────┘
 Reddit API       Freshness         MMR / Slot-basiert   Likes → Thompson
 HN API           Source Quality    Anti-Monotonie       Sampling
 RSS Feeds        Relevanz (LLM)    Serendipity-Slot     Keyword-Gewichte
                  Inhaltsdichte                          Embeddings (später)
```

Dieses Pattern ist kein Zufall. YouTubes berühmtes RecSys-2016-Paper beschreibt es als "two-stage information retrieval dichotomy" – erst ein schnelles, breites Modell für Kandidaten, dann ein präzises, teures Ranking. X (Twitter) hat die gleiche Struktur öffentlich dokumentiert: Candidate Sources → Feature Hydration (~6000 Features) → ML-Scoring → Filters & Heuristics (Author Diversity, Content Balance, Dedup). Und selbst kleine Open-Source-Projekte wie Lobste.rs folgen dem gleichen Grundmuster, nur mit einfacheren Mitteln.

Für Currit heißt das: Du baust keine KI. Du baust einen Trichter mit 4 Stufen, und jede Stufe kann so simpel oder so komplex sein, wie du willst.

---

## Stufe 1: Candidate Generation – Rohkaffee einkaufen

Hier geht es nur darum, einen sauberen Pool an "Bewerbern" für den heutigen Feed zu haben. Currit zieht aus drei Quellen:

**Reddit** (JSON API, kein OAuth nötig für öffentliche Subreddits): Pro konfiguriertem Subreddit die Top-Posts der letzten 24–48h. Reddit liefert dir `score` (Upvotes − Downvotes), `num_comments`, `created_utc` und `url` – alles verwertbare Signale.

**Hacker News** (Firebase API): Top/Best Stories, ebenfalls mit `score`, `descendants` (Kommentaranzahl) und Timestamp. HN hat zusätzlich den Vorteil, dass der Score schon durch die Community kuratiert ist.

**RSS Feeds**: Hier hast du _keine_ Engagement-Signale – nur Titel, Beschreibung, Datum. Das ist okay, aber du musst später beim Scoring damit umgehen (siehe "Normalisierung").

**Normalisierung ist der Schlüssel.** Ein Reddit-Post mit 5.000 Upvotes, ein HN-Post mit 200 Points und ein RSS-Artikel mit null Votes müssen auf gleicher Ebene konkurrieren. Die robusteste Lösung: **Percentile-Rank-Normalisierung** pro Quelle. Wenn ein HN-Post mehr Punkte hat als 85% der heutigen HN-Posts, bekommt er einen normalisierten Source-Score von 0.85. Für RSS-Items ohne Votes: Default 0.5 (Median-Annahme).

Deduplizierung passiert ebenfalls hier – URL-basiert, simpel und effektiv.

---

## Stufe 2: Scoring & Ranking – Bohnen sortieren

Jetzt wird's interessant. Jeder Kandidat braucht einen Score, der vier Dimensionen vereint.

### Signal 1: Frische (Time Decay)

Alle großen Aggregatoren nutzen eine Form von Time Decay – die Frage ist nur, wie aggressiv. Drei bewährte Ansätze:

**Hacker News** nutzt eine Gravity-basierte Power-Law-Formel:

```
score = (points - 1)^0.8 / (age_hours + 2)^1.8
```

Points werden sublinear gedämpft (die ersten Votes zählen am meisten), das Alter wird aggressiv bestraft (Exponent 1.8 – ein 24h alter Post ist praktisch unsichtbar). HN wendet zusätzlich unsichtbare Penalties an: kontroverse Stories (hohes Kommentar-zu-Vote-Verhältnis) und "Lightweight"-Content (bestimmte Domains) werden abgestraft.

**Reddit Hot** geht einen anderen Weg – statt relativem Alter nutzt es die _absolute_ Submission-Zeit:

```
hot = sign(s) × log₁₀(max(|s|, 1)) + (t_submit - epoch) / 45000
```

Die Konstante 45.000 Sekunden (12,5h) bedeutet: Ein Post braucht 10× die Votes, um etwas 12,5h Älteres zu schlagen. Vote-Impact ist logarithmisch: 10→100 Votes bringt den gleichen Boost wie 100→1000.

**Lobste.rs** (Open Source!) rechnet mit einem `HOTNESS_WINDOW` von 22 Stunden und kombiniert Vote-Power logarithmisch mit einem linearen Zeit-Term. Tags tragen einen Hotness-Modifier (-10 bis +10), Kommentar-Votes fließen mit halber Stärke ein (gedeckelt auf Story-Score, damit flamige Low-Vote-Stories nicht aufsteigen).

**Für Currit empfohlen:** Exponentieller Decay mit 24h-Halbwertszeit – am einfachsten zu verstehen und zu tunen:

```typescript
const freshness = Math.exp(-0.029 * ageHours); // 0.029 ≈ ln(2)/24
// 0h → 1.0, 12h → 0.71, 24h → 0.50, 48h → 0.25
```

Das passt perfekt zum täglichen Lese-Rhythmus. Aggressiver als HN nötig? Gravity auf 1.5 statt 1.8 setzen.

### Signal 2: Source Quality (Popularitätssignal)

Hier nutzt du die Engagement-Daten der Quellen – aber gedämpft, damit Viralität nicht dominiert:

```typescript
const sourceQuality = percentileRank(item, sourcePool);
// Oder für RSS ohne Votes:
const sourceQuality = rssFeed.historicalClickRate ?? 0.5;
```

Reddits Wilson Score ist hier besonders clever für die Bewertung von _Quellen_ über Zeit: Statt "hat r/webdev eine hohe Like-Rate?" fragst du "wie _sicher_ bin ich, dass r/webdev verlässlich gute Sachen liefert?" – bei wenig Datenpunkten ist die Confidence niedrig, bei vielen hoch. Reddit implementiert das als:

```
lower_bound = (p + z²/2n - z × √(p(1-p)/n + z²/4n²)) / (1 + z²/n)
```

...wobei z = 1.28 (80% Confidence). Das klingt komplex, ist aber in der Praxis eine Funktion mit zwei Inputs (Erfolge, Versuche) und einem Output.

### Signal 3: Relevanz (Persönliches Interesse)

Hier gibt es ein Spektrum von simpel bis sophisticated:

**Level 1 – Keyword-Matching (Tag 1):** Eine handkuratierte Liste deiner Interessen (`["TypeScript", "systems design", "distributed systems", "startups"]`), Titel-Match gibt 1.5× Boost. Stupide einfach, erstaunlich effektiv als Startpunkt.

**Level 2 – LLM-Tagging (Woche 3-4):** Die Top ~30 Kandidaten an Claude Haiku schicken mit deinem Interessenprofil. Prompt:

```
Score each article 1-10 for relevance given these interests: [...].
Return JSON: { relevance_score, quality_score, tags[], summary }
```

Kosten: ~$0.10-0.20/Tag mit Haiku, ~$3-6/Monat. Mit Batch API + Prompt Caching: ~$1-2/Monat. Du bekommst relevance_score, quality_score, Tags und Summaries in einem Rutsch – das LLM-Scoring produziert also "gratis" Metadaten für den Feed.

**Level 3 – Embeddings (Woche 7-8):** Artikel-Embeddings via OpenAI text-embedding-3-small ($0.02/MTok, ~$0.06/Monat für Currit). In PostgreSQL via pgvector speichern. User-Preference = Centroid aller gelikten Artikel-Embeddings. Cosine Similarity als Score. Das versteht _semantische_ Ähnlichkeit – "event sourcing" boosted dann auch "CQRS", ohne Keyword-Overlap.

### Signal 4: Inhaltsdichte / Qualität

Schwer rein heuristisch zu messen, aber ein paar Proxies:

- Textlänge (> 500 Wörter = eher substanziell)
- Verhältnis Kommentare/Votes (viele Kommentare bei moderaten Votes = Diskussionswürdig)
- LLM-Quality-Score (wenn du Level 2 machst, bekommst du das "gratis" mit)

### Alles zusammenmischen: Die Score-Formel

**Option A – Gewichtete Linearkombination** (simpel, tunebar):

```typescript
const score =
  weights.relevance * relevanceScore + // 0.35
  weights.freshness * freshnessScore + // 0.25
  weights.quality * qualityScore + // 0.25
  weights.diversity * diversityBonus; // 0.15
```

Gewichte als JSON-Config in der DB, nicht hardcoded. Starte mit diesen Defaults und dreh nach einer Woche.

**Option B – Reciprocal Rank Fusion (RRF)** (elegant, normalisierungsfrei):

```typescript
// Ranke Kandidaten separat nach jedem Signal, dann fusioniere:
const rrfScore =
  1 / (60 + relevanceRank) + 1 / (60 + freshnessRank) + 1 / (60 + qualityRank);
```

Die Konstante k=60 (aus dem SIGIR-2009-Paper) glättet Rank-Unterschiede. Vorteil: Du musst Scores nicht auf die gleiche Skala bringen – RRF arbeitet nur mit relativen Rängen. Besonders nützlich, wenn du deiner Normalisierung nicht ganz traust.

---

## Stufe 3: Re-Ranking für Diversität – Die Mischung zusammenstellen

Du hast jetzt eine Score-Rangliste. Aber die Top-5 nach Score könnten 5× TypeScript-Artikel sein. Diversität gehört _nicht_ in den Score selbst, sondern ist ein **separater Auswahlschritt danach**. Das ist ein Pattern, das sich durch alle großen Systeme zieht – X nennt es "Filters & Heuristics", YouTube und TikTok haben eigene Diversifikations-Layer.

### Ansatz A: Slot-basierte Diversität (simpel, deterministisch)

Reserviere Slots nach Quelle, um Mindest-Vielfalt zu garantieren:

```
3 Items: 1× Reddit, 1× HN, 1× RSS
5 Items: 2× Reddit, 2× HN, 1× RSS
7 Items: 2× Reddit, 2× HN, 2× RSS, 1× Wildcard (höchster Score egal welche Quelle)
```

Innerhalb jedes Slots: Höchster Score, aber keine zwei Items mit gleichem Primary Topic. Das ist der gleiche Gedanke wie TikToks Anti-Monotonie-Regel (nicht zwei Videos hintereinander mit gleichem Sound/Creator), nur auf Link-Ebene.

### Ansatz B: MMR – Maximal Marginal Relevance (elegant, flexibel)

MMR baut die Auswahl _greedy_ auf: Nimm das beste Item, dann für jedes weitere wähle das, was den besten Kompromiss aus "hoher Score" und "möglichst anders als die bisherige Auswahl" bietet:

```typescript
function mmrSelect(
  candidates: ScoredItem[],
  k: number,
  lambda: number = 0.5,
): ScoredItem[] {
  const selected: ScoredItem[] = [];
  const remaining = [...candidates];

  // Erstes Item: einfach der höchste Score
  selected.push(remaining.shift()!);

  while (selected.length < k && remaining.length > 0) {
    let bestIdx = 0;
    let bestMmr = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const relevance = remaining[i].score;
      const maxSim = Math.max(
        ...selected.map((s) => similarity(remaining[i], s)),
      );
      const mmr = lambda * relevance - (1 - lambda) * maxSim;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }
  return selected;
}
```

Für `similarity()` reicht eine einfache Heuristik:

- Gleiche Quelle UND gleiches Topic → 0.8
- Gleiches Topic, andere Quelle → 0.5
- Gleiche Quelle, anderes Topic → 0.3
- Beides anders → 0.0

`lambda = 0.5` ist ein guter Start: Halb Relevanz, halb Diversität.

### Ansatz C: Aspekt-basierte Diversifikation (xQuAD-Style)

Statt Similarity geometrisch zu messen, definierst du explizite Aspekte und stellst sicher, dass mehrere abgedeckt werden. Für Currit könnten Aspekte sein:

- **Thema**: {AI, Webdev, Systems, Startups, ...}
- **Format**: {Longread, Tutorial, Tool, Discussion}
- **Quelle**: {Reddit, HN, RSS}
- **Nähe zu Kerninteressen**: {Core-Interest, Near-Interest, Serendipity}

Dann wählst du mit Soft-Constraints: "Mindestens 2 verschiedene Themen, mindestens 2 verschiedene Quellen, maximal 1 Serendipity-Item." Das ist interpretierbar, deterministisch und leicht zu debuggen.

### Der Serendipity-Slot

Serendipity ist keine Scoring-Frage ("wie hoch ist der Score?"), sondern eine **Auswahl-Frage** ("aus welchem Pool picke ich?"). Du willst nicht einen Artikel, der im Gesamtscore irgendwie hoch rutscht trotz niedriger Relevanz — du willst explizit _aus einem anderen Themenbereich_ fischen und dort den qualitativ besten nehmen. Das ist eine Constraint-Entscheidung, kein Score-Tuning.

Zurück zum Koch-Wettbewerb: Statt den Juroren zu sagen "bewertet Desserts diesmal anders", sagst du "die ersten 5 Plätze kommen aus der normalen Wertung, aber Platz 6 geht an das beste Gericht einer Küche, die sonst nicht vertreten wäre."

Konkret: Nachdem Stufe 3 die normalen 4–6 Items ausgewählt hat, wird der Serendipity-Pick aus den _übrigen_ Kandidaten gezogen — gefiltert auf Topics, die noch nicht im Feed sind, und sortiert nur nach Qualität + Frische (ohne Relevanz):

```typescript
// Serendipity-Pick: bester "fremder" Artikel
const mainItems = mmrSelect(rankedCandidates, 5);
const usedTopics = new Set(mainItems.map((i) => i.primaryTopic));

const serendipityPool = rankedCandidates
  .filter((c) => !usedTopics.has(c.primaryTopic)) // anderes Topic
  .filter((c) => !mainItems.includes(c)) // noch nicht drin
  .sort(
    (a, b) =>
      b.qualityScore +
      b.freshnessScore - // nur Qualität + Frische
      (a.qualityScore + a.freshnessScore),
  );

const serendipityPick = serendipityPool[0];
const feed = [...mainItems, serendipityPick];
```

Das **garantiert**, dass etwas thematisch Neues in den Feed kommt — ein extrem guter Artikel schafft es rein, auch wenn er null Relevanz zu deinen bisherigen Interessen hat. Gleichzeitig ist die Qualitätshürde hoch genug, dass kein Müll durchrutscht. Und wenn der Serendipity-Pick geliked wird, fließt das über Thompson Sampling (Stufe 4) zurück ins Topic-Modell — so entdeckt der Feed neue Interessen organisch.

---

## Stufe 4: Feedback Loop – Aus Rückmeldungen lernen

Das ist der Teil, der deinen Feed über Zeit _persönlich_ macht.

### Thompson Sampling auf Topic-Ebene

Das Kernprinzip: Stell dir jedes Topic als Spielautomat vor, bei dem du nicht weißt, wie oft er auszahlt. Thompson Sampling modelliert deine Unsicherheit mit einer Beta-Verteilung pro Topic:

```typescript
// Jedes Topic hat alpha (Likes + 1) und beta (Non-Likes + 1)
// Start: Beta(1, 1) = "ich weiß nichts" (Gleichverteilung)

interface TopicBandit {
  topic: string;
  alpha: number; // Likes + 1
  beta: number; // Shown-but-not-liked + 1
}

// Tägliche Auswahl: Ziehe Zufallswert aus jeder Beta-Verteilung
function thompsonSample(bandit: TopicBandit): number {
  return jStat.beta.sample(bandit.alpha, bandit.beta);
}

// Nach einem Like auf ein "systems programming" Item:
bandit.alpha += 1;

// Nach einem angezeigten, aber nicht gelikten "cooking" Item:
bandit.beta += 1;
```

Das Geniale: **Exploration und Exploitation passieren automatisch.** Ein Topic mit Beta(1,1) – keine Daten – produziert wilde Samples (mal 0.1, mal 0.9), wird also oft probiert. Ein Topic mit Beta(20,5) – oft geliked – produziert konsistent hohe Samples, wird also bevorzugt. Kein Tuning nötig.

Speicherbedarf: Zwei Zahlen pro Topic in PostgreSQL. Das ist es.

**Gegen veraltete Vorlieben:** Wöchentlicher Decay, der die Verteilungen langsam Richtung Unsicherheit zurückzieht:

```typescript
// Einmal pro Woche:
bandit.alpha = 1 + (bandit.alpha - 1) * 0.95;
bandit.beta = 1 + (bandit.beta - 1) * 0.95;
```

### Keyword-Gewichte als Feinsteuerung

Neben Topics auf Keyword-Ebene: Halte ein Dictionary `{ keyword: weight }`, wobei jeder Like die Gewichte der Item-Keywords inkrementiert:

```typescript
// Neues Item scoren:
const keywordScore =
  item.tags
    .map((tag) => userKeywordWeights[tag] ?? 0)
    .reduce((sum, w) => sum + w, 0) / totalLikes;
```

### Logging – Die unterschätzte Zutat

Wenn du später irgendetwas "lernen" willst – selbst nur Weight-Tuning – brauchst du mindestens:

- Welche Kandidaten gab es heute?
- Welche wurden angezeigt?
- Welche wurden geöffnet/geliked/übersprungen?
- Welche Scores/Weights galten zu dem Zeitpunkt?

Das klingt nach Over-Engineering, aber es ist die Voraussetzung dafür, dass du nach 2 Wochen Nutzung sagen kannst: "Aha, Frische-Gewicht 0.25 ist zu niedrig, ich sehe zu viele alte Artikel." Alle großen Systeme nennen Observability & Logging als eigenen Pipeline-Schritt – das ist kein Deko.

---

## Der MVP-Fahrplan: 4 Phasen, inkrementell

### Phase 1: Heuristik-Scoring (Woche 1-2)

- Ingest aus Reddit, HN, RSS → PostgreSQL
- Score = `normalizedSourceScore^0.8 / (ageHours + 2)^1.5`
- Keyword-Matching gegen handkuratierte Interesse-Liste (1.5× Boost)
- Slot-basierte Source-Diversität
- Top 5 servieren → **du hast einen funktionierenden täglichen Feed**

### Phase 2: LLM-Enrichment (Woche 3-4)

- Täglicher Cron: Top ~30 Heuristic-Kandidaten → Claude Haiku Batch
- Zurück: `relevance_score`, `quality_score`, `tags[]`, `summary`
- Blend: `final = 0.3 × heuristic + 0.7 × llm_relevance`
- Tags in `content_tags` Tabelle → **Feed wird spürbar schlauer**

### Phase 3: Feedback Loop (Woche 5-6)

- Like-Button, `user_feedback` Tabelle
- Thompson Sampling auf LLM-generierten Topic-Tags
- Keyword-Gewichte aus Likes
- Logging: Kandidaten-Pool, angezeigte Items, Feedback
- → **Feed personalisiert sich über Zeit**

### Phase 4: Semantic Similarity (Woche 7-8)

- Embeddings via OpenAI text-embedding-3-small → pgvector
- User-Preference-Embedding = Centroid gelikter Artikel
- Cosine Similarity als zusätzliches Scoring-Signal
- MMR-basiertes Diversity-Re-Ranking statt Slot-Ansatz
- → **Feed versteht semantische Zusammenhänge**

---

## Nützliche Libraries und Tools

**TypeScript/Node.js:**

- `natural` – TF-IDF, Tokenization, Stemming (gut dokumentiert)
- `tiny-tfidf` – Minimale TF-IDF + Cosine Similarity (Kerry Rodden)
- `winkNLP` – Keyword Extraction, 650K Tokens/Sek, zero Dependencies
- `content-based-recommender` – Wraps TF-IDF + Cosine in train/recommend API
- `jstat` – Beta-Distribution Sampling für Thompson Sampling

**PostgreSQL:**

- `pgvector` Extension für Embedding-Storage und Cosine Similarity
- Gewichte/Config als JSONB-Column → tunebar ohne Schema-Migration

**Referenzprojekt:**

- `auto-news` (GitHub, 844+ Stars) – Persönlicher News-Aggregator mit RSS, Reddit, YouTube + LLM-Filterung via LangChain. Closest analog zu Currit in der Open-Source-Welt.

---

## Die wichtigste Erkenntnis

Kein einzelner Layer muss perfekt sein. Ein mittelmäßiger Time-Decay plus mittelmäßige Topic-Bandits plus mittelmäßiges LLM-Scoring, **kombiniert**, erzeugen einen Feed, der sich bemerkenswert kuratiert anfühlt. Das ist wie beim Kochen: Salz allein ist okay, Pfeffer allein ist okay, Säure allein ist okay – aber zusammen machen sie ein Gericht aus, das keins der Elemente allein hinbekäme.

Starte mit Phase 1 (5 Zeilen Scoring-Mathe), schick es live, nutz es eine Woche, und lass deine eigene Unzufriedenheit bestimmen, welchen Layer du als nächstes hinzufügst. Das System, das am meisten lernt, ist nicht das mit dem besten Algorithmus – sondern das, das schnell genug live geht, um die Feedback-Daten zu erzeugen, die alles andere erst möglich machen.
