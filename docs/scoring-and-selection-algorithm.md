# Currit – Scoring & Feed-Selection Algorithmus

_Stand: April 2026 – Ergebnis aus empirischem Testing mit 487 Reddit-Posts aus 22 Subreddits_

Siehe auch: [ranking-algorithm-notes.md](./ranking-algorithm-notes.md) für den breiteren Research-Kontext (Scoring-Theorie, LLM-Enrichment, Feedback Loops, Embeddings).

---

## Überblick

Der Algorithmus besteht aus zwei getrennten Schritten:

1. **Scoring (Normalisierung):** Jeder Post bekommt einen normalisierten Score, der ihn innerhalb seiner Community und global vergleichbar macht.
2. **Selection (Feed-Zusammenstellung):** Posts werden per gewichtetem Sampling mit Source Cap ausgewählt – nicht deterministisch nach Top-N.

Diese Trennung ist zentral: Das Scoring bestimmt _wie gut_ ein Post ist, die Selection bestimmt _welche Posts es in den Feed schaffen_. Diversität und Serendipity werden im Selection-Schritt gelöst, nicht im Scoring.

---

## Schritt 1: Hybrid-Scoring

Jeder Post bekommt einen `normalizedScore` zwischen 0 und 1, der zwei Perspektiven mischt:

### Local Percentile (80% Gewicht)

Wie gut ist dieser Post _innerhalb seiner eigenen Community_?

- Für jede Quelle (Subreddit, HN, RSS-Feed): Sortiere alle Posts nach Score und nach Kommentaranzahl.
- Weise jedem Post seinen Percentile-Rang zu (0.0 = schlechtester, 1.0 = bester innerhalb der Quelle).
- Kombiniere: `localScore = 0.7 × scorePercentile + 0.2 × commentPercentile + 0.1 × upvoteRatio`

**Warum:** Ein Post mit 150 Upvotes in r/neovim (Top 1% dort) ist für den User genauso relevant wie ein Post mit 40.000 in r/funny (Top 1% dort). Die lokale Percentile macht Quellen unterschiedlicher Größe vergleichbar.

**Für RSS-Items ohne Votes:** Default-Percentile 0.5 (Median-Annahme). Wenn der RSS-Feed historische Daten hat, kann die Percentile gegen die eigene Historie berechnet werden.

### Global Log-Score (20% Gewicht)

Wie gut ist dieser Post _im Vergleich zu allen Posts aller Quellen_?

- `log(1 + score)` über alle Posts normalisiert auf [0, 1].
- Gleiche Formel für Kommentare.
- Kombiniere: `globalScore = 0.7 × logScoreNorm + 0.2 × logCommentsNorm + 0.1 × upvoteRatio`

**Warum:** Reine lokale Normalisierung behandelt alle Quellen als exakt gleichwertig. Der Global-Anteil sorgt dafür, dass ein viral gehender Post (z.B. 64k Upvotes) _etwas_ wahrscheinlicher im Feed landet als ein Post mit 3 Upvotes, auch wenn beide lokal auf Platz 1 ihrer Quelle stehen. Das `log()` komprimiert die riesigen Score-Unterschiede (0 bis 64.000) auf eine handhabbare Skala.

### Kombination

```
normalizedScore = 0.2 × globalScore + 0.8 × localScore
```

### Das 20:80-Verhältnis

Das Verhältnis `global:local` ist ein stufenloser Regler, der über eine Config einstellbar sein sollte:

| Einstellung | Effekt |
|---|---|
| `0:100` | Maximale Fairness – alle Quellen bekommen ähnlichere Chancen |
| **`20:80`** | **Sweet Spot – leichte Qualitätspräferenz bei weiterhin guter Verteilung** |
| `40:60` | Spürbare Bevorzugung großer Quellen |
| `60:40` | Große Quellen dominieren sichtbar |

Die exakten Gini-/Share-Werte hängen seit der Einführung von Source-Size Shrinkage auch von `localShrinkageK` ab und sollten aus dem Analyse-Script abgelesen werden, nicht aus statischen Tabellen im Doc.

Der Unterschied zwischen groß und klein ist spürbar, aber nicht erdrückend.

---

## Schritt 2: Gewichtetes Sampling mit Source Cap

