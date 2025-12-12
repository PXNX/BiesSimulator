/**
 * OPTIMIZED Main Entry Point - High Performance Mode
 * Use this instead of main.ts for better performance
 */

import './style.css';
import { GameLoop } from './core/GameLoop';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { FastRenderer } from './renderer/FastRenderer';
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
import { CONFIG } from './config/globalConfig';
import { performanceChecker } from './utils/PerformanceChecker';

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

// Performance monitoring
let frameCount = 0;
let lastFPSUpdate = performance.now();
let currentFPS = 60;

// Initialize renderer
const renderer = new CanvasRenderer('sim-canvas');
const fastRenderer = new FastRenderer(renderer.getContext());

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

// Rendering optimizations
let renderCounter = 0;
const UI_UPDATE_INTERVAL = 3; // Update UI every 3 frames (reduces overhead)
const MOOD_CHECK_INTERVAL = 30; // Check mood every 30 frames

const update = (delta: number) => {
    world.update(delta);
};

const render = () => {
    renderCounter++;

    // Record frame for performance tracking
    performanceChecker.recordFrame();

    // Update FPS counter
    frameCount++;
    const now = performance.now();
    if (now - lastFPSUpdate >= 1000) {
        currentFPS = frameCount;
        frameCount = 0;
        lastFPSUpdate = now;

        // Update performance display
        const fpsElement = document.getElementById('fps-counter');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${currentFPS}`;
        }
    }

    // Check mood less frequently
    if (renderCounter % MOOD_CHECK_INTERVAL === 0) {
        const stats = world.getStats();
        const mood = determineMood(stats);
        applyMoodTheme(mood);
    }

    // Clear canvas
    const mood = lastMood;
    renderer.clear(CLEAR_COLORS[mood]);

    // Use fast rendering path
    const ctx = renderer.getContext();

    // Update quality based on FPS
    if (currentFPS < 40) {
        fastRenderer.setQualityLevel(0.6);
        (CONFIG as any).SHOW_TRAILS = false;
        (CONFIG as any).SHOW_HIT_EFFECTS = false;
    } else if (currentFPS < 50) {
        fastRenderer.setQualityLevel(0.8);
        (CONFIG as any).SHOW_HIT_EFFECTS = true;
    } else {
        fastRenderer.setQualityLevel(1.0);
    }

    // Draw food efficiently
    fastRenderer.drawFoodBatch(world.food);

    // Draw agents efficiently
    fastRenderer.drawAgentsBatch(world.agents);

    // Highlight selected agent
    const selected = world.getSelectedAgent();
    if (selected) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(selected.position.x, selected.position.y, CONFIG.AGENT_SIZE + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Update UI less frequently
    if (renderCounter % UI_UPDATE_INTERVAL === 0) {
        hints.update(world.getStats());
        statsDisplay.update();
        statsChart.update();
        agentInspector.update();
        analysisDisplay.update();
    }
};

// Create game loop with adaptive quality
const gameLoop = new GameLoop(update, render);
gameLoop.setAdaptiveQuality(true);
gameLoop.start();
onboarding.start();

// Add FPS counter to UI
const createFPSCounter = () => {
    const fpsCounter = document.createElement('div');
    fpsCounter.id = 'fps-counter';
    fpsCounter.style.position = 'fixed';
    fpsCounter.style.top = '10px';
    fpsCounter.style.right = '10px';
    fpsCounter.style.color = '#fff';
    fpsCounter.style.fontFamily = 'monospace';
    fpsCounter.style.fontSize = '14px';
    fpsCounter.style.backgroundColor = 'rgba(0,0,0,0.7)';
    fpsCounter.style.padding = '5px 10px';
    fpsCounter.style.borderRadius = '4px';
    fpsCounter.style.zIndex = '10000';
    fpsCounter.textContent = 'FPS: --';
    document.body.appendChild(fpsCounter);
};

createFPSCounter();

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'v') {
        voice.toggle();
    }
    if (e.key.toLowerCase() === 'g') {
        document.dispatchEvent(new CustomEvent('onboarding:start'));
    }
    // Toggle performance mode with 'P' key
    if (e.key.toLowerCase() === 'p') {
        (CONFIG as any).SHOW_TRAILS = !CONFIG.SHOW_TRAILS;
        (CONFIG as any).SHOW_HIT_EFFECTS = !CONFIG.SHOW_HIT_EFFECTS;
        console.log('Performance mode:', CONFIG.SHOW_TRAILS ? 'High Quality' : 'High Performance');
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
(window as any).gameLoop = gameLoop;
(window as any).fastRenderer = fastRenderer;
(window as any).performanceChecker = performanceChecker;

// Log startup
console.log('%c🚀 BiesSimulation v1.0 - OPTIMIZED', 'color: #00ff88; font-size: 16px; font-weight: bold;');
console.log('Performance Mode: ENABLED');
console.log('Press P to toggle visual effects');
console.log('Initial stats:', world.getStats());
console.log('Debug: window.world, window.gameLoop, window.fastRenderer');
console.log('\n💡 Performance Tools:');
console.log('  • performanceChecker.getReport(world.agents.length) - Get performance report');
console.log('  • performanceChecker.printSystemInfo() - View system info');
console.log('  • performanceChecker.runBenchmark((n) => world.reset({ agentCount: n })) - Run benchmark');

// Show initial performance report after 3 seconds
setTimeout(() => {
    const report = performanceChecker.getReport(world.agents.length);
    performanceChecker.printReport(report);
}, 3000);
