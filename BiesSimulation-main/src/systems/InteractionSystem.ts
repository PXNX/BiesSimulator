/**
 * Interaction System
 * Handles Agent-Food and Agent-Agent interactions
 * Implements payoff matrix, knockback, memory updates
 */

import { Agent } from '../models/Agent';
import { Food } from '../models/Food';
import { CONFIG } from '../config/globalConfig';
import type { ActionType } from '../config/globalConfig';
import { SpatialGrid } from '../core/SpatialGrid';
import type { EncounterResult } from '../strategies/IStrategy';
import { withPooledVector } from '../utils/ObjectPool';

export interface InteractionEvent {
    type: 'fight' | 'share' | 'consume' | 'flee';
    position: { x: number; y: number };
    agents: string[];
    timestamp: number;
}

export class InteractionSystem {
    private recentEvents: InteractionEvent[] = [];
    private readonly maxEvents = 50;

    /**
     * Process all interactions for this tick
     */
    update(
        agents: Agent[],
        food: Food[],
        agentGrid: SpatialGrid<Agent>,
        foodGrid: SpatialGrid<Food>
    ): { removedFood: Food[], events: InteractionEvent[] } {
        const removedFood: Food[] = [];
        this.recentEvents = [];

        // Update spatial grids
        for (const agent of agents) {
            if (!agent.isDead) {
                agentGrid.update(agent);
            }
        }
        for (const f of food) {
            if (!f.isDead) {
                foodGrid.update(f);
            }
        }

        // Process agent-food interactions
        for (const agent of agents) {
            if (agent.isDead) continue;

            const nearbyFood = foodGrid.queryNear(
                agent as any, // Type cast for spatial grid interface
                CONFIG.COLLISION_RADIUS + CONFIG.FOOD_SIZE
            );

            for (const f of nearbyFood) {
                if (f.isDead) continue;

                const dist = agent.position.dist(f.position);
                if (dist < CONFIG.COLLISION_RADIUS + CONFIG.FOOD_SIZE) {
                    // Consume food
                    agent.gainEnergy(f.energyValue);
                    f.isDead = true;
                    removedFood.push(f);

                    this.addEvent({
                        type: 'consume',
                        position: { x: f.position.x, y: f.position.y },
                        agents: [agent.id],
                        timestamp: Date.now(),
                    });
                }
            }
        }

        // Process agent-agent interactions
        for (const agent of agents) {
            if (agent.isDead) continue;

            const nearbyAgents = agentGrid.queryNear(
                agent,
                CONFIG.COLLISION_RADIUS * 2
            );

            for (const other of nearbyAgents) {
                if (other.isDead || other.id === agent.id) continue;

                // Check cooldown (skip if recently interacted)
                if (agent.isOnCooldown(other.id)) continue;

                const dist = agent.position.dist(other.position);
                if (dist < CONFIG.COLLISION_RADIUS * 2) {
                    this.resolveAgentInteraction(agent, other);
                }
            }
        }

        return { removedFood, events: this.recentEvents };
    }

    /**
     * Resolve interaction between two agents
     */
    private resolveAgentInteraction(agent1: Agent, agent2: Agent): void {
        // Both agents decide their action
        const action1 = agent1.decideAction(agent2);
        const action2 = agent2.decideAction(agent1);

        // Get payoff results
        const [outcome1, outcome2] = this.calculatePayoff(action1, action2);

        // Apply energy changes
        agent1.energy += outcome1;
        agent2.energy += outcome2;

        // Apply fight cost separately (payoff matrix is resource delta)
        if (action1 !== 'IGNORE' && action2 !== 'IGNORE') {
            if (action1 === 'FIGHT') agent1.energy -= CONFIG.FIGHT_COST;
            if (action2 === 'FIGHT') agent2.energy -= CONFIG.FIGHT_COST;
        }

        // Clamp to valid energy range
        agent1.energy = Math.max(0, Math.min(CONFIG.MAX_ENERGY, agent1.energy));
        agent2.energy = Math.max(0, Math.min(CONFIG.MAX_ENERGY, agent2.energy));

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

            this.addEvent({
                type: 'fight',
                position: {
                    x: (agent1.position.x + agent2.position.x) / 2,
                    y: (agent1.position.y + agent2.position.y) / 2,
                },
                agents: [agent1.id, agent2.id],
                timestamp: Date.now(),
            });
        } else if (action1 === 'SHARE' && action2 === 'SHARE') {
            this.addEvent({
                type: 'share',
                position: {
                    x: (agent1.position.x + agent2.position.x) / 2,
                    y: (agent1.position.y + agent2.position.y) / 2,
                },
                agents: [agent1.id, agent2.id],
                timestamp: Date.now(),
            });
        } else if (action1 === 'FLEE' || action2 === 'FLEE') {
            this.addEvent({
                type: 'flee',
                position: {
                    x: (agent1.position.x + agent2.position.x) / 2,
                    y: (agent1.position.y + agent2.position.y) / 2,
                },
                agents: [agent1.id, agent2.id],
                timestamp: Date.now(),
            });
        }

        // Update memory for learning strategies
        const result1: EncounterResult = {
            myAction: action1,
            theirAction: action2,
            energyChange: outcome1,
            outcome: outcome1 > outcome2 ? 'won' : outcome1 < outcome2 ? 'lost' : 'tie',
        };
        const result2: EncounterResult = {
            myAction: action2,
            theirAction: action1,
            energyChange: outcome2,
            outcome: outcome2 > outcome1 ? 'won' : outcome2 < outcome1 ? 'lost' : 'tie',
        };

        // Notify strategies of result
        if (agent1.strategy.onEncounterResult) {
            agent1.strategy.onEncounterResult(agent1, agent2, result1);
        }
        if (agent2.strategy.onEncounterResult) {
            agent2.strategy.onEncounterResult(agent2, agent1, result2);
        }

        // Set cooldowns to prevent immediate re-interaction
        agent1.setCooldown(agent2.id);
        agent2.setCooldown(agent1.id);

        // Check for death
        if (agent1.energy <= 0) agent1.isDead = true;
        if (agent2.energy <= 0) agent2.isDead = true;
    }

    /**
     * Calculate payoff based on action pair
     * Returns [agent1 outcome, agent2 outcome]
     */
    private calculatePayoff(action1: ActionType, action2: ActionType): [number, number] {
        const payoff = CONFIG.PAYOFF;

        // Handle IGNORE (no interaction)
        if (action1 === 'IGNORE' || action2 === 'IGNORE') {
            return [0, 0];
        }

        // Map actions to payoff matrix
        const key = `${this.normalizeAction(action1)}_${this.normalizeAction(action2)}` as keyof typeof payoff;
        const reverseKey = `${this.normalizeAction(action2)}_${this.normalizeAction(action1)}` as keyof typeof payoff;

        if (payoff[key]) {
            return [payoff[key][0], payoff[key][1]];
        } else if (payoff[reverseKey]) {
            // Reverse the outcomes
            return [payoff[reverseKey][1], payoff[reverseKey][0]];
        }

        // Default: no effect
        return [0, 0];
    }

    /**
     * Normalize action names for payoff lookup
     */
    private normalizeAction(action: ActionType): string {
        return action.toUpperCase();
    }

    /**
     * Add an interaction event
     */
    private addEvent(event: InteractionEvent): void {
        this.recentEvents.push(event);
        if (this.recentEvents.length > this.maxEvents) {
            this.recentEvents.shift();
        }
    }

    /**
     * Get recent interaction events for rendering effects
     */
    getRecentEvents(): InteractionEvent[] {
        return this.recentEvents;
    }
}
