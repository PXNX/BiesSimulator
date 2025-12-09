# BiesSimulation – Projekt- und Umsetzungsplan

## Zielbild
- Browserbasierte 2D-Simulation spieltheoretischer Agenten (Hawk/Dove/Tit-for-Tat etc.) auf Canvas, mit Live-Statistiken, UI-Kontrollen und Presets.
- Tech-Stack: TypeScript + Vite (SPA), Canvas für Rendering, Chart.js für Stats, Hosting via GitHub Pages (Actions).
- Klare Trennung: Engine/Logik, Rendering, UI/Stats, Tests, Deploy.

## Aktueller Stand (Inventur)
- Vite + TS Grundgerüst vorhanden; CanvasRenderer initialisiert; GameLoop mit fixer Timestep; World spawnt 20 Agents + 50 Food (random).
- Modelle: Vector2, Entity, Agent (velocity/acceleration/energy), Food. MovementSystem: wander + Boundaries. GlobalConfig mit festen window Maßen.
- HTML/CSS minimal; keine UI, keine Statistiken, Chart.js nicht genutzt.
- Fehlend: Strategien/Payoff-Logik, Interaktionen/Kollisionen, Evolution (Energieverbrauch, Reproduktion, Tod), Spatial Partitioning, Presets, EventBus, UI/Controls, Stats/Chart, Tests, Lint/Format, README/Docs.

## Soll-Architektur
- `config`: `globalConfig` (weltweite Defaults ohne direkte window-Abhängigkeit), `presets.ts` (Szenarien, Mutation/Food-Raten).
- `core`: `GameLoop`, `World` (init/reset, tick), `SpatialGrid` (Nachbarsuche), `EventBus` (Observer), optional `TimeScaler` (Pause/Step).
- `models`: `Vector2`, `Entity`, `Agent` (traits: speed, vision, aggression, memory, reproductionCooldown, age), `Food` (value, respawnTimer), ggf. `Traits`-Typ und `Memory`-Struct.
- `strategies`: `IStrategy` Interface (`name`, `getColor`, `decideAction`, optional `onEncounterResult`), Implementierungen: Aggressive/Hawk, Passive/Dove, Cooperative, TitForTat, Random; optional PackHunter/Scavenger.
- `systems`: `MovementSystem` (wander/seek/flee/arrive/separate), `InteractionSystem` (Agent-Agent Payoff, Agent-Food consume), `EvolutionSystem` (Energieverbrauch, Tod, Reproduktion mit Mutation), `StatsSystem` (Aggregationen, Events), `SpawnSystem/FoodSystem` (respawn cadence).
- `renderer`: `CanvasRenderer` (devicePixelRatio, resize), `Sprites` (Farben/Shapes per Strategie), Effekte (hit flash, consume pulse).
- `ui`: `Controls` (Sliders/Buttons für Populationsgrößen, Food-Rate, Speed, Vision, Mutation, Presets, Start/Stop/Reset/Step), `StatsChart` (Chart.js Wrapper), `HUD` (FPS/Tick/Counts).
- `utils`: RNG mit Seed, clamp/map, collision helpers, id helpers, timers.
- Tests: Unit (Vector2, strategies, payoff), Integration (Interaction/Evolution), E2E smoke (UI + Canvas boot).

## Ziel-Verzeichnisstruktur
```
src/
  config/        globalConfig.ts, presets.ts
  core/          GameLoop.ts, World.ts, SpatialGrid.ts, EventBus.ts
  models/        Vector2.ts, Entity.ts, Agent.ts, Food.ts, Traits.ts (optional)
  strategies/    IStrategy.ts, Aggressive.ts, Passive.ts, Cooperative.ts, TitForTat.ts, Random.ts
  systems/       MovementSystem.ts, InteractionSystem.ts, EvolutionSystem.ts, FoodSystem.ts, StatsSystem.ts
  renderer/      CanvasRenderer.ts, Sprites.ts, Effects.ts
  ui/            Controls.ts, StatsChart.ts, HUD.ts
  utils/         MathUtils.ts, RNG.ts, Events.ts (falls getrennt), Types.ts
  main.ts
style.css
index.html
.github/workflows/deploy.yml
Plan.md, README.md, vite.config.ts, tsconfig.json, package.json
```

## Roadmap (Phasen)
### Phase 0 – Tooling & Grundlagen
- Abhängigkeiten ergänzen: ESLint, Prettier, Vitest, @vitest/ui, jsdom, @types/node, @types/chart.js, Playwright (optional e2e), npm scripts (`lint`, `format`, `test`, `coverage`, `check`).
- Vite-Konfig prüfen (base für GitHub Pages, ggf. `/repo-name/`).
- README + diesen Plan pflegen; EditorConfig; commit hooks optional (lint-staged).

