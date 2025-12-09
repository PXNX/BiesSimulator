import './style.css';
import { GameLoop } from './core/GameLoop';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { World } from './core/World';
import { PRESETS } from './config/presets';

// Initialize renderer (this sets world dimensions)
const renderer = new CanvasRenderer('sim-canvas');

// Create world with balanced preset
const world = new World({
  agentCount: PRESETS.Balanced.agentCount,
  foodCount: PRESETS.Balanced.foodCount,
  strategyRatios: PRESETS.Balanced.strategyRatios,
});

const update = (delta: number) => {
  world.update(delta);
};

const render = () => {
  world.render(renderer);
};

const gameLoop = new GameLoop(update, render);
gameLoop.start();

// Expose world for debugging in console
(window as any).world = world;
(window as any).presets = PRESETS;

// Log initial stats
console.log('BiesSimulation started!');
console.log('Initial stats:', world.getStats());
console.log('Use window.world and window.presets for debugging');
