/**
 * Stats Display - Live statistics and FPS counter
 */

import { World } from '../core/World';
import type { WorldStats } from '../core/World';

export class StatsDisplay {
    private world: World;
    private lastFrameTime: number = performance.now();
    private frameCount: number = 0;
    private fps: number = 60;
    private updateInterval: number = 100; // Update stats every 100ms
    private lastUpdate: number = 0;

    // DOM Elements
    private fpsDisplay: HTMLElement;
    private statAgents: HTMLElement;
    private statFood: HTMLElement;
    private statEnergy: HTMLElement;
    private statBirthDeaths: HTMLElement;
    private countElements: Map<string, HTMLElement> = new Map();

    constructor(world: World) {
        this.world = world;

        // Get elements
        this.fpsDisplay = document.getElementById('fps-display')!;
        this.statAgents = document.getElementById('stat-agents')!;
        this.statFood = document.getElementById('stat-food')!;
        this.statEnergy = document.getElementById('stat-energy')!;
        this.statBirthDeaths = document.getElementById('stat-birthdeaths')!;

        // Strategy count elements
        const strategies = ['aggressive', 'passive', 'cooperative', 'titfortat', 'random'];
        for (const s of strategies) {
            this.countElements.set(s, document.getElementById(`count-${s}`)!);
        }
    }

    /**
     * Update display (call every frame)
     */
    update(): void {
        // FPS calculation
        this.frameCount++;
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFrameTime = now;
            this.fpsDisplay.textContent = `${this.fps} FPS`;

            // Color based on performance
            if (this.fps >= 50) {
                this.fpsDisplay.style.color = '#4ade80';
            } else if (this.fps >= 30) {
                this.fpsDisplay.style.color = '#eab308';
            } else {
                this.fpsDisplay.style.color = '#ef4444';
            }
        }

        // Throttle stats updates
        if (now - this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = now;

        // Get stats
        const stats = this.world.getStats();
        this.updateStats(stats);
    }

    private updateStats(stats: WorldStats): void {
        this.statAgents.textContent = stats.totalAgents.toString();
        this.statFood.textContent = stats.totalFood.toString();
        this.statEnergy.textContent = stats.averageEnergy.toFixed(1);
        this.statBirthDeaths.textContent = `${stats.totalBirths}/${stats.totalDeaths}`;

        // Strategy counts
        this.countElements.get('aggressive')!.textContent = stats.strategyCounts.Aggressive.toString();
        this.countElements.get('passive')!.textContent = stats.strategyCounts.Passive.toString();
        this.countElements.get('cooperative')!.textContent = stats.strategyCounts.Cooperative.toString();
        this.countElements.get('titfortat')!.textContent = stats.strategyCounts.TitForTat.toString();
        this.countElements.get('random')!.textContent = stats.strategyCounts.Random.toString();
    }
}
