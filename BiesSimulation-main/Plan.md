# BiesSimulation - UI/Look & Feel Umbauplan (radikal, aber im aktuellen Stand umsetzbar)

Dieses Dokument ist ein **fokussierter Plan für einen UI-Umbau** inkl. **Kreaturen (Agenten), Effekten und Hintergrund**.  
Ziel: Die Simulation fühlt sich wie ein "Labor-Tool" an, während Canvas/FX den "Wow-Faktor" liefern - ohne den Tech-Stack zu sprengen.

## Kurzes Fazit zum bisherigen Plan
Der alte Text hatte viele gute Ideen, war aber für den aktuellen Stack **zu breit** (WebGL/Three.js, ML/Voice, Kollaboration etc.).  
Hier ist die "MiniMax"-Version: **maximale Wirkung** mit **minimalem Risiko/Scope**.

---

# 0) Ausgangslage (Ist-Stand, konkret)
- Stack: Vite + TypeScript, Vanilla DOM, Canvas 2D, Chart.js.
- UI/DOM: `BiesSimulator/BiesSimulation-main/index.html`
- UI/Style: `BiesSimulator/BiesSimulation-main/src/style.css`
- UI/Logik:
  - `BiesSimulator/BiesSimulation-main/src/ui/Controls.ts` (alles in einem langen Panel)
  - `BiesSimulator/BiesSimulation-main/src/ui/StatsDisplay.ts` (Zahlen + FPS)
  - `BiesSimulator/BiesSimulation-main/src/ui/StatsChart.ts` (Population Chart.js)
  - `BiesSimulator/BiesSimulation-main/src/ui/AnalysisDisplay.ts` (Heatmap)
  - `BiesSimulator/BiesSimulation-main/src/ui/AgentInspector.ts` (Click-Inspector)
- Render/Art:
  - `BiesSimulator/BiesSimulation-main/src/renderer/Sprites.ts` (organische Agenten + Glow)
  - `BiesSimulator/BiesSimulation-main/src/renderer/Effects.ts` (Hit/Consume/Birth/Death + Trails)
  - `BiesSimulator/BiesSimulation-main/src/renderer/CanvasRenderer.ts` (Clear + Grid/Achsen)

**Hauptproblem UX:** Zu viele Einstellungen "auf einmal" -> hohe Einstiegshürde, viel Scroll, wenig "Guidance".

---

# 1) Zielbild (Design Vision)
**Ecosystem-Dashboard:**  
Canvas ist Bühne (ruhig, atmosphärisch), UI ist Labor-HUD (klar, modular), Agenten/FX erklären Verhalten visuell.

## Leitprinzipien
- **Progressive Disclosure:** Anfänger: Preset/Start/Speed. Fortgeschrittene: Rules/Payoff/Debug.
- **2-Klick-Regel:** "Was passiert?" (Stats/Trends) und "Warum?" (Inspector/Analysis) immer schnell erreichbar.
- **Ein Farbsystem:** Strategie-Farben identisch in UI + Sprites + Chart.
- **Performance-Budget:** "FX/Background" sind Quality-Stufen, kein Default-Overkill.

## Umsetzungsstand (Kap. 1 & 2)
- Dynamic Color System (Mood Themes peace/conflict/cooperative + Canvas-Farbe) aktiv.
- Advanced Typography & Micro-Motion: Space Grotesk + Parallax/Layered Background + Hover/Focus-Motion.
- Progressive Disclosure: Expert Mode Toggle (advanced groups hidden by default), Guide/Onboarding Overlay.
- Guided Workflows: Onboarding Steps (Presets, Start/Pause, Expert Mode Hinweis).
- Contextual Help: Hint-Bar mit heuristischen Tipps (Aggro/Koop/Energie/Food).
- Simplified Control Interfaces: Gesten (Double-Tap Pause, Pinch-Speed), Voice Commands (start/pause/reset/faster/slower, Preset Keywords).

---

# 2) UI Umbau (Layout + Information Architecture)

## 2.1 Neues Layout: Docking + Tabs statt ein langes "Controls"-Panel
Aktuell: Links "Controls" (sehr lang), rechts "Stats" (Zahlen + Chart + Heatmap).  
Vorschlag: In 2 Docks aufteilen und Inhalte in Tabs/Accordion strukturieren.

**Wireframe (grob):**
```
┌────────────────────────── Top Bar ──────────────────────────┐
│ Start/Pause/Step/Reset | Speed | Preset | Seed | Focus | ?  │
└──────────────────────────────────────────────────────────────┘
┌──── Left Dock (Setup) ────┐                    ┌─ Right Dock ┐
│ Tabs/Accordion:           │      Canvas        │ Tabs:        │
│ - Presets                 │                    │ - Stats       │
│ - Population              │                    │ - Chart       │
│ - Parameters              │                    │ - Analysis    │
│ - Rules                   │                    │ - Inspector   │
│ - Config                  │                    └──────────────┘
│ - Debug                   │
└───────────────────────────┘
```

