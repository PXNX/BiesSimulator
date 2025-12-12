# BiesSimulation – Entwicklungsplan (Prototype -> Beta)

Dieser Plan strukturiert die Entwicklung in logische Phasen: Erst die technische Basis (Prototype/Tech), dann die Analyse-Tools (Beta/Science), und zuletzt Erweiterungen.

**Wichtige Randbedingungen:**
1.  **Keine Grafik-Assets:** UI und Spielgrafik müssen rein programmatisch (CSS, Canvas Draw-Calls) gelöst werden. Keine Bilder/Icons importieren.
2.  **Fokus auf Funktionalität:** Erst muss die Simulation korrekt rechnen, dann gut aussehen.

---

## Phase 1: Prototype Core (Das technische Fundament)
*Ziel: Die Simulation läuft stabil offline, ist deterministisch und die physikalischen Regeln sind robust.*

### 1.1 Chart.js offline verfügbar machen (Blocker)
**Problem:** Chart.js wird per CDN geladen; offline/restricted network bricht die App.
**Aufgaben:**
- `package.json` prüfen (Chart.js sollte da sein).
- `src/ui/StatsChart.ts`: Import auf lokales Modul umstellen (statt global `window.Chart`).
- Fallback/Error-Handling, falls Chart nicht lädt.
**Betroffene Stellen:** `src/ui/StatsChart.ts`, `index.html`.

### 1.2 Reproduzierbarkeit: Seed & Determinismus
**Problem:** `Math.random()` und `Date.now()` machen Runs unwiederholbar.
**Aufgaben:**
- **RNG:** Globalen Seed-basierten RNG (in `src/utils/RNG.ts`) erzwingen.
- **UI:** Seed im `Controls.ts` anzeigen, editierbar machen und "Copy Seed" Button.
- **Zeit:** Alle `Date.now()` Aufrufe in der Simulationslogik (`InteractionSystem`, `Agent.memory`) durch `world.tick` ersetzen.
**Akzeptanzkriterien:**
- Gleicher Seed + gleiche Config = Exakt gleicher Simulationsverlauf (Positionen & Stats) über N Ticks.

### 1.3 Dynamische Payoff-Matrix (Regel-Editor)
**Problem:** Spielregeln (Energie-Gewinn/Verlust) sind hartkodiert (`globalConfig.ts` readonly).
**Aufgaben:**
- **Config:** `PAYOFF` und Kostentabellen in einen veränderbaren State (RuntimeConfig) umziehen.
- **UI:** Neues Panel "Game Rules" oder Erweiterung in `Controls.ts`:
    - Inputs für `FIGHT_COST`, `FOOD_VALUE`.
    - Inputs für die Matrix-Werte (z.B. Fight vs Fight: -20).
- **Reset:** Button "Reset to Defaults".
**Betroffene Stellen:** `src/config/globalConfig.ts` (ändern zu mutable/state), `src/ui/Controls.ts`.

---

## Phase 2: Beta Features (Analyse-Tools & Usability)
*Ziel: Der Nutzer kann verstehen und analysieren, wer warum gewinnt.*

### 2.1 Agent Inspector (Detailsicht) - "Must Have"
**Problem:** Man sieht nur Punkte, aber nicht deren Zustand/Gedanken.
**Aufgaben:**
- **Input:** Canvas Click-Handler implementieren, der den nächsten Agenten zum Klick sucht.
- **UI:** Overlay/Simples `div` (absolute Positionierung), zeigt für selektierten Agenten:
    - ID, Strategie, Energy, Age.
    - Letzte 5 Interaktionen (Memory Log auslesen).
    - Visuelles Highlight (z.B. weißer Kreis um Agent).
**Betroffene Stellen:** `src/renderer/Renderer.ts` (Click), `src/ui/MousInput.ts` (evtl. neu), `src/models/Agent.ts` (Memory Public Access).

### 2.2 Interaktions-Heatmap - "Must Have"
**Problem:** Globale Charts zeigen nicht, "wer gegen wen" gewinnt.
**Aufgaben:**
- **Tracking:** `InteractionSystem` muss eine 5x5 Matrix (Strategy vs Strategy) im Hintergrund füllen (Wins/Losses zählen).
- **UI:** Neues Tab/Panel "Analysis":
    - Darstellung als einfache HTML-Tabelle.
    - Einfärbung der Zellen (Grün = Vorteil Zeile, Rot = Vorteil Spalte).
**Betroffene Stellen:** `src/systems/InteractionSystem.ts`, `src/ui/StatsDisplay.ts`.

### 2.3 Config Export/Import (JSON)
**Aufgaben:**
- Button "Copy Config": Serialisiert aktuellen State (Seed + Rules + Ratios) zu JSON -> Clipboard.
- Button "Paste Config": Liest Clipboard/Textfeld -> Setzt World State & Reset.
**Betroffene Stellen:** `src/core/World.ts` (Serialization), `src/ui/Controls.ts`.

---

## Phase 3: Qualität & Stabilität
*Ziel: Release-Fähigkeit sicherstellen.*

### 3.1 Automatisierte Regression Tests
**Aufgabe:** Ein Test (`tests/determinism.test.ts`), der einen vollen Sim-Run (z.B. 1000 Ticks) headless durchführt und den Hash des Endzustands prüft.
**Ziel:** Verhindert, dass Refactorings die Logik unbemerkt ändern.

### 3.2 Dokumentation & Hilfen
**Aufgabe:**
- README ergänzen: Was bedeuten die Matrix-Werte? Wie nutzt man Presets?
- Kurze Tooltips im UI (via `title` Attribut) für kryptische Parameter.

---

## Phase 4: Backlog / Future Extensions (Nicht in Beta)
*Diese Features sind komplex oder rein optisch und werden erst nach erfolgreicher Beta angegangen.*

*   **Räumliche Komplexität (Low Prio):** Hindernisse, Sumpf-Zonen, Mauern. (Erfordert kompletten Umbau von `MovementSystem` und `SpatialGrid`).
*   **Visuelle Repräsentation (Shapes):** Zeichnen von Formen (Dreiecke, Vierecke) statt nur Farben via Canvas API.
*   **Experiment-Modus:** Batch-Runs (100x Simulieren im Hintergrund) für statistische Varianz-Analyse.
