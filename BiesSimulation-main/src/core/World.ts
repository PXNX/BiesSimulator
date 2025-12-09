/**
 * World - Main simulation container
 * Manages agents, food, systems, and spatial grids
 */

import { Agent } from '../models/Agent';
import { Food } from '../models/Food';
import { MovementSystem } from '../systems/MovementSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { Sprites } from '../renderer/Sprites';
import { SpatialGrid } from './SpatialGrid';
import { CONFIG, getWorldDimensions } from '../config/globalConfig';
import type { StrategyType } from '../config/globalConfig';
import { pickRandomStrategy } from '../strategies/index';
import { DEFAULT_PRESET } from '../config/presets';
import type { SimulationPreset } from '../config/presets';

export interface WorldConfig {
    agentCount?: number;
    foodCount?: number;
    strategyRatios?: Record<StrategyType, number>;
}

export class World {
    public agents: Agent[] = [];
    public food: Food[] = [];

    // Systems
    private movementSystem: MovementSystem;
    private interactionSystem: InteractionSystem;

    // Spatial grids for efficient lookups
    private agentGrid: SpatialGrid<Agent>;
    private foodGrid: SpatialGrid<Food>;

    // Renderer helper
    private sprites: Sprites | null = null;

    // Current configuration
    private config: WorldConfig;

    constructor(config?: WorldConfig) {
        this.config = config || {
            agentCount: DEFAULT_PRESET.agentCount,
            foodCount: DEFAULT_PRESET.foodCount,
            strategyRatios: DEFAULT_PRESET.strategyRatios,
        };

        // Initialize systems
        this.movementSystem = new MovementSystem();
        this.interactionSystem = new InteractionSystem();

        // Initialize spatial grids
        const { width, height } = getWorldDimensions();
        const cellSize = CONFIG.VISION_RADIUS;
        this.agentGrid = new SpatialGrid<Agent>(width, height, cellSize);
        this.foodGrid = new SpatialGrid<Food>(width, height, cellSize);

        this.init();
    }

    /**
     * Initialize the world with agents and food
     */
    init(): void {
        this.agents = [];
        this.food = [];
        this.agentGrid.clear();
        this.foodGrid.clear();

        const agentCount = this.config.agentCount || CONFIG.INITIAL_AGENT_COUNT;
        const foodCount = this.config.foodCount || CONFIG.INITIAL_FOOD_COUNT;
        const strategyRatios = this.config.strategyRatios || CONFIG.STRATEGY_SPAWN;

        // Spawn agents with strategies based on ratios
        for (let i = 0; i < agentCount; i++) {
            const strategyType = pickRandomStrategy(strategyRatios);
            this.spawnAgent(strategyType);
        }

        // Spawn initial food
        for (let i = 0; i < foodCount; i++) {
            this.spawnFood();
        }
    }

    /**
     * Reset the world to initial state
     */
    reset(config?: WorldConfig): void {
        if (config) {
            this.config = config;
        }
        this.init();
    }

    /**
     * Load a preset configuration
     */
    loadPreset(preset: SimulationPreset): void {
        this.config = {
            agentCount: preset.agentCount,
            foodCount: preset.foodCount,
            strategyRatios: preset.strategyRatios,
        };
        this.init();
    }

    /**
     * Spawn an agent at a random position
     */
    spawnAgent(strategyType?: StrategyType): Agent {
        const pos = this.getRandomPosition();
        const agent = new Agent(pos.x, pos.y, strategyType);
        this.agents.push(agent);
        this.agentGrid.insert(agent);
        return agent;
    }

    /**
     * Spawn an agent at a specific position
     */
    spawnAgentAt(x: number, y: number, strategyType?: StrategyType): Agent {
        const pos = this.clampToBounds(x, y);
        const agent = new Agent(pos.x, pos.y, strategyType);
        this.agents.push(agent);
        this.agentGrid.insert(agent);
        return agent;
    }

    /**
     * Spawn food at a random position
     */
    spawnFood(): Food {
        const pos = this.getRandomPosition();
        const food = new Food(pos.x, pos.y);
        this.food.push(food);
        this.foodGrid.insert(food);
        return food;
    }

