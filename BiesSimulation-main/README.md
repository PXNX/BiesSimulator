# BiesSimulation

Browserbasierte 2D‑Simulation spieltheoretischer Agenten (Hawk/Dove/Tit‑for‑Tat usw.) auf Canvas, inkl. Live‑Statistiken, Presets und einfacher Evolution.

## Features
- Canvas‑Rendering mit DPI‑Awareness.
- Agenten mit Traits (Speed, Vision, Aggression, Stamina) und Energiesystem.
- Strategien: `Aggressive`, `Passive`, `Cooperative`, `TitForTat`, `Random`.
- Interaktionen Agent‑Agent (Payoff‑Matrix, Knockback, Cooldowns, Memory).
- Interaktionen Agent‑Food (Konsum + Respawn).
- Evolution (Tod, Reproduktion, Mutation, Pop‑Caps).
- UI‑Panel für Start/Pause/Step/Reset, Speed, Presets, Ratios, Food‑Rate, Max‑Agents, Mutation.
- Live‑Stats + Population‑Chart.

## Quickstart
Voraussetzung: Node.js 20+ und npm. In diesem Repo kann `setup_env.bat` im Projekt‑Root genutzt werden, falls Node lokal über einen eigenen Pfad bereitgestellt wird.

```bash
# im Ordner BiesSimulator/BiesSimulation-main
npm install
npm run dev
```

Danach öffnet Vite i.d.R. `http://localhost:5173`.

## Controls (UI)
- **Start/Pause/Step/Reset**: Simulation steuern.
- **Speed**: Zeit‑Multiplikator.
- **Preset**: Vordefinierte Szenarien.
- **Strategy Ratios**: Prozentuale Startverteilung der Strategien.
- **Parameters**:
  - Food Rate (Respawn pro Sekunde)
  - Max Agents (Populations‑Cap)
  - Mutation (Trait‑Mutation pro Geburt)
- **Debug**: Grid / Vision‑Radius.

## Presets
Beispiele:
- **Hawk vs Dove (50/50)**: Klassische Hawk/Dove‑Gegenüberstellung.
- **Hawk Invasion**: Kleine aggressive Invasion in passive Population.
- **Scarcity / Abundance**: Ressourcenknappheit vs. Überfluss.
- **Chaos**: Sehr aggressive Welt.

## Scripts
```bash
npm run dev       # Dev‑Server
npm run build     # Prod‑Build in dist/
npm run preview   # Preview des Builds
npm run lint      # ESLint
npm run format    # Prettier
npm run test      # Vitest (CI/one-shot)
npm run test:watch# Vitest Watch-Modus
npm run coverage  # Coverage‑Report (./coverage)
npm run check     # lint + test + build
```

## Deployment (GitHub Pages)
Workflow: `.github/workflows/deploy.yml`
- Läuft auf `main` push.
- Führt `npm ci` und `npm run check` aus.
- Deployt `dist/` via Pages‑Artifacts.
- `vite.config.ts` nutzt `base: './'` für Projekt‑Subpaths.

## Projektstruktur (Kurz)
`src/config` – globale Config + Presets  
`src/core` – GameLoop, World, SpatialGrid  
`src/models` – Vector2, Entity, Agent, Food, Traits  
`src/strategies` – Strategie‑Interfaces + Implementierungen  
`src/systems` – Movement, Interaction, Evolution, Food  
`src/renderer` – CanvasRenderer, Sprites, Effects  
`src/ui` – Controls, StatsDisplay, StatsChart  

## Nächste Schritte
Siehe `Plan.md` für offene Tasks.
