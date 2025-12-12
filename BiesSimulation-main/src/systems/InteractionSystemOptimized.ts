/**
 * Optimized Interaction System
 * High-performance version with reduced overhead
 * - Uses array indices instead of object references where possible
 * - Minimal allocations
 * - Batched processing
 * - Optional heatmap tracking (can disable for more speed)
 */

import { Agent } from '../models/Agent';
import { Food } from '../models/Food';
import { CONFIG } from '../config/globalConfig';
import type { ActionType, StrategyType } from '../config/globalConfig';
import { runtimeConfig } from '../config/runtimeConfig';
import { SpatialGrid } from '../core/SpatialGrid';
import type { EncounterResult } from '../strategies/IStrategy';
import { withPooledVector } from '../utils/ObjectPool';

export interface InteractionEvent {
    type: 'fight' | 'share' | 'consume' | 'flee';
    position: { x: number; y: number };
    agents: string[];
    timestamp: number;
}

export interface HeatmapCell {
    wins: number;
    losses: number;
    ties: number;
    total: number;
}

export type InteractionHeatmap = Record<StrategyType, Record<StrategyType, HeatmapCell>>;

export class InteractionSystemOptimized {
    private recentEvents: InteractionEvent[] = [];
    private readonly maxEvents = 50;
    private heatmap: InteractionHeatmap = this.createEmptyHeatmap();

    // Performance mode settings
    private trackHeatmap: boolean = true;
    private trackEvents: boolean = true;

    // Pre-allocated buffers
    private tempEvent: InteractionEvent = {
        type: 'consume',
        position: { x: 0, y: 0 },
        agents: [],
        timestamp: 0
    };

    resetStats(): void {
        this.recentEvents.length = 0;
        this.heatmap = this.createEmptyHeatmap();
    }

    setPerformanceMode(highPerformance: boolean): void {
        // In high performance mode, skip event and heatmap tracking
        this.trackHeatmap = !highPerformance;
        this.trackEvents = !highPerformance;
    }

    getHeatmap(): InteractionHeatmap {
        return this.heatmap;
    }

    private createEmptyHeatmap(): InteractionHeatmap {
        const strategies: StrategyType[] = ['Aggressive', 'Passive', 'Cooperative', 'TitForTat', 'Random'];
        const emptyCell = (): HeatmapCell => ({ wins: 0, losses: 0, ties: 0, total: 0 });

        const out = {} as InteractionHeatmap;
        for (let i = 0; i < strategies.length; i++) {
            const row = strategies[i];
            out[row] = {} as Record<StrategyType, HeatmapCell>;
            for (let j = 0; j < strategies.length; j++) {
                out[row][strategies[j]] = emptyCell();
            }
        }
        return out;
    }

    /**
     * Process all interactions for this tick (optimized)
     */
    update(
        tick: number,
        agents: Agent[],
        food: Food[],
        agentGrid: SpatialGrid<Agent>,
        foodGrid: SpatialGrid<Food>
    ): { removedFood: Food[], events: InteractionEvent[] } {
        const removedFood: Food[] = [];

        if (this.trackEvents) {
            this.recentEvents.length = 0;
        }

        // Update spatial grids (optimized with traditional for loop)
        for (let i = 0, len = agents.length; i < len; i++) {
            const agent = agents[i];
            if (!agent.isDead) {
                agentGrid.update(agent);
            }
        }
        for (let i = 0, len = food.length; i < len; i++) {
            const f = food[i];
            if (!f.isDead) {
                foodGrid.update(f);
            }
        }

        // Process agent-food interactions (fast path)
        const collisionRadius = CONFIG.COLLISION_RADIUS + CONFIG.FOOD_SIZE;
        const collisionRadiusSq = collisionRadius * collisionRadius;

        for (let i = 0, len = agents.length; i < len; i++) {
            const agent = agents[i];
            if (agent.isDead) continue;

            const nearbyFood = foodGrid.queryNear(agent as any, collisionRadius);

            for (let j = 0, fLen = nearbyFood.length; j < fLen; j++) {
                const f = nearbyFood[j];
                if (f.isDead) continue;

                // Fast distance check using squared distance
                const dx = agent.position.x - f.position.x;
                const dy = agent.position.y - f.position.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < collisionRadiusSq) {
                    // Consume food
                    agent.gainEnergy(f.energyValue);
                    f.isDead = true;
                    removedFood.push(f);

                    if (this.trackEvents) {
                        this.addEventFast('consume', f.position.x, f.position.y, [agent.id], tick);
                    }
                }
            }
        }

