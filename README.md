# BiesSimulation

Browserbasierte 2D‑Simulation spieltheoretischer Agenten (Hawk/Dove/Tit‑for‑Tat usw.) auf Canvas, inkl. Live‑Statistiken, Presets und einfacher Evolution.

## 🎯 Projektübersicht

BiesSimulation ist eine interaktive Simulation, die das Verhalten von Agenten mit verschiedenen spieltheoretischen Strategien in einer dynamischen Umgebung untersucht. Die Simulation zeigt, wie sich verschiedene Strategien (Aggressiv, Passiv, Kooperativ, Tit-for-Tat, Zufällig) in Bezug auf Überleben, Ressourcenmanagement und Interaktion verhalten.

### Kernfunktionen

- **Canvas‑Rendering mit DPI‑Awareness** - Scharfe Darstellung auf allen Displays
- **Agenten mit Traits** - Jeder Agent hat individuelle Eigenschaften (Geschwindigkeit, Sichtweite, Aggression, Ausdauer) und ein Energiesystem
- **Fünf Strategien** - `Aggressive`, `Passive`, `Cooperative`, `TitForTat`, `Random`
- **Interaktionssysteme** - Agent‑Agent (Payoff‑Matrix, Knockback, Cooldowns, Memory) und Agent‑Food (Konsum + Respawn)
- **Evolutionssystem** - Tod, Reproduktion, Mutation, Populationsgrenzen
- **Umfangreiche UI** - Steuerung, Live‑Statistiken, Populations‑Chart, Analyse-Heatmap
- **Deterministische Simulation** - Seed‑basierte Reproduzierbarkeit
- **Laufzeit‑Konfiguration** - Anpassbare Spielregeln (Fight Cost, Food Value, Payoff‑Matrix)
- **Agent Inspector** - Detaillierte Ansicht einzelner Agenten mit Memory-Log
- **Visuelle Effekte** - Partikel, Trails, Glow-Effekte für Interaktionen
- **Theming-System** - Dynamische Farbthemen basierend auf Simulationzustand

## 🚀 Schnellstart

### Voraussetzungen

- Node.js 20+ und npm
- Moderner Webbrowser mit Canvas-Unterstützung

### Installation

```bash
# Klonen des Repositories
git clone <repository-url>
cd BiesSimulator/BiesSimulation-main

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Nach dem Start öffnet Vite i.d.R. `http://localhost:5173`.

### Alternative mit setup_env.bat

Falls Node lokal über einen eigenen Pfad bereitgestellt wird, kann `setup_env.bat` im Projekt‑Root genutzt werden.

## 🎮 Steuerung & UI

### Simulation-Steuerung

- **Start/Pause/Step/Reset**: Simulation steuern
- **Speed**: Zeit‑Multiplikator (0.1x - 3.0x)
- **Preset**: Vordefinierte Szenarien laden
- **Seed**: Seed anzeigen/setzen für reproduzierbare Läufe

### Strategie-Verhältnisse

Prozentuale Startverteilung der fünf Strategien über Slider einstellbar:
- **Aggressive** (Rot) - Greift immer an, hoher Energieverbrauch
- **Passive** (Blau) - Weicht Konflikten aus, niedriger Energieverbrauch
- **Cooperative** (Grün) - Teilt Ressourcen, mittlerer Energieverbrauch
- **TitForTat** (Gold) - Reziproke Strategie, erinnert sich an Begegnungen
- **Random** (Lila) - Zufälliges Verhalten

### Parameter

- **Food Rate** - Nahrungs-Respawn pro Sekunde
- **Max Agents** - Populations-Obergrenze
- **Mutation** - Trait-Mutationswahrscheinlichkeit bei Geburt
- **Vision** - Sichtweite der Agenten
- **Food Value** - Energiegewinn pro Nahrungseinheit
- **Boundaries** - Verhalten an Weltgrenzen (Bounce/Wrap)

### Spielregeln

Anpassbare Payoff-Matrix und Kosten:
- **Fight Cost** - Energiekosten für Kämpfe
- **Food Value** - Energiegewinn aus Nahrung
- **Payoff Matrix** - Energiegewinne/verluste für verschiedene Strategie-Kombinationen

### Debug-Optionen

- **Show Grid** - Raster anzeigen
- **Show Vision** - Sichtweiten der Agenten visualisieren
- **Show Axis** - Zentralachsen einblenden
- **Show Trails** - Bewegungspfade anzeigen
- **Show Effects** - Visuelle Effekte für Interaktionen

## 🎭 Presets