Statt die Top-N Posts nach Score zu nehmen, wird der Feed per **gewichtetem Zufall** zusammengestellt.

### Warum kein Top-N?

Top-N produziert jeden Tag den exakt gleichen Feed (deterministisch). Es gibt keine Abwechslung, keine Überraschung, kein Entdecken. Außerdem können bei Top-N maximal `ceil(feedSize / sourceCap)` verschiedene Quellen vorkommen – alle anderen werden systematisch ausgeschlossen.

### Wie das Sampling funktioniert

```
Eingabe: Pool aller normalisierten Posts, feedSize (z.B. 7), maxPerSource (z.B. 2)
Ausgabe: Feed mit feedSize Posts

1. Für jeden Post: samplingWeight = (normalizedScore + 0.05) ^ (1 / temperature)
2. Wiederhole bis Feed voll:
   a. Filtere Posts, deren Quelle bereits maxPerSource mal im Feed ist
   b. Ziehe einen Post per gewichtetem Zufall (Wahrscheinlichkeit proportional zu samplingWeight)
   c. Füge ihn zum Feed hinzu
```

### Die Parameter

**`temperature`** (Default: 1.0) – Steuert den Grad der Zufälligkeit:
- `temperature = 0.5`: Milde Randomness – Top-Posts werden in ~18% der Tage gewählt
- `temperature = 1.0`: Moderate Randomness – Top-Posts in ~13% der Tage. Guter MVP-Default
- `temperature = 2.0`: Hohe Randomness – auch schwächere Posts tauchen regelmäßig auf
- `temperature = ∞`: Uniform Random – kein Qualitätssignal mehr

**`maxPerSource`** (Default: 2) – Source Cap, maximal N Posts pro Quelle im Feed. Das ist der wichtigste Diversity-Mechanismus. Er stellt sicher, dass keine einzelne Quelle den Feed dominiert, egal wie hoch ihre Scores sind.

**`+ 0.05` Floor** – Stellt sicher, dass auch der schlechteste Post (Score ~0) eine kleine Chance hat, gezogen zu werden. Ohne diesen Floor würden Posts mit Score 0 nie erscheinen.

### Ergebnis: Emergent Serendipity

Das gewichtete Sampling erzeugt Serendipity organisch, ohne einen expliziten "Serendipity-Slot":
- Bessere Posts werden häufiger gezogen, aber nicht garantiert
- Jeder Tag sieht anders aus
- Über eine Woche verteilt tauchen bei 22 Quellen ~19 verschiedene auf
- Auch Nischen-Quellen mit wenigen Posts (r/badUIbattles, r/FullStack) erscheinen regelmäßig – in ~35–48% der Wochen

---

## Zusammenfassung der Defaults

| Parameter | Default | Config-Key |
|---|---|---|
| Feed-Größe | 7 Items | `feedSize` |
| Source Cap | 2 pro Quelle | `maxPerSource` |
| Global-Weight | 0.2 | `globalWeight` |
| Sampling Temperature | 1.0 | `samplingTemperature` |
| Score-Gewicht im Local Score | 0.7 | `weights.score` |
| Comment-Gewicht im Local Score | 0.2 | `weights.comments` |
| Upvote-Ratio-Gewicht im Local Score | 0.1 | `weights.upvoteRatio` |

Alle Parameter sollten als Config (JSON/DB) leben, nicht als Hardcode.

---

## Pseudocode