### Phase 1 – Welt & Rendering
- `globalConfig` refactor: responsive Maße (aus Renderer), Dichte-Parameter (agentDensity, foodDensity), Energiestart, Costs.
- `World` reset/init mit parametrischem Spawn (counts per Strategy, foodCount). Hilfsfunktionen für Spawn in bounds.
- `CanvasRenderer`: DPI-aware sizing, clear color, optional grid/axis toggle.
- `Sprites`: Farben/Shapes per Strategie, Food-Style, Debug (vision radius toggle).

### Phase 2 – Bewegung
- MovementSystem: wander (glatter; optional Perlin), seek(target), flee, arrive, clamp acceleration, friction/damping, boundary handling (wrap vs bounce konfigurierbar).
- Agent-Physik: energy drain per Bewegung, maxSpeed/maxForce per traits.

### Phase 3 – Strategien & Interaktion
- `IStrategy` + konkrete Strategien; Strategy-Farben in `Sprites`.
- `InteractionSystem`: 
  - Agent-Food: konsumieren -> Energie + remove food.
  - Agent-Agent: Distanzcheck via SpatialGrid; decisions `FIGHT|SHARE|FLEE|IGNORE`; Payoff-Matrix konfigurierbar; Knockback/Energieverlust; Memory-Update für TitForTat.
  - Kollision Radius + cooldowns.

### Phase 4 – Evolution & Lebenszyklus
- Energie-Ökonomie: Basiskosten pro Tick, Bewegungskosten, Kampfkosten.
- Tod: `isDead` + Entfernung aus Listen.
- Reproduktion: Schwellenwert -> Child spawn nearby; Traits + Strategy Vererbung mit Mutation-Chance; Reproduction-Cooldown; Populations-Limits.
- FoodSystem: Respawn-Rate, Max-Food, zufällige Positionen; optionale Hotspots.

### Phase 5 – UI & Charts
- Controls: Start/Stop/Reset, Step, Speed (timeScale), Slider (Pop pro Strategie, Food rate, Vision, Mutation, Max Agents), Presets Dropdown (z.B. Hawk/Dove 50/50, Hawk Invasion, TitForTat Minority, Scarcity, Abundance).
- Stats: Live-Counter (agents per strategy, food, avg energy, births/deaths), FPS display.
- Chart.js: Line/Stacked Area über Zeit; Sampling (z.B. jede 0.5–1s) um Performance zu halten.

### Phase 6 – Performance & Polish
- SpatialGrid: Zellenbreite ~ visionRadius; integriert in Movement/Interaction queries; O(n) Nähechecks.
- Pooling (optional) für Food/Agents; throttle UI events; avoid allocations in hot loops.
- Visual polish: hit flash, trail optional, toggles.

### Phase 7 – Qualität & Release
- Tests: Unit (Vector2, strategies), Integration (Interaction/Evolution), Snapshot für presets, E2E smoke (UI loads, chart renders).
- CI: Workflow für lint/test/build vor Deploy; Deploy job nutzt `npm ci && npm run build` (bereits vorhanden, ggf. ergänzen).
- README: Setup, Run, Build, Deploy, Presets-Erklärung, Controls.

## Technische Checkliste (konkret)
- [ ] Tooling installieren (ESLint/Prettier/Vitest/Playwright optional) + npm scripts.
- [ ] `globalConfig` entkoppeln von `window` und zentralisieren (World/Renderer liefert Maße).
- [ ] `presets.ts` anlegen (Populationsmix, Food/Migration/Muation-Raten).
- [ ] `SpatialGrid` + EventBus implementieren.
- [ ] Agent erweitern: traits (speed, vision, aggression), memory, reproductionCooldown, age.
- [ ] Movement erweitern (seek/flee/arrive) + Energieverbrauch.
- [ ] InteractionSystem + Payoff-Matrix + cooldowns.
- [ ] EvolutionSystem + FoodSystem (respawn) + removal von toten Entities.
- [ ] UI/Controls + StatsChart + HUD anbinden (Events).
- [ ] Rendering verbessern (DPI, sprites, optional vision debug).
- [ ] Tests + CI-Job ergänzen.

## Setup/Kommandos
- Lokale Installation: `npm install`
- Dev-Server: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- (nach Tooling) Lint: `npm run lint`, Tests: `npm run test`

## Offene Annahmen
- Boundaries: Wrap vs Bounce? (derzeit Bounce). 
- Zielgeräte: Desktop primär, Mobile optional? 
- Deterministischer Seed/Replays gewünscht? 
- Max-Agenten/Food Obergrenze?
