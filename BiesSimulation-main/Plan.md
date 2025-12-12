# BiesSimulation – Plan / Next Steps (Beta-Release)

Dieses Dokument sammelt **alle** sinnvollen offenen Arbeiten, priorisiert nach „Beta-Release-fähig“.
Es basiert auf dem aktuellen Repo-Stand (Vite/TS, UI-Controls, Presets, Evolution, Stats-Chart) und den zwei Einschätzungen der Vorgesetzten.

## Definition: „Beta-Release-fähig“
Ein Beta-Release ist erreicht, wenn:
- Ein Nutzer kann die Simulation **lokal** starten (ohne Internet) und die wichtigsten Parameter im UI bedienen.
- Ergebnisse sind **reproduzierbar** (Seed sichtbar/setzbar, Konfiguration exportierbar, deterministischer Sim-Kern).
- Es gibt eine kurze, klare **Dokumentation**, wie Presets und Metriken zu interpretieren sind.
- Es existiert eine **Testbasis** (Unit + deterministischer Sim-Run Test) und `npm run check` läuft stabil.

Nicht zwingend für Beta, aber sinnvoll als „Game-Theory-Tool“-Ausbau:
- Experiment-Modus (Batch-Runs, Varianz/Mittelwerte), Pairwise-Heatmap, Agent-Inspector, erweiterte Analytics.

## Ist-Stand (Kurz)
- Seedable RNG existiert, Seed ist aber **nicht im UI** sichtbar/setzbar; Default nutzt Zeit (`Date.now()` in `src/utils/RNG.ts`).
- `Chart.js` wird derzeit **per CDN** geladen (offline/restricted network bricht), obwohl `chart.js` als Dependency vorhanden ist.
- Sim-Kern nutzt `Date.now()` in Memory/Events → schwer exakt reproduzierbar.
- UI kann einige Parameter live ändern (Food Rate/Max Agents/Mutation/Vision/Food Value/Boundaries), aber **keinen Payoff-Matrix-/Costs-Editor**.
- Tests existieren (Vitest) für RNG/Interaction/Strategies/Evolution/Vector2, aber keine „deterministische Sim-Run“ Regression.

## Prioritäten
- **P0 (Blocker für Beta):** Muss rein, damit niemand „Release-Qualität“ kritisiert.
- **P1 (Beta-Mehrwert):** Hoher Nutzen/UX/Analyse, aber Beta kann notfalls ohne.
- **P2 (Tool-Ausbau):** Macht es zu einem „Game Theory Tool“ statt „Life Sim“.
- **P3 (Polish):** Optik/„Juice“, nice-to-have.

---

# P0 – Unverzichtbar (Beta-Blocker)

## P0.1 Reproduzierbarkeit: Seed im UI + Export/Import
**Problem:** Seed ist nur per Code/Console zugänglich; Presets haben aktuell keinen Seed.

**Aufgaben**
- UI: Feld/Slider für Seed (Number + optional String), inkl. „Randomize“ und „Copy Seed“.
- UI: „Copy Config“ (Seed + Preset + Ratios + Parameter) als JSON in Clipboard.
- UI: „Import Config“ (JSON einfügen) → setzt alles im UI + `world.reset()` / `world.loadPreset()` konsistent.
- Presets: optional `seed` für Demo-Presets (damit Beispiele reproduzierbar sind).

**Akzeptanzkriterien**
- Zwei Runs mit gleicher exportierter Config liefern (über N Ticks) gleiche Stats-Kurven/Endwerte (mindestens Population/Avg Energy/Births/Deaths).
- Nutzer sieht jederzeit den aktuell verwendeten Seed (inkl. nach Preset-Wechsel/Reset).

**Betroffene Stellen (Hinweise)**
- `src/ui/Controls.ts` (Controls-Panel erweitern)
- `index.html` (neue Inputs/Buttons)
- `src/utils/RNG.ts` (Seed-Handling; UI-Sync)
- `src/core/World.ts` (Seed in reset/loadPreset konsistent setzen)
- `src/config/presets.ts` (seed-Feld nutzen)

## P0.2 Determinismus im Sim-Kern (weg von Date.now)
**Problem:** `Date.now()` wird für Encounter-Memory und Events genutzt; das macht Runs zeitabhängig und schwer exakt reproduzierbar.

**Aufgaben**
- Sim-Zeitmodell einführen: z.B. `world.simTick` (int) und/oder `world.simTimeSeconds` (float).
- Alle „timestamp“-Felder in sim-relevanten Strukturen auf Sim-Zeit umstellen:
  - Agent Memory (TitForTat etc.): Memory-Timestamp als Tick/SimTime.
  - Interaction Events: Event-Timestamp als Tick/SimTime (Renderer kann daraus Effekte ableiten).
- Sicherstellen, dass die Sim-Logik keine wall-clock Zeit mehr benötigt (UI/FPS/Chart-Sampling darf weiterhin `performance.now()` nutzen).