        // Process agent-agent interactions
        const interactionRadius = CONFIG.COLLISION_RADIUS * 2;

        for (let i = 0, len = agents.length; i < len; i++) {
            const agent = agents[i];
            if (agent.isDead) continue;

            const nearbyAgents = agentGrid.queryNear(agent, interactionRadius);

            for (let j = 0, nLen = nearbyAgents.length; j < nLen; j++) {
                const other = nearbyAgents[j];
                if (other.isDead) continue;

                // Check cooldown (skip if recently interacted)
                if (agent.isOnCooldown(other.id)) continue;

                // Fast distance check
                const dx = agent.position.x - other.position.x;
                const dy = agent.position.y - other.position.y;
                const distSq = dx * dx + dy * dy;
                const radiusSq = interactionRadius * interactionRadius;

                if (distSq < radiusSq) {
                    this.resolveAgentInteractionFast(tick, agent, other);
                }
            }
        }

        return { removedFood, events: this.recentEvents };
    }

    /**
     * Optimized agent interaction resolution
     */
    private resolveAgentInteractionFast(tick: number, agent1: Agent, agent2: Agent): void {
        // Both agents decide their action
        const action1 = agent1.decideAction(agent2);
        const action2 = agent2.decideAction(agent1);

        // Get payoff results
        const [outcome1, outcome2] = this.calculatePayoffFast(action1, action2);

        const interactionOccurred = action1 !== 'IGNORE' && action2 !== 'IGNORE';
        const fightCost1 = interactionOccurred && action1 === 'FIGHT' ? runtimeConfig.FIGHT_COST : 0;
        const fightCost2 = interactionOccurred && action2 === 'FIGHT' ? runtimeConfig.FIGHT_COST : 0;
        const netOutcome1 = outcome1 - fightCost1;
        const netOutcome2 = outcome2 - fightCost2;

        if (interactionOccurred && this.trackHeatmap) {
            this.trackHeatmapFast(agent1.strategyType, agent2.strategyType, netOutcome1, netOutcome2);
        }

        // Apply energy changes directly (inline for performance)
        agent1.energy = Math.max(0, Math.min(CONFIG.MAX_ENERGY, agent1.energy + outcome1 - fightCost1));
        agent2.energy = Math.max(0, Math.min(CONFIG.MAX_ENERGY, agent2.energy + outcome2 - fightCost2));

        // Apply knockback for fights
        if (action1 === 'FIGHT' || action2 === 'FIGHT') {
            const dx = agent2.position.x - agent1.position.x;
            const dy = agent2.position.y - agent1.position.y;

            withPooledVector((direction) => {
                direction.set(dx, dy).normalize();

                if (action1 === 'FIGHT') {
                    agent2.applyKnockback(direction, CONFIG.KNOCKBACK_FORCE);
                }
                if (action2 === 'FIGHT') {
                    agent1.applyKnockback(direction, -CONFIG.KNOCKBACK_FORCE);
                }
            });

            if (this.trackEvents) {
                const midX = (agent1.position.x + agent2.position.x) * 0.5;
                const midY = (agent1.position.y + agent2.position.y) * 0.5;
                this.addEventFast('fight', midX, midY, [agent1.id, agent2.id], tick);
            }
        } else if (action1 === 'SHARE' && action2 === 'SHARE') {
            if (this.trackEvents) {
                const midX = (agent1.position.x + agent2.position.x) * 0.5;
                const midY = (agent1.position.y + agent2.position.y) * 0.5;
                this.addEventFast('share', midX, midY, [agent1.id, agent2.id], tick);
            }
        } else if (action1 === 'FLEE' || action2 === 'FLEE') {
            if (this.trackEvents) {
                const midX = (agent1.position.x + agent2.position.x) * 0.5;
                const midY = (agent1.position.y + agent2.position.y) * 0.5;
                this.addEventFast('flee', midX, midY, [agent1.id, agent2.id], tick);
            }
        }

        // Update memory for learning strategies (inline)
        if (agent1.strategy.onEncounterResult) {
            const result1: EncounterResult = {
                myAction: action1,
                theirAction: action2,
                energyChange: netOutcome1,
                outcome: netOutcome1 > netOutcome2 ? 'won' : netOutcome1 < netOutcome2 ? 'lost' : 'tie',
                tick,
            };
            agent1.strategy.onEncounterResult(agent1, agent2, result1);
        }

        if (agent2.strategy.onEncounterResult) {
            const result2: EncounterResult = {
                myAction: action2,
                theirAction: action1,
                energyChange: netOutcome2,
                outcome: netOutcome2 > netOutcome1 ? 'won' : netOutcome2 < netOutcome1 ? 'lost' : 'tie',
                tick,
            };
            agent2.strategy.onEncounterResult(agent2, agent1, result2);
        }

        // Set cooldowns
        agent1.setCooldown(agent2.id);
        agent2.setCooldown(agent1.id);

        // Check for death (inline)
        if (agent1.energy <= 0) agent1.isDead = true;
        if (agent2.energy <= 0) agent2.isDead = true;
    }

    /**
     * Fast payoff calculation with lookup table
     */
    private calculatePayoffFast(action1: ActionType, action2: ActionType): [number, number] {
        const payoff = runtimeConfig.PAYOFF;

        // Handle IGNORE (early exit)
        if (action1 === 'IGNORE' || action2 === 'IGNORE') {
            return [0, 0];
        }

        // Direct lookup using string concatenation (faster than object key)
        const key = `${action1}_${action2}`;

        // Fast lookup with type assertion
        switch (key) {
            case 'FIGHT_FIGHT': return [payoff.FIGHT_FIGHT[0], payoff.FIGHT_FIGHT[1]];
            case 'FIGHT_SHARE': return [payoff.FIGHT_SHARE[0], payoff.FIGHT_SHARE[1]];
            case 'FIGHT_FLEE': return [payoff.FIGHT_FLEE[0], payoff.FIGHT_FLEE[1]];
            case 'SHARE_FIGHT': return [payoff.FIGHT_SHARE[1], payoff.FIGHT_SHARE[0]];
            case 'SHARE_SHARE': return [payoff.SHARE_SHARE[0], payoff.SHARE_SHARE[1]];
            case 'SHARE_FLEE': return [payoff.SHARE_FLEE[0], payoff.SHARE_FLEE[1]];
            case 'FLEE_FIGHT': return [payoff.FIGHT_FLEE[1], payoff.FIGHT_FLEE[0]];
            case 'FLEE_SHARE': return [payoff.SHARE_FLEE[1], payoff.SHARE_FLEE[0]];
            case 'FLEE_FLEE': return [payoff.FLEE_FLEE[0], payoff.FLEE_FLEE[1]];
            default: return [0, 0];
        }
    }

    /**
     * Fast event addition (minimal allocations)
     */
    private addEventFast(
        type: 'fight' | 'share' | 'consume' | 'flee',
        x: number,
        y: number,
        agents: string[],
        timestamp: number
    ): void {
        if (this.recentEvents.length >= this.maxEvents) {
            this.recentEvents.shift();
        }

        this.recentEvents.push({
            type,
            position: { x, y },
            agents: [...agents], // Clone array
            timestamp
        });
    }

    /**
     * Fast heatmap tracking (inline)
     */
    private trackHeatmapFast(
        strategyA: StrategyType,
        strategyB: StrategyType,
        netA: number,
        netB: number
    ): void {
        const cellAB = this.heatmap[strategyA][strategyB];
        const cellBA = this.heatmap[strategyB][strategyA];

        cellAB.total++;
        cellBA.total++;

        if (netA > netB) {
            cellAB.wins++;
            cellBA.losses++;
        } else if (netA < netB) {
            cellAB.losses++;
            cellBA.wins++;
        } else {
            cellAB.ties++;
            cellBA.ties++;
        }
    }

    /**
     * Get recent interaction events for rendering effects
     */
    getRecentEvents(): InteractionEvent[] {
        return this.recentEvents;
    }
}