```
FUNCTION buildFeed(allSources, config):
    // config = { feedSize: 7, maxPerSource: 2, globalWeight: 0.2,
    //            temperature: 1.0, weights: { score: 0.7, comments: 0.2, ratio: 0.1 } }

    // ─── SCHRITT 1: Scoring ────────────────────────────────────

    // 1a) Local Percentile pro Quelle
    FOR EACH source IN allSources:
        posts = source.posts
        scoreRanks    = PERCENTILE_RANK(posts, BY post.score)
        commentRanks  = PERCENTILE_RANK(posts, BY post.commentCount)

        FOR EACH post IN posts:
            post.localScore = weights.score    × scoreRanks[post]
                            + weights.comments × commentRanks[post]
                            + weights.ratio    × post.upvoteRatio

    // 1b) Global Log-Score über alle Posts
    allPosts   = FLATTEN(allSources)
    logScores  = [log(1 + post.score) FOR post IN allPosts]
    logComments = [log(1 + post.commentCount) FOR post IN allPosts]
    minLS, maxLS = MIN(logScores), MAX(logScores)
    minLC, maxLC = MIN(logComments), MAX(logComments)

    FOR EACH post IN allPosts:
        normLogScore    = (log(1 + post.score) - minLS) / (maxLS - minLS)
        normLogComments = (log(1 + post.commentCount) - minLC) / (maxLC - minLC)
        post.globalScore = weights.score    × normLogScore
                         + weights.comments × normLogComments
                         + weights.ratio    × post.upvoteRatio

    // 1c) Hybrid-Score
    FOR EACH post IN allPosts:
        post.normalizedScore = globalWeight       × post.globalScore
                             + (1 - globalWeight) × post.localScore

    // ─── SCHRITT 2: Gewichtetes Sampling ───────────────────────

    // 2a) Sampling-Gewichte berechnen
    FOR EACH post IN allPosts:
        post.samplingWeight = (post.normalizedScore + 0.05) ^ (1 / temperature)

    // 2b) Feed zusammenstellen
    feed         = []
    available    = COPY(allPosts)
    sourceCounts = {}   // Quelle → Anzahl im Feed

    WHILE LENGTH(feed) < feedSize AND LENGTH(available) > 0:

        // Source Cap anwenden
        eligible = [p FOR p IN available
                      WHERE sourceCounts[p.source] < maxPerSource]

        IF eligible IS EMPTY:
            BREAK

        // Gewichteten Zufall ziehen
        totalWeight = SUM(p.samplingWeight FOR p IN eligible)
        r = RANDOM(0, totalWeight)

        FOR EACH post IN eligible:
            r = r - post.samplingWeight
            IF r <= 0:
                picked = post
                BREAK

        // Post zum Feed hinzufügen
        APPEND picked TO feed
        sourceCounts[picked.source] += 1
        REMOVE picked FROM available

    RETURN feed


FUNCTION PERCENTILE_RANK(posts, BY getValue):
    sorted = SORT(posts, BY getValue, ASCENDING)
    n = LENGTH(sorted) - 1   // damit der beste Post 1.0 bekommt
    IF n == 0: n = 1

    ranks = {}
    FOR i = 0 TO LENGTH(sorted) - 1:
        ranks[sorted[i]] = i / n

    RETURN ranks
    // Ergebnis: schlechtester Post → 0.0, bester → 1.0
```

---

## Offene Punkte für spätere Iterationen

- **Time Decay:** Aktuell nicht enthalten, weil das Scoring gegen einen Tages- oder Wochen-Snapshot läuft. Wenn Posts über mehrere Tage im Pool bleiben, braucht es einen Freshness-Decay (empfohlen: `exp(-0.029 × ageHours)`, 24h-Halbwertszeit – siehe ranking-algorithm-notes.md).
- **Feedback Loop:** Likes fließen noch nicht zurück. Geplant: Thompson Sampling auf Topic-Ebene (siehe ranking-algorithm-notes.md, Stufe 4).
- **LLM-Enrichment:** Relevanz-Scoring und Summary-Generierung via Claude Haiku als zusätzliches Signal im Score-Mix.
- **Expliziter Serendipity-Slot:** Falls die emergente Serendipity durch gewichtetes Sampling nicht ausreicht, kann ein dedizierter Slot nachgerüstet werden (siehe ranking-algorithm-notes.md, "Der Serendipity-Slot").
- **HN/RSS-Adaption:** Die Gewichte (0.7 score / 0.2 comments / 0.1 ratio) müssen pro Quelltyp angepasst werden. HN hat `score` + `descendants`, RSS hat oft weder noch.
- **Source-size shrinkage (verworfen):** Ein getesteter Ansatz war, `localScore` bei kleinen Quellen Richtung `globalScore` zu ziehen. In der aktuellen Reddit-Simulation hat das die Vielfalt jedoch klar verschlechtert (`gini` rauf, `subsPerWeek` runter) und auch mehrere 25-Post-Quellen unnötig benachteiligt. Deshalb aktuell nicht Teil des Baseline-Algorithmus.