**Akzeptanzkriterien**
- Mit gleicher Seed+Config läuft die Sim deterministisch (bei gleichem Tick-Count) unabhängig von FPS/PC.
- Keine `Date.now()`-Nutzung mehr in `src/models/*` und `src/systems/*`.

**Betroffene Stellen (Hinweise)**
- `src/models/Agent.ts` (Memory timestamp)
- `src/systems/InteractionSystem.ts` (Event timestamp)
- `src/core/World.ts` (Sim-Tick/Sim-Time verwalten)

## P0.3 Offline/Restricted-Network robust: Chart.js bundlen
**Problem:** Populations-Chart lädt Chart.js per CDN; offline/restricted bricht.

**Aufgaben**
- CDN-Lader entfernen und Chart.js als echte Dependency importieren (Vite bundling).
- Fallback definieren: Wenn Chart nicht initialisiert werden kann, UI bleibt nutzbar (Hinweistext statt Crash).

**Akzeptanzkriterien**
- `npm run build` erzeugt ein Bundle, das ohne Internet funktioniert (Population-Chart funktioniert trotzdem).

**Betroffene Stellen (Hinweise)**
- `src/ui/StatsChart.ts` (CDN-Ladepfad entfernen)
- `package.json` (Dependency ist bereits vorhanden)

## P0.4 Dokumentation „Wie interpretiere ich das?“ (kurz, aber konkret)
**Problem:** README erklärt Features, aber nicht ausreichend „Wie lese ich Outcomes? Was bedeutet Payoff/Costs? Was erwarte ich bei Presets?“.

**Aufgaben**
- README ergänzen:
  - Payoff Matrix Bedeutung (und dass `FIGHT_COST` separat ist).
  - Welche Parameter beeinflussen was (Food Rate, Food Value, Max Agents, Mutation, Vision, Boundaries).
  - Preset-Erwartungen: kurze „Hypothese“ pro Preset (z.B. Hawk vs Dove, Scarcity/Abundance).
  - Reproduzierbarkeit: Seed setzen, Config export/import, deterministischer Modus.
  - Performance-Hinweise (Max Agents, Trails, Effects, Vision-Radius).

**Akzeptanzkriterien**
- Ein neuer Nutzer kann ohne Code-Änderungen ein Preset starten, Seed setzen, Ergebnis wiederholen und die wichtigsten Metriken verstehen.

**Betroffene Stellen**
- `README.md`

## P0.5 Tests: deterministischer Sim-Run als Regression
**Problem:** Tests existieren, aber kein Test, der „Endzustand nach N Ticks“ bei fixem Seed absichert.

**Aufgaben**
- Neuen Test hinzufügen, der:
  - `setWorldDimensions` setzt,
  - `World` mit fixer Config+Seed initialisiert,
  - N Updates mit fixer `delta` (oder Tick-Schritt) ausführt,
  - erwartete Stats (oder Hash) vergleicht.
- Optional: Golden-Values für 2–3 kleine Presets (kleine Welt, kleine AgentCount), damit der Test schnell und stabil bleibt.

**Akzeptanzkriterien**
- Test ist stabil (nicht flaky) und läuft schnell in CI/local.
- Bei unbeabsichtigten Sim-Änderungen schlägt er deterministisch fehl.

**Betroffene Stellen**
- `tests/*` (z.B. `tests/determinism.test.ts`)
- `src/core/World.ts` (falls Sim-Tick eingeführt wird)

---

# P1 – Sehr sinnvoll (hoher Mehrwert / UX / Analyse)

## P1.1 Payoff/Costs im UI editierbar (inkl. FightCost)
**Ziel:** Nutzer kann „Rules of the Game“ ohne Code ändern (Prisoner’s Dilemma/Chicken/Stag Hunt etc. approximieren).

**Aufgaben**
- UI-Panel: Editierfelder für:
  - `FIGHT_COST`, `FOOD_VALUE` (teilweise bereits), optional `BASE_TICK_COST`, `MOVEMENT_COST_FACTOR`, `REPRODUCTION_COST`.
  - Payoff-Matrix Einträge (`FIGHT_FIGHT`, `FIGHT_SHARE`, …) inkl. Validierung/Min-Max.
- Optional: „Reset to default“ pro Preset/Matrix.

**Akzeptanzkriterien**
- Änderungen wirken klar definiert (live oder beim Reset) und sind dokumentiert.
- Export/Import enthält diese Werte (falls P0.1 implementiert).

**Betroffene Stellen**
- `src/config/globalConfig.ts`
- `src/ui/Controls.ts`

## P1.2 Experiment-Modus (Batch Runs, Mittelwerte/Varianz)
**Ziel:** Aussagen wie „Strategie X gewinnt“ werden statistisch belastbar (nicht nur ein zufälliger Run).

**Aufgaben**
- UI: „Experiment“ Bereich:
  - N Runs (z.B. 10/50/100), seed-range oder seed list (start seed + count).
  - Output: Mittelwert/Varianz der Endpopulation pro Strategie, Avg Energy, Total Births/Deaths.
  - Plot: Konfidenzband oder Errorbars (optional in erster Iteration).
