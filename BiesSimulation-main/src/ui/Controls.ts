/**
 * UI Controls - Simulation control panel
 */

import { World } from '../core/World';
import { PRESETS } from '../config/presets';
import { CONFIG } from '../config/globalConfig';
import type { StrategyType } from '../config/globalConfig';

export class Controls {
    private world: World;
    private isCollapsed: boolean = false;

    // DOM Elements
    private panel: HTMLElement;
    private startBtn: HTMLButtonElement;
    private pauseBtn: HTMLButtonElement;
    private stepBtn: HTMLButtonElement;
    private resetBtn: HTMLButtonElement;
    private speedSlider: HTMLInputElement;
    private speedValue: HTMLElement;
    private presetSelect: HTMLSelectElement;

    // Strategy ratio elements
    private ratioSliders: Map<StrategyType, HTMLInputElement> = new Map();
    private ratioValues: Map<StrategyType, HTMLElement> = new Map();

    constructor(world: World) {
        this.world = world;

        // Get elements
        this.panel = document.getElementById('controls-panel')!;
        this.startBtn = document.getElementById('btn-start') as HTMLButtonElement;
        this.pauseBtn = document.getElementById('btn-pause') as HTMLButtonElement;
        this.stepBtn = document.getElementById('btn-step') as HTMLButtonElement;
        this.resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;
        this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
        this.speedValue = document.getElementById('speed-value')!;
        this.presetSelect = document.getElementById('preset-select') as HTMLSelectElement;

        // Initialize strategy sliders
        const strategies: StrategyType[] = ['Aggressive', 'Passive', 'Cooperative', 'TitForTat', 'Random'];
        for (const strategy of strategies) {
            const key = strategy.toLowerCase();
            this.ratioSliders.set(
                strategy,
                document.getElementById(`ratio-${key}`) as HTMLInputElement
            );
            this.ratioValues.set(
                strategy,
                document.getElementById(`ratio-${key}-val`)!
            );
        }

        this.setupEventListeners();
        this.updateUI();
    }

    private setupEventListeners(): void {
        // Toggle panel collapse
        document.getElementById('toggle-controls')?.addEventListener('click', () => {
            this.isCollapsed = !this.isCollapsed;
            this.panel.classList.toggle('collapsed', this.isCollapsed);
        });

        // Start button
        this.startBtn.addEventListener('click', () => {
            this.world.paused = false;
            this.updateUI();
        });

        // Pause button
        this.pauseBtn.addEventListener('click', () => {
            this.world.paused = true;
            this.updateUI();
        });

        // Step button
        this.stepBtn.addEventListener('click', () => {
            this.world.step();
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => {
            const ratios = this.getStrategyRatios();
            this.world.reset({
                agentCount: CONFIG.INITIAL_AGENT_COUNT,
                foodCount: CONFIG.INITIAL_FOOD_COUNT,
                strategyRatios: ratios,
            });
            this.updateUI();
        });

        // Speed slider
        this.speedSlider.addEventListener('input', () => {
            const value = parseFloat(this.speedSlider.value);
            this.world.timeScale = value;
            this.speedValue.textContent = `${value.toFixed(1)}x`;
        });

        // Preset select
        this.presetSelect.addEventListener('change', () => {
            const presetName = this.presetSelect.value;
            const preset = PRESETS[presetName];
            if (preset) {
                this.world.loadPreset(preset);
                this.updateRatioSliders(preset.strategyRatios);
                this.updateUI();
            }
        });

        // Strategy ratio sliders
        for (const [strategy, slider] of this.ratioSliders) {
            slider.addEventListener('input', () => {
                const value = parseInt(slider.value);
                const valueEl = this.ratioValues.get(strategy);
                if (valueEl) {
                    valueEl.textContent = `${value}%`;
                }
            });
        }

        // Parameter sliders
        this.setupParameterSlider('param-foodrate', (value) => {
            (CONFIG as any).FOOD_RESPAWN_RATE = value;
            document.getElementById('param-foodrate-val')!.textContent = `${value.toFixed(1)}/s`;
        });

        this.setupParameterSlider('param-maxagents', (value) => {
            (CONFIG as any).MAX_AGENTS = Math.round(value);
            document.getElementById('param-maxagents-val')!.textContent = `${Math.round(value)}`;
        });

        this.setupParameterSlider('param-mutation', (value) => {
            (CONFIG as any).MUTATION_CHANCE = value;
            document.getElementById('param-mutation-val')!.textContent = `${Math.round(value * 100)}%`;
        });

        // Debug checkboxes
        document.getElementById('debug-grid')?.addEventListener('change', (e) => {
            (CONFIG as any).SHOW_GRID = (e.target as HTMLInputElement).checked;
        });

        document.getElementById('debug-vision')?.addEventListener('change', (e) => {
            (CONFIG as any).SHOW_DEBUG_VISION = (e.target as HTMLInputElement).checked;
        });
    }

    private setupParameterSlider(id: string, callback: (value: number) => void): void {
        const slider = document.getElementById(id) as HTMLInputElement;
        if (slider) {
            slider.addEventListener('input', () => {
                callback(parseFloat(slider.value));
            });
        }
    }

    private getStrategyRatios(): Record<StrategyType, number> {
        const ratios: Record<StrategyType, number> = {
            Aggressive: 0,
            Passive: 0,
            Cooperative: 0,
            TitForTat: 0,
            Random: 0,
        };

        for (const [strategy, slider] of this.ratioSliders) {
            ratios[strategy] = parseInt(slider.value) / 100;
        }

        // Normalize to sum to 1
        const total = Object.values(ratios).reduce((a, b) => a + b, 0);
        if (total > 0) {
            for (const key of Object.keys(ratios) as StrategyType[]) {
                ratios[key] /= total;
            }
        }

        return ratios;
    }

    private updateRatioSliders(ratios: Record<StrategyType, number>): void {
        for (const [strategy, ratio] of Object.entries(ratios)) {
            const slider = this.ratioSliders.get(strategy as StrategyType);
            const valueEl = this.ratioValues.get(strategy as StrategyType);
            if (slider && valueEl) {
                const pct = Math.round(ratio * 100);
                slider.value = pct.toString();
                valueEl.textContent = `${pct}%`;
            }
        }
    }

    private updateUI(): void {
        // Update button states
        this.startBtn.style.display = this.world.paused ? 'block' : 'none';
        this.pauseBtn.style.display = this.world.paused ? 'none' : 'block';

        // Update speed
        this.speedSlider.value = this.world.timeScale.toString();
        this.speedValue.textContent = `${this.world.timeScale.toFixed(1)}x`;
    }
}