    /**
     * Spawn food at a specific position
     */
    spawnFoodAt(x: number, y: number): Food {
        const pos = this.clampToBounds(x, y);
        const food = new Food(pos.x, pos.y);
        this.food.push(food);
        this.foodGrid.insert(food);
        return food;
    }

    /**
     * Get a random position within world bounds
     */
    private getRandomPosition(): { x: number; y: number } {
        const { width, height } = getWorldDimensions();
        const margin = CONFIG.BOUNDARY_MARGIN;
        return {
            x: margin + Math.random() * (width - margin * 2),
            y: margin + Math.random() * (height - margin * 2),
        };
    }

    /**
     * Clamp coordinates to world bounds
     */
    private clampToBounds(x: number, y: number): { x: number; y: number } {
        const { width, height } = getWorldDimensions();
        const margin = 5;
        return {
            x: Math.max(margin, Math.min(width - margin, x)),
            y: Math.max(margin, Math.min(height - margin, y)),
        };
    }

    /**
     * Update world state
     */
    update(delta: number): void {
        // Update spatial grids on resize
        const { width, height } = getWorldDimensions();
        this.agentGrid.resize(width, height);
        this.foodGrid.resize(width, height);

        // Run movement system
        this.movementSystem.update(this.agents, delta);

        // Update physics for all agents
        for (const agent of this.agents) {
            if (!agent.isDead) {
                agent.updatePhysics(delta);
            }
        }

        // Run interaction system
        const { removedFood } = this.interactionSystem.update(
            this.agents,
            this.food,
            this.agentGrid,
            this.foodGrid
        );

        // Remove consumed food from grid
        for (const f of removedFood) {
            this.foodGrid.remove(f);
        }

        // Clean up dead entities
        this.cleanup();
    }

    /**
     * Remove dead agents and consumed food
     */
    private cleanup(): void {
        // Remove dead agents
        const deadAgents = this.agents.filter(a => a.isDead);
        for (const agent of deadAgents) {
            this.agentGrid.remove(agent);
        }
        this.agents = this.agents.filter(a => !a.isDead);

        // Remove consumed food
        const deadFood = this.food.filter(f => f.isDead);
        for (const f of deadFood) {
            this.foodGrid.remove(f);
        }
        this.food = this.food.filter(f => !f.isDead);
    }

    /**
     * Render the world
     */
    render(renderer: CanvasRenderer): void {
        const ctx = renderer.getContext();
        renderer.clear();

        // Initialize sprites if needed
        if (!this.sprites) {
            this.sprites = new Sprites(ctx);
        }

        // Draw debug grid if enabled
        if (CONFIG.SHOW_GRID) {
            renderer.drawGrid();
        }

        // Draw food
        for (const f of this.food) {
            if (!f.isDead) {
                this.sprites.drawFood(f);
            }
        }

        // Draw agents
        for (const agent of this.agents) {
            if (!agent.isDead) {
                this.sprites.drawAgent(agent, CONFIG.SHOW_DEBUG_VISION);
            }
        }

        // Draw interaction effects
        const events = this.interactionSystem.getRecentEvents();
        const now = Date.now();
        for (const event of events) {
            const age = now - event.timestamp;
            const duration = 500; // Effect duration in ms
            if (age < duration) {
                const progress = age / duration;
                this.sprites.drawInteractionEffect(
                    event.position.x,
                    event.position.y,
                    event.type === 'fight' ? 'fight' :
                        event.type === 'consume' ? 'consume' : 'share',
                    progress
                );
            }
        }
    }

    /**
     * Get statistics about the current world state
     */
    getStats(): WorldStats {
        const strategyCounts: Record<StrategyType, number> = {
            Aggressive: 0,
            Passive: 0,
            Cooperative: 0,
            TitForTat: 0,
            Random: 0,
        };

        let totalEnergy = 0;

        for (const agent of this.agents) {
            if (!agent.isDead) {
                strategyCounts[agent.strategyType]++;
                totalEnergy += agent.energy;
            }
        }

        return {
            totalAgents: this.agents.filter(a => !a.isDead).length,
            totalFood: this.food.filter(f => !f.isDead).length,
            strategyCounts,
            averageEnergy: this.agents.length > 0 ? totalEnergy / this.agents.length : 0,
        };
    }
}

export interface WorldStats {
    totalAgents: number;
    totalFood: number;
    strategyCounts: Record<StrategyType, number>;
    averageEnergy: number;
}
