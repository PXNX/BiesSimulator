/**
 * UI Controls - Simulation control panel
 */

import { World } from '../core/World';
import { PRESETS } from '../config/presets';
import { CONFIG } from '../config/globalConfig';
import type { StrategyType } from '../config/globalConfig';
import { getSeed } from '../utils/RNG';
import { resetRuntimeConfig, runtimeConfig } from '../config/runtimeConfig';
import type { PayoffKey } from '../config/runtimeConfig';

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
    private expertToggleBtn?: HTMLButtonElement;
    private expertIconBtn?: HTMLButtonElement;
    private guideBtn?: HTMLButtonElement;
    private onboardingBtn?: HTMLButtonElement;
    private speedSlider: HTMLInputElement;
    private speedValue: HTMLElement;
    private presetSelect: HTMLSelectElement;
    private seedInput: HTMLInputElement;
    private seedCopyBtn: HTMLButtonElement;
    private configCopyBtn: HTMLButtonElement;
    private configPasteBtn: HTMLButtonElement;
    private configText: HTMLTextAreaElement;
    private configStatus: HTMLElement;
    private ruleFightCostInput: HTMLInputElement;
    private ruleFoodValueInput: HTMLInputElement;
    private ruleResetBtn: HTMLButtonElement;
    private payoffInputs: Array<{ key: PayoffKey; idx: 0 | 1; el: HTMLInputElement }> = [];

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
    // private advancedSections: NodeListOf<HTMLElement>;
    private expertMode: boolean = false;

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
        this.expertToggleBtn = document.getElementById('btn-expert-toggle') as HTMLButtonElement;
        this.expertIconBtn = document.getElementById('btn-expert-mode') as HTMLButtonElement;
        this.guideBtn = document.getElementById('btn-guide') as HTMLButtonElement;
        this.onboardingBtn = document.getElementById('btn-onboarding') as HTMLButtonElement;
        this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
        this.speedValue = document.getElementById('speed-value')!;
        this.presetSelect = document.getElementById('preset-select') as HTMLSelectElement;
        this.seedInput = document.getElementById('seed-input') as HTMLInputElement;
        this.seedCopyBtn = document.getElementById('seed-copy') as HTMLButtonElement;
        this.configCopyBtn = document.getElementById('config-copy') as HTMLButtonElement;
        this.configPasteBtn = document.getElementById('config-paste') as HTMLButtonElement;
        this.configText = document.getElementById('config-text') as HTMLTextAreaElement;
        this.configStatus = document.getElementById('config-status')!;
        this.ruleFightCostInput = document.getElementById('rule-fight-cost') as HTMLInputElement;
        this.ruleFoodValueInput = document.getElementById('rule-food-value') as HTMLInputElement;
        this.ruleResetBtn = document.getElementById('rule-reset') as HTMLButtonElement;

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
        // this.advancedSections = document.querySelectorAll('.advanced-section');

        this.payoffInputs = this.getPayoffInputBindings().map(({ id, key, idx }) => ({
            key,
            idx,
            el: document.getElementById(id) as HTMLInputElement,
        }));

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
        this.syncSeedUIFromRng();
        this.syncGameRulesUIFromRuntimeConfig();
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
                seed: this.parseSeed(this.seedInput.value) ?? getSeed(),
            });
            this.chart?.reset();
            this.syncParameterUIFromConfig();
            this.syncSeedUIFromRng();
            this.updateUI();
        });

        // Expert / Guide
        const expertLocal = localStorage.getItem('bies-expert-mode');
        if (expertLocal === '0') {
            this.setExpertMode(false);
        } else {
            this.setExpertMode(true); // default: alles sichtbar
        }
        this.expertToggleBtn?.addEventListener('click', () => this.toggleExpertMode());
        this.expertIconBtn?.addEventListener('click', () => this.toggleExpertMode());
        this.onboardingBtn?.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('onboarding:start'));
        });
        this.guideBtn?.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('onboarding:start'));
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
                this.syncSeedUIFromRng();
                this.syncGameRulesUIFromRuntimeConfig();
                this.updateUI();
            }
        });

        // Seed input + copy
        this.seedInput.addEventListener('blur', () => {
            if (this.seedInput.value.trim() === '') {
                this.syncSeedUIFromRng();
            }
        });

        this.seedCopyBtn.addEventListener('click', async () => {
            const value = this.seedInput.value.trim();
            if (!value) return;
            await this.copyToClipboard(value);
        });

        // Config export/import
        this.configCopyBtn.addEventListener('click', async () => {
            const json = JSON.stringify(this.buildExportConfig(), null, 2);
            this.configText.value = json;
            await this.copyToClipboard(json);
            this.setStatus('Config copied to clipboard.');
        });

        this.configPasteBtn.addEventListener('click', async () => {
            const text = await this.readClipboardTextOrTextarea();
            if (!text.trim()) {
                this.setStatus('No config found (clipboard/textarea empty).');
                return;
            }

            try {
                const parsed = JSON.parse(text);
                this.applyImportedConfig(parsed);
                this.setStatus('Config applied.');
            } catch (err) {
                console.error('Failed to import config', err);
                this.setStatus('Invalid config JSON.');
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
            this.setFoodValue(value);
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

        // Game rules
        this.ruleFightCostInput.addEventListener('input', () => {
            const value = Number.parseInt(this.ruleFightCostInput.value, 10);
            if (!Number.isFinite(value)) return;
            runtimeConfig.FIGHT_COST = Math.max(0, value);
            this.ruleFightCostInput.value = `${runtimeConfig.FIGHT_COST}`;
        });

        this.ruleFoodValueInput.addEventListener('input', () => {
            const value = Number.parseInt(this.ruleFoodValueInput.value, 10);
            if (!Number.isFinite(value)) return;
            this.setFoodValue(value);
        });

        for (const binding of this.payoffInputs) {
            binding.el.addEventListener('input', () => {
                const value = Number.parseInt(binding.el.value, 10);
                if (!Number.isFinite(value)) return;
                runtimeConfig.PAYOFF[binding.key][binding.idx] = value;
                binding.el.value = `${runtimeConfig.PAYOFF[binding.key][binding.idx]}`;
            });
        }

        this.ruleResetBtn.addEventListener('click', () => {
            resetRuntimeConfig();
            this.syncParameterUIFromConfig();
            this.syncGameRulesUIFromRuntimeConfig();
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

    toggleExpertMode(force?: boolean): void {
        const enabled = force != null ? force : !this.expertMode;
        this.setExpertMode(enabled);
    }

    setExpertMode(enabled: boolean): void {
        this.expertMode = enabled;
        document.body.classList.toggle('advanced-hidden', !enabled);
        if (enabled) {
            localStorage.setItem('bies-expert-mode', '1');
        } else {
            localStorage.setItem('bies-expert-mode', '0');
        }
        if (this.expertToggleBtn) {
            this.expertToggleBtn.textContent = enabled ? 'Expert: ON' : 'Expert Mode';
        }
        if (this.expertIconBtn) {
            this.expertIconBtn.textContent = enabled ? '✓' : '★';
            this.expertIconBtn.title = enabled ? 'Expert mode enabled' : 'Expert mode';
        }
    }

    setSpeedMultiplier(multiplier: number): void {
        const clamped = Math.max(
            parseFloat(this.speedSlider.min),
            Math.min(parseFloat(this.speedSlider.max), multiplier)
        );
        this.speedSlider.value = `${clamped}`;
        this.world.timeScale = clamped;
        this.speedValue.textContent = `${clamped.toFixed(1)}x`;
    }

    selectPreset(name: string): void {
        if (!PRESETS[name as keyof typeof PRESETS]) return;
        this.presetSelect.value = name;
        const event = new Event('change');
        this.presetSelect.dispatchEvent(event);
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

        this.foodValueSlider.value = `${this.clampRangeValue(this.foodValueSlider, runtimeConfig.FOOD_VALUE)}`;
        this.foodValueValue.textContent = `${runtimeConfig.FOOD_VALUE}`;

        this.boundarySelect.value = CONFIG.BOUNDARY_MODE;
        this.boundaryValue.textContent = CONFIG.BOUNDARY_MODE;
    }

    private syncGameRulesUIFromRuntimeConfig(): void {
        this.ruleFightCostInput.value = `${runtimeConfig.FIGHT_COST}`;
        this.ruleFoodValueInput.value = `${runtimeConfig.FOOD_VALUE}`;

        for (const binding of this.payoffInputs) {
            binding.el.value = `${runtimeConfig.PAYOFF[binding.key][binding.idx]}`;
        }
    }

    private syncSeedUIFromRng(): void {
        this.seedInput.value = `${getSeed()}`;
    }

    private updateUI(): void {
        // Update button states
        this.startBtn.style.display = this.world.paused ? 'block' : 'none';
        this.pauseBtn.style.display = this.world.paused ? 'none' : 'block';

        // Update speed
        this.speedSlider.value = this.world.timeScale.toString();
        this.speedValue.textContent = `${this.world.timeScale.toFixed(1)}x`;
    }

    private setFoodValue(value: number): void {
        const next = Math.max(0, Math.round(value));
        runtimeConfig.FOOD_VALUE = next;
        this.foodValueValue.textContent = `${runtimeConfig.FOOD_VALUE}`;
        this.ruleFoodValueInput.value = `${runtimeConfig.FOOD_VALUE}`;
        this.foodValueSlider.value = `${this.clampRangeValue(this.foodValueSlider, runtimeConfig.FOOD_VALUE)}`;
    }

    private clampRangeValue(input: HTMLInputElement, value: number): number {
        const min = Number.parseFloat(input.min || '0');
        const max = Number.parseFloat(input.max || `${value}`);
        return Math.max(min, Math.min(max, value));
    }

    private parseSeed(raw: string): number | string | undefined {
        const value = raw.trim();
        if (!value) return undefined;

        if (/^-?\d+$/.test(value)) {
            const n = Number.parseInt(value, 10);
            if (Number.isFinite(n)) return n;
        }

        return value;
    }

    private async copyToClipboard(text: string): Promise<void> {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        el.remove();
    }

    private async readClipboardTextOrTextarea(): Promise<string> {
        if (navigator.clipboard?.readText) {
            try {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) return text;
            } catch {
                // ignore and fall back
            }
        }
        return this.configText.value;
    }

    private setStatus(message: string): void {
        this.configStatus.textContent = message;
        window.setTimeout(() => {
            if (this.configStatus.textContent === message) {
                this.configStatus.textContent = '';
            }
        }, 2500);
    }

    private buildExportConfig(): any {
        const seed = this.parseSeed(this.seedInput.value) ?? getSeed();
        const ratios = this.getStrategyRatios();
        const { agentCount, foodCount } = this.world.getConfig();

        return {
            version: 1,
            seed,
            world: {
                agentCount,
                foodCount,
                strategyRatios: ratios,
            },
            params: {
                foodRespawnRate: CONFIG.FOOD_RESPAWN_RATE,
                maxAgents: CONFIG.MAX_AGENTS,
                mutationChance: CONFIG.MUTATION_CHANCE,
                visionRadius: CONFIG.VISION_RADIUS,
                boundaryMode: CONFIG.BOUNDARY_MODE,
            },
            rules: {
                fightCost: runtimeConfig.FIGHT_COST,
                foodValue: runtimeConfig.FOOD_VALUE,
                payoff: runtimeConfig.PAYOFF,
            },
        };
    }

    private applyImportedConfig(raw: any): void {
        if (!raw || typeof raw !== 'object') {
            throw new Error('Config must be an object');
        }

        const version = raw.version ?? 1;
        if (version !== 1) {
            throw new Error(`Unsupported config version: ${version}`);
        }

        const seed = this.parseSeed(`${raw.seed ?? ''}`) ?? getSeed();

        const worldCfg = raw.world ?? {};
        const params = raw.params ?? {};
        const rules = raw.rules ?? {};

        if (typeof params.foodRespawnRate === 'number') (CONFIG as any).FOOD_RESPAWN_RATE = params.foodRespawnRate;
        if (typeof params.maxAgents === 'number') (CONFIG as any).MAX_AGENTS = Math.round(params.maxAgents);
        if (typeof params.mutationChance === 'number') (CONFIG as any).MUTATION_CHANCE = params.mutationChance;
        if (typeof params.visionRadius === 'number') (CONFIG as any).VISION_RADIUS = Math.round(params.visionRadius);
        if (params.boundaryMode === 'bounce' || params.boundaryMode === 'wrap') (CONFIG as any).BOUNDARY_MODE = params.boundaryMode;

        if (typeof rules.fightCost === 'number') runtimeConfig.FIGHT_COST = Math.max(0, Math.round(rules.fightCost));
        if (typeof rules.foodValue === 'number') runtimeConfig.FOOD_VALUE = Math.max(0, Math.round(rules.foodValue));
        if (rules.payoff && typeof rules.payoff === 'object') {
            for (const key of Object.keys(runtimeConfig.PAYOFF) as PayoffKey[]) {
                const tuple = rules.payoff[key];
                if (Array.isArray(tuple) && tuple.length === 2) {
                    const a = Number.parseInt(tuple[0], 10);
                    const b = Number.parseInt(tuple[1], 10);
                    if (Number.isFinite(a) && Number.isFinite(b)) {
                        runtimeConfig.PAYOFF[key][0] = a;
                        runtimeConfig.PAYOFF[key][1] = b;
                    }
                }
            }
        }

        // Strategy ratios (normalize + validate)
        const ratiosIn = worldCfg.strategyRatios;
        const ratiosOut: Record<StrategyType, number> = {
            Aggressive: 0,
            Passive: 0,
            Cooperative: 0,
            TitForTat: 0,
            Random: 0,
        };
        if (ratiosIn && typeof ratiosIn === 'object') {
            for (const key of Object.keys(ratiosOut) as StrategyType[]) {
                const v = ratiosIn[key];
                if (typeof v === 'number' && Number.isFinite(v)) ratiosOut[key] = Math.max(0, v);
            }
        }
        const total = Object.values(ratiosOut).reduce((a, b) => a + b, 0);
        if (total > 0) {
            for (const key of Object.keys(ratiosOut) as StrategyType[]) {
                ratiosOut[key] /= total;
            }
        } else {
            // Fallback: keep existing ratios
            Object.assign(ratiosOut, this.getStrategyRatios());
        }

        this.seedInput.value = `${seed}`;
        this.world.reset({
            agentCount: typeof worldCfg.agentCount === 'number' ? Math.round(worldCfg.agentCount) : undefined,
            foodCount: typeof worldCfg.foodCount === 'number' ? Math.round(worldCfg.foodCount) : undefined,
            strategyRatios: ratiosOut,
            seed,
        });

        this.updateRatioSliders(ratiosOut);
        this.chart?.reset();
        this.syncParameterUIFromConfig();
        this.syncGameRulesUIFromRuntimeConfig();
        this.updateUI();
    }

    private getPayoffInputBindings(): Array<{ id: string; key: PayoffKey; idx: 0 | 1 }> {
        return [
            { id: 'payoff-fight_fight-0', key: 'FIGHT_FIGHT', idx: 0 },
            { id: 'payoff-fight_fight-1', key: 'FIGHT_FIGHT', idx: 1 },
            { id: 'payoff-fight_share-0', key: 'FIGHT_SHARE', idx: 0 },
            { id: 'payoff-fight_share-1', key: 'FIGHT_SHARE', idx: 1 },
            { id: 'payoff-fight_flee-0', key: 'FIGHT_FLEE', idx: 0 },
            { id: 'payoff-fight_flee-1', key: 'FIGHT_FLEE', idx: 1 },
            { id: 'payoff-share_share-0', key: 'SHARE_SHARE', idx: 0 },
            { id: 'payoff-share_share-1', key: 'SHARE_SHARE', idx: 1 },
            { id: 'payoff-share_flee-0', key: 'SHARE_FLEE', idx: 0 },
            { id: 'payoff-share_flee-1', key: 'SHARE_FLEE', idx: 1 },
            { id: 'payoff-flee_flee-0', key: 'FLEE_FLEE', idx: 0 },
            { id: 'payoff-flee_flee-1', key: 'FLEE_FLEE', idx: 1 },
        ];
    }
}