Vordefinierte Szenarien zur Untersuchung verschiedener Dynamiken:

| Preset | Beschreibung | Strategieverteilung |
|--------|-------------|-------------------|
| **Balanced Mix** | Alle Strategien gleich verteilt | 20% each |
| **Hawk vs Dove (50/50)** | Klassische Hawk/Dove‑Gegenüberstellung | 50% Aggressive, 50% Passive |
| **Hawk Invasion** | Kleine aggressive Invasion in passive Population | 10% Aggressive, 90% Passive |
| **TitForTat Minority** | Kann TitForTat-Strategie überleben? | 40% Aggressive, 40% Passive, 20% TitForTat |
| **Scarcity** | Begrenzte Ressourcen erzwingen Wettbewerb | 30% Aggressive, 30% Passive, 20% Cooperative, 20% TitForTat |
| **Abundance** | Überfluss an Ressourcen fördert Kooperation | 20% Aggressive, 20% Passive, 30% Cooperative, 20% TitForTat, 10% Random |
| **Cooperative World** | Meist kooperative und TitForTat Strategien | 10% Aggressive, 10% Passive, 40% Cooperative, 40% TitForTat |
| **Chaos** | Hochaggressive Umgebung | 60% Aggressive, 10% andere Strategien |

## 📊 Analyse-Tools

### Live-Statistiken

- **Agentenanzahl** - Gesamtzahl lebender Agenten
- **Nahrungsverfügbarkeit** - Aktuelle Nahrungsmenge
- **Durchschnittsenergie** - Mittlere Energie aller Agenten
- **Geburten/Todesfälle** - Kumulative Statistiken
- **Strategie-Verteilung** - Anzahl pro Strategie

### Populations-Chart

Dynamisches Liniendiagramm mit Chart.js:
- Zeitlicher Verlauf der Populationsentwicklung
- Farbige Darstellung nach Strategien
- Gestapelte Ansicht für Gesamtpopulation
- Interaktive Tooltips mit Werten

### Strategy-vs-Strategy Heatmap

Analyse der Interaktionsergebnisse:
- Grün: Positive Bilanz (mehr Siege)
- Rot: Negative Bilanz (mehr Niederlagen)
- Detaillierte Tooltips mit Sieg/Niederlage/Unentschieden
- Hilft bei der Bewertung von Strategie-Effectivität

### Agent Inspector

Klick auf einen Agent für detaillierte Informationen:
- **ID** - Eindeutige Identifikation
- **Energie** - Aktueller Energiestatus
- **Alter** - Lebensdauer in Sekunden
- **Traits** - Individuelle Eigenschaften
- **Recent Encounters** - Letzte 5 Begegnungen mit anderen Agenten

## 🧬 Agenten-Verhalten

### Traits

Jeder Agent hat vier grundlegende Eigenschaften:
- **Speed** (0.5-1.5) - Bewegungsgeschwindigkeit
- **Vision** (0.5-2.0) - Sichtweite
- **Aggression** (0-1) - Neigung zu Kämpfen
- **Stamina** (0.5-1.5) - Energieeffizienz

### Strategien im Detail

#### Aggressive (Hawk)
- Immer kämpfen, nie teilen oder fliehen
- Hohe Energiekosten, aber hohe Gewinne bei Erfolg
- Spikes-förmige visuelle Darstellung

#### Passive (Dove)
- Immer ausweichen oder teilen, nie kämpfen
- Niedrige Energiekosten, aber auch niedrige Gewinne
- Weiche, tropfenförmige Darstellung

#### Cooperative
- Immer teilen, nie kämpfen oder fliehen
- Mittlere Energiekosten, stabile Gewinne
- Blüten/Herz-förmige Darstellung

#### TitForTat
- Reziprokes Verhalten - erinnert sich an letzte Begegnung
- Startet kooperativ, spiegelt gegnerisches Verhalten
- Kristall/Diamant-förmige Darstellung

#### Random
- Zufällige Auswahl zwischen allen Aktionen
- Unvorhersehbares Verhalten
- Amöben-förmige, unregelmäßige Darstellung

### Energie-System

- **Startenergie**: 100 Einheiten
- **Maximalenergie**: 200 Einheiten
- **Bewungskosten**: Abhängig von Geschwindigkeit und Ausdauer
- **Basisverbrauch**: Konstante Kosten pro Zeiteinheit
- **Altersfaktor**: Steigender Energieverbrauch mit dem Alter

## 🔄 Evolutionssystem

### Reproduktion