**Warum das "radikal" wirkt:** weniger UI-Chaos -> mehr Platz fürs Spielgefühl (Canvas), und trotzdem mehr Funktionen (weil besser sortiert).

## 2.2 Top Bar: "immer erreichbar" + weniger Fehlklicks
- Start/Pause/Step/Reset + Speed in eine **kleine, feste Top Bar**.
- Reset mit **Confirm** (z.B. 2-Step oder "Hold to reset"), weil Reset teuer ist.
- Preset + Seed "Quick Actions" (Copy/Randomize) direkt dort.

## 2.3 "Setup" als Accordion (Low risk)
Statt alles gleichzeitig sichtbar:
- **Presets** (kurz + Beschreibung)
- **Population** (Ratios) + "Normalize" Button + "Randomize" Button
- **Parameters** (Food Rate, Max Agents, Mutation, Vision, Boundary)
- **Rules** (Fight Cost, Food Value, Payoff-Matrix) - klar getrennt, weil "advanced"
- **Config** (Import/Export) - "danger zone"
- **Debug** (Grid/Vision/Axis/Trails/Effects) + optional "Quality"

## 2.4 "Insights" als Tabs (Right Dock)
- **Stats:** Zahlen + Mini-Sparklines (optional)
- **Chart:** Chart.js bleibt, aber bekommt bessere Legende/Tooltips
- **Analysis:** Heatmap bleibt, bekommt Erklärung + "Reset heatmap"
- **Inspector:** pinnbar (rechts) ODER Popover am Agent (wie jetzt)

## 2.5 Interaktion & Ergonomie (sehr viel Wirkung, wenig Aufwand)
- Hover-Tooltip auf Agent (Quick Peek): Strategy, Energy, Age, Traits (kurz).
- Hotkeys:
  - `Space` Start/Pause
  - `R` Reset (mit Confirm)
  - `F` Focus Mode (HUD minimieren)
  - `G` Grid, `V` Vision, `T` Trails
- Micro-Feedback: Kurzer Toast "Preset applied", "Config imported", "Seed copied".

---

# 3) Kreaturen/Agenten (mehr "Character" + Lesbarkeit)
`Sprites.ts` ist schon richtig gut (organische Shapes + Glow). Der nächste Level ist **State-Readability**:

## 3.1 Strategie-Silhouetten klarer machen
- Aggressive: "Spikes" + roter Hot-Core, bei Fight kurz "expand".
- Passive: runder/softer, leicht transparenter, ruhige Bewegung.
- Cooperative: leaf/heart-Vibe + grüner Halo, bei SHARE kurzer "Pulse".
- TitForTat: "Maske/Auge" Look; bei Retaliation kurzer gelber "blink".
- Random: kontrollierter "irregular jitter", damit er "wild" wirkt, aber nicht nervt.

## 3.2 Zustände sichtbar machen (ohne UI-Overlays)
- Energy: Aura-Intensität (Arc bleibt als präzise Anzeige, Aura ist "schnell lesbar").
- Age: Desaturation/"Staubigkeit" (alt = matter).
- Selected Agent: klarer Selection-Ring + kleiner Label-Tag (Agg/Pas/Coop/TfT/Rnd).
- Optional: "Intent-Hint" (sehr subtil): bei FLEE kurzer blauer "back-trail", bei FIGHT kurze rote "forward-flare".

## 3.3 "Social" Visuals (klein, aber erzählerisch)
- Wenn zwei Agenten interagieren: kurze Linie/Arc zwischen ihnen (FIGHT rot, SHARE grün, FLEE neutral).
- Bei TitForTat: Memory-Bezug sichtbar machen (z.B. kurzer "echo" wenn er "retaliates").

---

# 4) Effekte (FX) - sichtbar, erklärend, skalierbar
Aktuell: `EffectsSystem` hat Rings/Particles/Star/X + Trails. Das ist eine perfekte Basis.

## 4.1 Effekt-Katalog (konsequent pro Event)
- **Fight:** Shockwave + Sparks (2-6 Partikel), kurzer Screen-space "impact" (ohne Camera Shake).
- **Share:** "Link Pulse" (2 Halbkreise/Herz-Pulse) + 1-2 grüne Partikel.
- **Consume:** Partikel-Burst + kleiner "+Energy" Pop (optional, abschaltbar).
- **Birth:** "Bloom" (expanding petals) + kurzer Halo.
- **Death:** "Dissolve"/"Ash" (Partikel nach außen) statt nur X (X kann bleiben als Debug-Variante).

## 4.2 Trails (endlich "schön" und informativ)
- Trail-Farbe = Strategie-Farbe (nicht weiß).
- Trail-Breite/Alpha abhängig von Speed/Energy.
- Trail als "spline-ish" (simple smoothing) für weicheres Motion-Gefühl.

## 4.3 Quality Stufen (damit es immer 60 FPS bleibt)
- Low: keine Partikel, nur Rings
- Mid: wenige Partikel + Trails kurz
- High: volle Partikel + Background-Noise + nicer blending

