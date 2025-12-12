import './style.css';
import { GameLoop } from './core/GameLoop';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { World } from './core/World';
import { PRESETS } from './config/presets';
import { Controls } from './ui/Controls';
import { StatsDisplay } from './ui/StatsDisplay';
import { StatsChart } from './ui/StatsChart';
import { AgentInspector } from './ui/AgentInspector';
import { AnalysisDisplay } from './ui/AnalysisDisplay';
import { rng, setSeed, getSeed } from './utils/RNG';
import { Onboarding } from './ui/Onboarding';
import { Hints } from './ui/Hints';
import { GestureController } from './ui/GestureController';
import { VoiceController } from './ui/VoiceController';
import type { WorldStats } from './core/World';

type Mood = 'default' | 'peace' | 'conflict' | 'cooperative';
let lastMood: Mood = 'default';
const CLEAR_COLORS: Record<Mood, string> = {
  default: '#0a0a0f',
  peace: '#050c16',
  conflict: '#0d060c',
  cooperative: '#05110a',
};

const determineMood = (stats: WorldStats): Mood => {
  const total = Math.max(1, stats.totalAgents);
  const aggressiveRatio = stats.strategyCounts.Aggressive / total;
  const cooperativeRatio =
    (stats.strategyCounts.Cooperative + stats.strategyCounts.TitForTat) / total;
  const foodPerAgent = stats.totalFood / total;
  const energy = stats.averageEnergy;

  if (aggressiveRatio > 0.45 && energy < 110) return 'conflict';
  if (cooperativeRatio > 0.5 && energy > 60) return 'cooperative';
  if (foodPerAgent > 1.2 && aggressiveRatio < 0.35) return 'peace';
  return 'default';
};

const applyMoodTheme = (mood: Mood) => {
  if (mood === lastMood) return;
  lastMood = mood;

  if (mood === 'default') {
    delete document.documentElement.dataset.theme;
    return;
  }

  document.documentElement.dataset.theme = mood;
};

// Initialize renderer (this sets world dimensions)
const renderer = new CanvasRenderer('sim-canvas');

// Create world with balanced preset
const world = new World({
  agentCount: PRESETS.Balanced.agentCount,
  foodCount: PRESETS.Balanced.foodCount,
  strategyRatios: PRESETS.Balanced.strategyRatios,
});

// Initialize UI components
const statsChart = new StatsChart(world);
const controls = new Controls(world, statsChart);
const statsDisplay = new StatsDisplay(world);
const agentInspector = new AgentInspector(world);
const analysisDisplay = new AnalysisDisplay(world);
const onboarding = new Onboarding(controls);
const hints = new Hints();
void new GestureController(world, controls);
const voice = new VoiceController(world, controls);

const update = (delta: number) => {
  world.update(delta);
};

const render = () => {
  const stats = world.getStats();
  const mood = determineMood(stats);
  applyMoodTheme(mood);
  world.render(renderer, CLEAR_COLORS[mood]);
  hints.update(stats);
  statsDisplay.update();
  statsChart.update();
  agentInspector.update();
  analysisDisplay.update();
};

const gameLoop = new GameLoop(update, render);
gameLoop.start();
onboarding.start();

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'v') {
    voice.toggle();
  }
  if (e.key.toLowerCase() === 'g') {
    document.dispatchEvent(new CustomEvent('onboarding:start'));
  }
});

// Expose for debugging
(window as any).world = world;
(window as any).presets = PRESETS;
(window as any).controls = controls;
(window as any).chart = statsChart;
(window as any).rng = rng;
(window as any).setSeed = setSeed;
(window as any).getSeed = getSeed;

// Log startup
console.log('%c🧬 BiesSimulation v1.0', 'color: #e94560; font-size: 16px; font-weight: bold;');
console.log('Initial stats:', world.getStats());
console.log('Debug: window.world, window.presets, window.controls, window.chart, window.setSeed(seed)');
