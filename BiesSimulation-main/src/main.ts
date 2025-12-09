import './style.css';
import { GameLoop } from './core/GameLoop';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { World } from './core/World';

const renderer = new CanvasRenderer('sim-canvas');
const world = new World();

const update = (delta: number) => {
  world.update(delta);
};

const render = () => {
  world.render(renderer);
};

const gameLoop = new GameLoop(update, render);
gameLoop.start();