---

# 5) Hintergrund (Atmosphäre + Informationslayer)
Aktuell: `CLEAR_COLOR` + optional Grid. Nächster Schritt: "Bühne" bauen, aber billig rendern.

## 5.1 3 Layer, performancefreundlich
1) **Static Backplate** (einmal auf Offscreen Canvas gerendert):  
   Gradient + Vignette + ganz leichtes Noise (fast unsichtbar, aber "edel").
2) **Biome/Hotspot Hints** (optional):  
   Wenn `FOOD_HOTSPOTS_ENABLED`: sehr subtile Ringe/Glow in Hotspot-Zonen.
3) **Overlay Modes** (toggle):
   - Density Heatmap (Agenten-Dichte)
   - Food Heatmap (Food-Dichte/Spawn-Bias)
   - Debug Grid (wie jetzt)

## 5.2 "Blueprint Mode" (Theme-Preset)
Ein Theme-Preset, das Canvas + UI wie "Labor-Blueprint" aussehen lässt (sehr cool für Demos/Präsentation).

---

# 6) Umsetzung (phasenweise, mit klaren Deliverables)
Die Reihenfolge ist so gewählt, dass ihr **früh** sichtbare Verbesserung bekommt.

## Phase A - UI Re-Layout (1-2 Sessions)
- [ ] `index.html` in Docks/TopBar umstrukturieren (ohne neue Dependencies)
- [ ] `Controls.ts`: Inhalte in Sections/Accordion/Tabs aufteilen
- [ ] Focus Mode + Hotkeys
- [ ] Reset-Confirm

**Definition of Done:** Kein Scroll-Monster mehr; Start/Preset/Speed in < 1 Sek erreichbar.

## Phase B - Style System + Konsistenz (1 Session)
- [ ] Strategy-Palette als Single-Source (UI + Sprites + Chart)
- [ ] Typo/Spacing Hierarchie (weniger "alles gleich laut")
- [ ] "Reduced Motion" (prefers-reduced-motion) respektieren
- [ ] Optional: "Classic Layout" Toggle (alte Panels) als Fallback

## Phase C - Agent Readability (1-2 Sessions)
- [ ] Selection-Ring + Strategy-Tag + Hover-Peek
- [ ] Energy-Aura + Age-Desaturation
- [ ] Intent-Hint (Fight/Share/Flee) minimal

## Phase D - FX Upgrade + Quality Stufen (1-3 Sessions)
- [ ] Fight/Share/Consume/Birth/Death konsistent machen
- [ ] Trails farbig + smoother
- [ ] Quality Toggle (Low/Mid/High) + FPS-based auto-downgrade optional
- [ ] Performance Guardrails: einfacher FPS/FrameTime Monitor + Auto-Downgrade Regeln

## Phase E - Hintergrundlayer (1 Session)
- [ ] Offscreen Backplate (Gradient+Vignette+Noise)
- [ ] Hotspot-Visualisierung (optional)
- [ ] Overlay Modes (Density/Food)

---

# 7) "Radikal, aber optional" (Nice-to-have Backlog)
Wenn nach dem Umbau noch Zeit/Mut da ist:
- Replay/Timeline: Simulation kurz buffern (z.B. 10-30s) und zurückspringen.
- Replay persistieren: IndexedDB Snapshot/History (optional) + Export/Import.
- Kamera Pan/Zoom (Viewport Transform) + Mini-Map.
- "Scenario Cards": Presets als Karten mit Ziel ("Kooperation stabilisieren", "Hawk Invasion überstehen").
- Guided Tour: 3-Step Onboarding (kein ML, nur UI-Hints).
- Heavy UI/Analysis Jobs in Web Worker (nur wenn messbar noetig).

---

# 8) Erfolgskriterien (damit ihr wisst, wann's "fertig" ist)
- UI wirkt "geordnet": Anfänger finden Start/Preset/Speed sofort.
- Agenten sind ohne Inspector "lesbar" (Strategy + Energy + Status).
- FX erklären Interaktionen, ohne zu blenden.
- Background macht Atmosphäre, ohne Aufmerksamkeit zu klauen.
- Performance: stabil (Ziel: ~60 FPS auf normalem Laptop, Quality "Mid").

## 8.1 Messbare Ziele (aus GLM_Plan, sehr nuetzlich fuer Abnahme)
- Time-to-first-action: < 3s bis Start/Pause sinnvoll bedienbar.
- Load time: < 2s (lokal/typischer Rechner).
- Interaction latency: < 100ms fuer UI Inputs (Sliders/Buttons).
- Memory: grob < 100MB bei typischem Run (ohne Replay-Persistenz).

## 8.2 Risiken + Absicherung (kurz)
- Performance Regression durch FX/Background -> Quality Stufen + Auto-Downgrade + Toggles.
- UI Umbau verwirrt "alte Nutzer" -> optionaler "Classic Layout" Toggle fuer Uebergang.