- Technisch: Simulation headless (ohne Rendering) oder schneller Zeit-Skip (TimeScale >> 1 ohne FPS-Abhängigkeit).

**Akzeptanzkriterien**
- Experiment läuft ohne UI-Freezes (mindestens mit small settings) und liefert reproduzierbare Ergebnisse bei gleichen Seeds.

## P1.3 Metriken erweitern (Interpretation)
**Aufgaben**
- Stats pro Strategie:
  - Average energy/fitness pro Strategie
  - Births/Deaths pro Strategie
  - Action-Frequenzen (Fight/Share/Flee) pro Strategie und global
  - Optional: Varianz/Gini der Energie (Ungleichheit)
- UI: Anzeige als kompakte Tabelle, optional zusätzlich Chart-Serien.

**Betroffene Stellen**
- `src/core/World.ts` (`getStats()` erweitern oder neues Stats-Objekt)
- `src/ui/StatsDisplay.ts`, `src/ui/StatsChart.ts`
- `src/systems/InteractionSystem.ts` (Action/outcome counting)

## P1.4 Preset Export/Import (JSON) als UX-Feature (über Seed hinaus)
**Aufgaben**
- „Export Preset“: aktuelles Setup als JSON (inkl. Payoff/Costs falls P1.1 umgesetzt).
- „Import Preset“: JSON einfügen, UI + World werden synchron gesetzt.
- Optional: „Save to localStorage“ (Preset Slots) für schnelle Wiederverwendung.

---

# P2 – „Game Theory Tool“-Ausbau (Analytics/Debug/Insight)

## P2.1 Pairwise Interaction Heatmap (5×5)
**Ziel:** „Wer schlägt wen wie oft?“ sichtbar machen (RPS-Dynamiken, Dominanzzyklen).

**Aufgaben**
- Matrix zählen: Für jedes Strategy-Paar (A,B) Häufigkeit und Outcome (A gewinnt/B gewinnt/tie).
- UI: Heatmap oder Tabelle, optional normalisiert (% winrate).

**Betroffene Stellen**
- `src/systems/InteractionSystem.ts` (Interaction outcomes erfassen)
- `src/ui/*` (neues Panel)

## P2.2 Agent Inspector (Klick auf Agent)
**Ziel:** Debugging/Verständnis: warum verhält sich Agent X so?

**Aufgaben**
- Picking: Klick auf Canvas → nächster Agent in Radius.
- Sidepanel/Tooltip:
  - Energy, Age, Strategy, Traits
  - Letzte 5 Encounters (opponent strategy, actions, outcome, tick)
  - Optional: Memory-Status (TitForTat)
- Optional: „Follow Camera“ / Highlight Agent.

**Betroffene Stellen**
- `src/renderer/*` (Input/Picking)
- `src/models/Agent.ts` (Expose last interactions / Memory)
- `src/systems/InteractionSystem.ts` (Log pro Agent)

## P2.3 Visual Analytics (Heatmaps/Overlays)
**Aufgaben**
- Food-Dichte/Hotspots Overlay (wenn Hotspots enabled)
- Konfliktzonen Overlay (wo fights passieren)
- Minimap + Legende (Strategy-Farben)

---

# P3 – Optik/Polish („Juice“, optional)

## P3.1 Expressive Agents
- Shapes/Icons je Strategy (z.B. spiky = Aggressive, shield = TitForTat).
- Size abhängig von Energy, ggf. Outline bei low energy.
- Optional: Blickrichtung/„eyes“.

## P3.2 Effects
- Eigener Effekt für „FLEE“.
- Trails: Farbe nach Strategy/Energy, Fade.
- Bessere Hit-Effects (intensitätsbasiert nach payoff/cost).

## P3.3 Environment
- Subtiles Grid/Background-Texture verbessern (vignette/particles).

---

# Release/Qualität – Checkliste (operativ)

## Build & Runtime
- `npm run check` (lint + test + build) muss grün sein.
- `npm run preview` prüfen: Controls/Chart/Canvas laufen im Production-Build.
- Offline-Check: Build öffnen ohne Internet → App läuft, Chart funktioniert (P0.3).

## Stability & Performance
- Default-Settings dürfen nicht ruckeln (60 FPS anstreben).
- Max Agents + Trails/Effects dokumentieren (Performance-Schalter).
- Keine Memory-Leaks (Chart destroy/reset; Event-Listen begrenzen; Pools nutzen ist bereits gut).

## Dokumentation (Minimum für Beta)
- README: Quickstart, Controls, Presets, Interpretation, Repro (P0.4).
- Kurzer Abschnitt „Known limitations“ (z.B. keine Experiments/Heatmaps/Inspector in Beta, falls noch offen).

---

# Konkrete nächste Schritte (Empfehlung)
1) P0.3 Chart bundlen (schneller Win, reduziert Release-Risiko).
2) P0.2 Determinismus (Sim-Time/Tick) + P0.1 Seed-UI/Config exportieren.
3) P0.5 deterministischer Regression-Test.
4) P0.4 Doku finalisieren.
5) Danach P1.1 Payoff/Costs Editor (macht es sofort „game-theory“).
