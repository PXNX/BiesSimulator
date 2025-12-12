/**
 * UI Controls - Simulation control panel
 */

import { World } from '../core/World';
import { PRESETS } from '../config/presets';
import { CONFIG } from '../config/globalConfig';
import type { StrategyType } from '../config/globalConfig';

export class Controls {
    private world: World;
    private chart?: { reset: () => void };
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

    // Parameter controls
    private foodRateSlider: HTMLInputElement;
    private foodRateValue: HTMLElement;
    private maxAgentsSlider: HTMLInputElement;
    private maxAgentsValue: HTMLElement;
    private mutationSlider: HTMLInputElement;
    private mutationValue: HTMLElement;
    private visionSlider: HTMLInputElement;
    private visionValue: HTMLElement;
    private foodValueSlider: HTMLInputElement;
    private foodValueValue: HTMLElement;
    private boundarySelect: HTMLSelectElement;
    private boundaryValue: HTMLElement;

    // Strategy ratio elements
    private ratioSliders: Map<StrategyType, HTMLInputElement> = new Map();
    private ratioValues: Map<StrategyType, HTMLElement> = new Map();

    constructor(world: World, chart?: { reset: () => void }) {
        this.world = world;
        this.chart = chart;

        // Get elements
        this.panel = document.getElementById('controls-panel')!;
        this.startBtn = document.getElementById('btn-start') as HTMLButtonElement;
        this.pauseBtn = document.getElementById('btn-pause') as HTMLButtonElement;
        this.stepBtn = document.getElementById('btn-step') as HTMLButtonElement;
        this.resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;
        this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
        this.speedValue = document.getElementById('speed-value')!;
        this.presetSelect = document.getElementById('preset-select') as HTMLSelectElement;

        // Parameter elements
        this.foodRateSlider = document.getElementById('param-foodrate') as HTMLInputElement;
        this.foodRateValue = document.getElementById('param-foodrate-val')!;
        this.maxAgentsSlider = document.getElementById('param-maxagents') as HTMLInputElement;
        this.maxAgentsValue = document.getElementById('param-maxagents-val')!;
        this.mutationSlider = document.getElementById('param-mutation') as HTMLInputElement;
        this.mutationValue = document.getElementById('param-mutation-val')!;
        this.visionSlider = document.getElementById('param-vision') as HTMLInputElement;
        this.visionValue = document.getElementById('param-vision-val')!;
        this.foodValueSlider = document.getElementById('param-foodvalue') as HTMLInputElement;
        this.foodValueValue = document.getElementById('param-foodvalue-val')!;
        this.boundarySelect = document.getElementById('param-boundarymode') as HTMLSelectElement;
        this.boundaryValue = document.getElementById('param-boundarymode-val')!;

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
        this.syncParameterUIFromConfig();
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
            this.chart?.reset();
            this.syncParameterUIFromConfig();
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
                this.chart?.reset();
                this.syncParameterUIFromConfig();
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

        // Parameter sliders/select
        this.foodRateSlider.addEventListener('input', () => {
            const value = parseFloat(this.foodRateSlider.value);
            (CONFIG as any).FOOD_RESPAWN_RATE = value;
            this.foodRateValue.textContent = `${value.toFixed(1)}/s`;
        });

        this.maxAgentsSlider.addEventListener('input', () => {
            const value = Math.round(parseFloat(this.maxAgentsSlider.value));
            (CONFIG as any).MAX_AGENTS = value;
            this.maxAgentsValue.textContent = `${value}`;
        });

        this.mutationSlider.addEventListener('input', () => {
            const value = parseFloat(this.mutationSlider.value);
            (CONFIG as any).MUTATION_CHANCE = value;
            this.mutationValue.textContent = `${Math.round(value * 100)}%`;
        });

        this.visionSlider.addEventListener('input', () => {
            const value = Math.round(parseFloat(this.visionSlider.value));
            (CONFIG as any).VISION_RADIUS = value;
            this.visionValue.textContent = `${value}px`;
        });

        this.foodValueSlider.addEventListener('input', () => {
            const value = Math.round(parseFloat(this.foodValueSlider.value));
            (CONFIG as any).FOOD_VALUE = value;
            this.foodValueValue.textContent = `${value}`;
        });

        this.boundarySelect.addEventListener('change', () => {
            const value = this.boundarySelect.value as 'bounce' | 'wrap';
            (CONFIG as any).BOUNDARY_MODE = value;
            this.boundaryValue.textContent = value;
        });

        // Debug checkboxes
        document.getElementById('debug-grid')?.addEventListener('change', (e) => {
            (CONFIG as any).SHOW_GRID = (e.target as HTMLInputElement).checked;
        });

        document.getElementById('debug-vision')?.addEventListener('change', (e) => {
            (CONFIG as any).SHOW_DEBUG_VISION = (e.target as HTMLInputElement).checked;
        });

        document.getElementById('debug-axis')?.addEventListener('change', (e) => {
            (CONFIG as any).SHOW_AXIS = (e.target as HTMLInputElement).checked;
        });

        document.getElementById('debug-trails')?.addEventListener('change', (e) => {
            (CONFIG as any).SHOW_TRAILS = (e.target as HTMLInputElement).checked;
        });

        document.getElementById('debug-effects')?.addEventListener('change', (e) => {
            (CONFIG as any).SHOW_HIT_EFFECTS = (e.target as HTMLInputElement).checked;
        });
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

    private syncParameterUIFromConfig(): void {
        this.foodRateSlider.value = CONFIG.FOOD_RESPAWN_RATE.toString();
        this.foodRateValue.textContent = `${CONFIG.FOOD_RESPAWN_RATE.toFixed(1)}/s`;

        this.maxAgentsSlider.value = CONFIG.MAX_AGENTS.toString();
        this.maxAgentsValue.textContent = `${CONFIG.MAX_AGENTS}`;

        this.mutationSlider.value = CONFIG.MUTATION_CHANCE.toString();
        this.mutationValue.textContent = `${Math.round(CONFIG.MUTATION_CHANCE * 100)}%`;

        this.visionSlider.value = CONFIG.VISION_RADIUS.toString();
        this.visionValue.textContent = `${CONFIG.VISION_RADIUS}px`;

        this.foodValueSlider.value = CONFIG.FOOD_VALUE.toString();
        this.foodValueValue.textContent = `${CONFIG.FOOD_VALUE}`;

        this.boundarySelect.value = CONFIG.BOUNDARY_MODE;
        this.boundaryValue.textContent = CONFIG.BOUNDARY_MODE;
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
