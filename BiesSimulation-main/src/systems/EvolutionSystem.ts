/**
 * Evolution System
 * Handles reproduction, death, and population management
 */

import { Agent } from '../models/Agent';
import { CONFIG, getWorldDimensions } from '../config/globalConfig';
import type { StrategyType } from '../config/globalConfig';
import { mutateTraits } from '../models/Traits';
import type { Traits } from '../models/Traits';
import { Vector2 } from '../models/Vector2';
import { getStrategyTypes } from '../strategies/index';
import { random, randomInt, randomRange } from '../utils/RNG';

export interface EvolutionStats {
    births: number;
    deaths: number;
    totalBirths: number;
    totalDeaths: number;
}

export class EvolutionSystem {
    private stats: EvolutionStats = {
        births: 0,
        deaths: 0,
        totalBirths: 0,
        totalDeaths: 0,
    };

    constructor(
        private createAgent: (
            x: number,
            y: number,
            strategyType: StrategyType,
            traits?: Partial<Traits>
        ) => Agent = (x, y, strategyType, traits) => new Agent(x, y, strategyType, traits)
    ) { }

    /**
     * Update evolution for all agents
     * Returns new agents born this tick
     */
    update(agents: Agent[]): { newAgents: Agent[], deadAgents: Agent[] } {
        const newAgents: Agent[] = [];
        const deadAgents: Agent[] = [];

        // Reset per-tick stats
        this.stats.births = 0;
        this.stats.deaths = 0;

        for (const agent of agents) {
            if (agent.isDead) {
                deadAgents.push(agent);
                this.stats.deaths++;
                this.stats.totalDeaths++;
                continue;
            }

            // Check for death (energy depleted)
            if (agent.energy <= 0) {
                agent.isDead = true;
                deadAgents.push(agent);
                this.stats.deaths++;
                this.stats.totalDeaths++;
                continue;
            }

            // Check for natural death by age
            if (agent.age >= CONFIG.MAX_AGE) {
                agent.isDead = true;
                deadAgents.push(agent);
                this.stats.deaths++;
                this.stats.totalDeaths++;
                continue;
            }

            // Check for reproduction
            if (this.canReproduce(agent, agents.length)) {
                const child = this.reproduce(agent);
                if (child) {
                    newAgents.push(child);
                    this.stats.births++;
                    this.stats.totalBirths++;
                }
            }
        }

        // Ensure minimum population
        const aliveCount = agents.filter(a => !a.isDead).length + newAgents.length;
        if (aliveCount < CONFIG.MIN_AGENTS) {
            const needed = CONFIG.MIN_AGENTS - aliveCount;
            for (let i = 0; i < needed; i++) {
                const agent = this.spawnRandomAgent();
                newAgents.push(agent);
                this.stats.births++;
                this.stats.totalBirths++;
            }
        }

        return { newAgents, deadAgents };
    }

    /**
     * Check if an agent can reproduce
     */
    private canReproduce(agent: Agent, currentPopulation: number): boolean {
        return (
            agent.energy >= CONFIG.REPRODUCTION_THRESHOLD &&
            agent.reproductionCooldown <= 0 &&
            currentPopulation < CONFIG.MAX_AGENTS &&
            !agent.isDead
        );
    }

    /**
     * Create a child agent from parent
     */
    private reproduce(parent: Agent): Agent | null {
        // Deduct reproduction cost
        const energyCost = CONFIG.REPRODUCTION_COST;
        parent.energy -= energyCost;
        parent.reproductionCooldown = CONFIG.REPRODUCTION_COOLDOWN;

        // Calculate spawn position (nearby parent)
        const { width, height } = getWorldDimensions();
        const offset = Vector2.random().mult(30 + randomRange(0, 20));
        const childX = Math.max(10, Math.min(width - 10, parent.position.x + offset.x));
        const childY = Math.max(10, Math.min(height - 10, parent.position.y + offset.y));

        // Determine child's strategy (with potential mutation)
        let childStrategy: StrategyType = parent.strategyType;
        if (random() < CONFIG.STRATEGY_MUTATION_CHANCE) {
            const strategies = getStrategyTypes();
            childStrategy = strategies[randomInt(strategies.length)];
        }

        // Mutate traits if applicable
        let childTraits = { ...parent.traits };
        if (random() < CONFIG.MUTATION_CHANCE) {
            childTraits = mutateTraits(parent.traits, CONFIG.MUTATION_STRENGTH);
        }

        // Create child
        const child = this.createAgent(childX, childY, childStrategy, childTraits);

        // Child starts with portion of reproductive energy cost
        child.energy = energyCost * CONFIG.CHILD_ENERGY_RATIO;

        return child;
    }

    /**
     * Spawn a random agent (for minimum population maintenance)
     */
    private spawnRandomAgent(): Agent {
        const { width, height } = getWorldDimensions();
        const x = randomRange(20, width - 20);
        const y = randomRange(20, height - 20);

        const strategies = getStrategyTypes();
        const strategy = strategies[randomInt(strategies.length)];

        return this.createAgent(x, y, strategy);
    }

    /**
     * Get current evolution statistics
     */
    getStats(): EvolutionStats {
        return { ...this.stats };
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.stats = {
            births: 0,
            deaths: 0,
            totalBirths: 0,
            totalDeaths: 0,
        };
    }
}
