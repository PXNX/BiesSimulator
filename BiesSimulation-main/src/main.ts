import './style.css';
import { GameLoop } from './core/GameLoop';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { World } from './core/World';
import { PRESETS } from './config/presets';
import { Controls } from './ui/Controls';
import { StatsDisplay } from './ui/StatsDisplay';
import { StatsChart } from './ui/StatsChart';

// Initialize renderer (this sets world dimensions)
const renderer = new CanvasRenderer('sim-canvas');

// Create world with balanced preset
const world = new World({
  agentCount: PRESETS.Balanced.agentCount,
  foodCount: PRESETS.Balanced.foodCount,
  strategyRatios: PRESETS.Balanced.strategyRatios,
});

// Initialize UI components
const controls = new Controls(world);
const statsDisplay = new StatsDisplay(world);
const statsChart = new StatsChart(world);

const update = (delta: number) => {
  world.update(delta);
};

const render = () => {
  world.render(renderer);
  statsDisplay.update();
  statsChart.update();
};

const gameLoop = new GameLoop(update, render);
gameLoop.start();

// Expose for debugging
(window as any).world = world;
(window as any).presets = PRESETS;
(window as any).controls = controls;
(window as any).chart = statsChart;

// Log startup
console.log('%c🧬 BiesSimulation v1.0', 'color: #e94560; font-size: 16px; font-weight: bold;');
console.log('Initial stats:', world.getStats());
console.log('Debug: window.world, window.presets, window.controls, window.chart');