- **Energieschwelle**: 120 Einheiten für Reproduktion
- **Kosten**: 50 Einheiten Energie
- **Abklingzeit**: 5 Sekunden zwischen Reproduktionen
- **Populationsgrenze**: Maximale Anzahl von Agenten

### Mutation

- **Trait-Mutation**: 10% Chance bei Geburt
- **Mutationsstärke**: 15% Abweichung von Eltern-Traits
- **Strategie-Mutation**: 5% Chance für Strategiewechsel
- **Kind-Energie**: 40% der Reproduktionskosten

### Tod

- **Energiemangel**: Bei Erreichen von 0 Energie
- **Altersschwäche**: Nach 180 Sekunden Lebenszeit
- **Minimale Population**: Automatische Erzeugung bei Unterschreiten von 5 Agenten

## 🎨 Visuelle Gestaltung

### Farbpalette

- **Aggressive**: Neon-Rot (#ff2244)
- **Passive**: Neon-Blau (#4488ff)
- **Cooperative**: Neon-Grün (#00ff88)
- **TitForTat**: Gold (#ffcc00)
- **Random**: Neon-Lila (#cc44ff)

### Visuelle Effekte

- **Glow-Effekte**: Strategie-spezifische Leuchthöfe
- **Interaktions-Partikel**: Für Kämpfe, Teilen, Konsumieren
- **Geburts-/Todesanimationen**: Visuelle Markierung wichtiger Ereignisse
- **Energie-Bögen**: Anzeige des Energiestatus um jeden Agenten
- **Bewegungs-Trails**: Optional sichtbare Pfade

### Dynamisches Theming

Die Simulation passt das Farbschema basierend auf dem Weltzustand an:
- **Peace**: Überwiegend passive Agenten, hohe Nahrungsverfügbarkeit
- **Conflict**: Hoher Aggressionsanteil, niedrige Energie
- **Cooperative**: Dominanz kooperativer Strategien, hohe Energie
- **Default**: Ausgewogene Mischung

## 🔧 Technische Details

### Architektur

- **TypeScript** für typsichere Entwicklung
- **Vite** als Build-Tool und Entwicklungsserver
- **Canvas 2D** für performantes Rendering
- **Chart.js** für Datenvisualisierung
- **Modulares System** mit klaren Trennungen:
  - `src/core` - Spiellogik, World, GameLoop
  - `src/models` - Datenmodelle (Agent, Food, Traits)
  - `src/strategies` - Strategie-Implementierungen
  - `src/systems` - Interaktions- und Evolutionssysteme
  - `src/renderer` - Visuelle Darstellung
  - `src/ui` - Benutzeroberfläche
  - `src/config` - Konfiguration und Presets

### Performance-Optimierungen

- **Spatial Grid** für effiziente Kollisionserkennung
- **Object Pooling** zur Reduzierung von GC-Druck
- **DPI-Aware Rendering** für scharfe Darstellung
- **Throttled Updates** für Statistiken und UI
- **Deterministische Ticks** für reproduzierbare Simulationen

### Skripte

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

## 🚀 Deployment

### GitHub Pages

Der Workflow `.github/workflows/deploy.yml` automatisiert das Deployment:
- Läuft auf `main` push
- Führt `npm ci` und `npm run check` aus
- Deployt `dist/` via Pages‑Artifacts
- `vite.config.ts` nutzt `base: './'` für Projekt‑Subpaths

## 🔮 Zukünftige Entwicklungen

Gemäß `Plan.md` sind folgende Erweiterungen geplant:

### UI/UX Verbesserungen
- Docking-Layout mit Tabs statt langem Control-Panel
- Progressive Disclosure für Anfänger
- Hotkeys und Gestensteuerung
- Voice Control für Simulation

### Visuelle Aufwertungen
- Verbesserte Agenten-Designs mit klarer Zustandsanzeige
- Erweiterte Partikelsysteme
- Hintergrundlayer mit Atmosphäre
- Qualitätstufen für Performance-Optimierung

### Erweiterte Analyse
- Replay/Timeline-Funktionalität
- Detailliertere Statistiken
- Szenario-Karten mit Zielen
- Guided Tours für neue Benutzer

## 🤝 Mitwirken

1. Fork des Projekts
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Zum Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request eröffnen

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz - siehe `LICENSE` Datei für Details.

## 🙏 Danksagungen

- Chart.js für die Datenvisualisierung
- Vite für das moderne Build-System
- TypeScript für die typsichere Entwicklung
- Der Spieltheorie-Community für die theoretischen Grundlagen

---

**BiesSimulation** - Erkunde die Evolution von Strategien in einer dynamischen Welt!